import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, ticketId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch ticket context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let ticketContext = "";
    if (ticketId) {
      const { data: ticket } = await sb
        .from("tickets")
        .select("title, description, priority, status, code, created_at, services(name, systems(name)), departments(name)")
        .eq("id", ticketId)
        .single();

      if (ticket) {
        const { data: comments } = await sb
          .from("ticket_comments")
          .select("content, created_at, note_type")
          .eq("ticket_id", ticketId)
          .eq("note_type", "public")
          .order("created_at", { ascending: true })
          .limit(20);

        ticketContext = `
معلومات التذكرة:
- الكود: ${ticket.code}
- العنوان: ${ticket.title}
- الوصف: ${ticket.description}
- الحالة: ${ticket.status}
- الأولوية: ${ticket.priority}
- النظام: ${(ticket as any).services?.systems?.name || "غير محدد"}
- الخدمة: ${(ticket as any).services?.name || "غير محدد"}
- القسم: ${(ticket as any).departments?.name || "غير محدد"}
- تاريخ الإنشاء: ${ticket.created_at}

التعليقات السابقة:
${(comments || []).map((c: any) => `[${c.created_at}]: ${c.content}`).join("\n")}
`;
      }
    }

    const systemPrompt = `أنت مساعد ذكي لنظام تذاكر الدعم الفني. مهمتك مساعدة المستخدمين في حل مشاكلهم التقنية وتقديم إرشادات واضحة ومفيدة.

قواعد مهمة:
- أجب دائماً باللغة العربية
- كن مختصراً ومفيداً
- إذا كانت المشكلة تحتاج تدخل بشري، أخبر المستخدم بذلك
- قدم خطوات واضحة ومرقمة لحل المشكلة
- لا تخترع معلومات غير موجودة في سياق التذكرة

${ticketContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يلزم إضافة رصيد للاستمرار" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ticket-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
