import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("غير مصرح");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey);
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !caller) throw new Error("غير مصرح");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();
    if (!roleData || roleData.role !== "admin") throw new Error("صلاحيات غير كافية");

    const { subject, body, target, test_email } = await req.json();
    if (!subject || !body) {
      return new Response(JSON.stringify({ error: "الموضوع والمحتوى مطلوبان" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "خدمة البريد غير مهيئة (RESEND_API_KEY مفقود)" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get sender config from system_settings
    let senderName = "TicketFlow";
    let senderAddress = "notify@ticketflow.a.com";
    const { data: senderSettings } = await adminClient
      .from("system_settings")
      .select("key, value")
      .in("key", ["email_sender_name", "email_sender_address"]);
    if (senderSettings) {
      senderSettings.forEach((s: any) => {
        if (s.key === "email_sender_name" && s.value) senderName = s.value;
        if (s.key === "email_sender_address" && s.value) senderAddress = s.value;
      });
    }

    // Build user list
    let users: any[] = [];

    if (target === "test" && test_email) {
      users = [{ email: test_email, full_name: "مستخدم اختبار" }];
    } else {
      let query = adminClient.from("profiles").select("email, full_name").eq("is_active", true);

      if (target && target !== "all") {
        const { data: targetUsers } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("role", target);
        const userIds = (targetUsers || []).map((u: any) => u.user_id);
        if (userIds.length === 0) {
          return new Response(JSON.stringify({ sent_count: 0, message: "لا يوجد مستخدمين في هذه الفئة" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        query = query.in("id", userIds);
      }

      const { data: fetchedUsers } = await query;
      users = fetchedUsers || [];
    }

    if (users.length === 0) {
      return new Response(JSON.stringify({ sent_count: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const batchSize = 10;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const promises = batch.map(async (user: any) => {
        try {
          const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
body{font-family:'Tajawal',sans-serif;background:#f5f5f5;margin:0;padding:40px 20px}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#2d8b6e,#1a5c47);padding:24px 32px;color:#fff}
.header h1{margin:0;font-size:20px;font-weight:700}
.body{padding:32px}
.body p{line-height:1.8;color:#333;margin:0 0 16px}
.greeting{font-size:15px;color:#555;margin-bottom:20px}
.content{background:#f9fafb;border-radius:8px;padding:20px;border:1px solid #e5e7eb;white-space:pre-wrap}
.footer{padding:20px 32px;text-align:center;color:#999;font-size:11px;border-top:1px solid #eee}
</style></head>
<body><div class="container">
<div class="header"><h1>📢 ${subject}</h1></div>
<div class="body">
<p class="greeting">مرحباً ${user.full_name || 'عزيزي المستخدم'}،</p>
<div class="content">${body.replace(/\n/g, '<br>')}</div>
</div>
<div class="footer">هذا الإشعار مُرسل من نظام ${senderName}</div>
</div></body></html>`;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: `${senderName} <${senderAddress}>`,
              to: [user.email],
              subject: `📢 ${subject}`,
              html: htmlContent,
            }),
          });
          if (res.ok) sentCount++;
        } catch (e) {
          console.error(`Failed to send to ${user.email}:`, e);
        }
      });
      await Promise.all(promises);
    }

    return new Response(JSON.stringify({ success: true, sent_count: sentCount, total: users.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === "غير مصرح" ? 401 : msg === "صلاحيات غير كافية" ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
