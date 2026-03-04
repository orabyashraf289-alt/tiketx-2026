import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find overdue pending approvals that have a deadline and haven't been escalated
    const { data: overdueApprovals, error: fetchError } = await supabase
      .from("ticket_approvals")
      .select(
        "id, ticket_id, stage_id, deadline_at, approval_stages(stage_name, escalation_to)"
      )
      .eq("status", "pending")
      .eq("is_escalated", false)
      .not("deadline_at", "is", null)
      .lt("deadline_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    let escalatedCount = 0;

    for (const approval of overdueApprovals || []) {
      const stage = approval.approval_stages as any;
      const escalationTo = stage?.escalation_to;

      // Mark as escalated
      await supabase
        .from("ticket_approvals")
        .update({
          is_escalated: true,
          ...(escalationTo ? { delegated_to: escalationTo } : {}),
        })
        .eq("id", approval.id);

      // Get ticket info for notification
      const { data: ticket } = await supabase
        .from("tickets")
        .select("ticket_number, requester_id")
        .eq("id", approval.ticket_id)
        .single();

      // Notify escalation target
      if (escalationTo && ticket) {
        await supabase.from("notifications").insert({
          user_id: escalationTo,
          ticket_id: approval.ticket_id,
          title: "تصعيد اعتماد ⚠️",
          message: `تم تصعيد مرحلة "${stage?.stage_name}" للتذكرة #${ticket.ticket_number} إليك بسبب تأخر الاعتماد`,
          type: "approval_escalated",
        });
      }

      // Notify requester
      if (ticket) {
        await supabase.from("notifications").insert({
          user_id: ticket.requester_id,
          ticket_id: approval.ticket_id,
          title: "تصعيد مرحلة اعتماد",
          message: `تم تصعيد مرحلة "${stage?.stage_name}" للتذكرة #${ticket.ticket_number} بسبب تأخر الاعتماد`,
          type: "approval_escalated",
        });
      }

      escalatedCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        escalated: escalatedCount,
        checked: overdueApprovals?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
