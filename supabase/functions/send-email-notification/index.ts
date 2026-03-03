import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticket_id, event_type, recipient_email, recipient_name, ticket_number, ticket_title, details } = await req.json();

    if (!ticket_id || !event_type || !recipient_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subjectMap: Record<string, string> = {
      status_changed: `تحديث حالة التذكرة #${ticket_number}`,
      assigned: `تم تعيين التذكرة #${ticket_number} لك`,
      comment_added: `تعليق جديد على التذكرة #${ticket_number}`,
      sla_warning: `⚠️ تنبيه SLA - التذكرة #${ticket_number}`,
      resolved: `✅ تم حل التذكرة #${ticket_number}`,
      created: `تذكرة جديدة #${ticket_number}`,
    };

    const subject = subjectMap[event_type] || `تحديث التذكرة #${ticket_number}`;

    // Log the email notification (in production, integrate with email service)
    console.log(`📧 Email notification:
      To: ${recipient_email} (${recipient_name})
      Subject: ${subject}
      Event: ${event_type}
      Ticket: #${ticket_number} - ${ticket_title}
      Details: ${details || "N/A"}
    `);

    // Store notification record
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", recipient_email)
      .single();

    if (profile) {
      await supabase.from("notifications").insert({
        user_id: profile.id,
        ticket_id,
        title: subject,
        message: details || subject,
        type: event_type,
      });
    }

    return new Response(JSON.stringify({ success: true, subject }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
