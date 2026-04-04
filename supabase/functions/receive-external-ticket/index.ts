import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key header
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("EXTERNAL_API_KEY");
    if (expectedKey && apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Validate required fields
    const { source_system, title, description, priority, external_reference, external_payload, requester_email, service_name, category_name } = body;

    if (!source_system || !title || !description || !requester_email) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["source_system", "title", "description", "requester_email"],
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validSources = ["ERP", "LMS", "CPAY", "PORTAL", "SIS", "EDUMALLS", "SMART_SCHOOL", "DASHBOARD", "HR"];
    if (!validSources.includes(source_system)) {
      return new Response(JSON.stringify({
        error: `Invalid source_system. Must be one of: ${validSources.join(", ")}`,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create requester profile
    let { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", requester_email)
      .single();

    if (!profile) {
      // Create user via admin API
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: requester_email,
        email_confirm: true,
        password: crypto.randomUUID(),
        user_metadata: { full_name: body.requester_name || requester_email.split("@")[0] },
      });

      if (authError && !authError.message.includes("already")) {
        throw new Error(`Failed to create user: ${authError.message}`);
      }

      if (authUser?.user) {
        profile = { id: authUser.user.id };
      } else {
        // User might already exist, try to find again
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", requester_email)
          .single();
        profile = existingProfile;
      }
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: "Could not find or create requester" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve service and category if provided
    let service_id = null;
    let category_id = null;
    let department_id = null;

    if (service_name) {
      const { data: service } = await supabase
        .from("services")
        .select("id, default_assignment_group")
        .ilike("name", service_name)
        .single();
      if (service) {
        service_id = service.id;
        department_id = service.default_assignment_group;
      }
    }

    if (category_name && service_id) {
      const { data: category } = await supabase
        .from("service_categories")
        .select("id")
        .eq("service_id", service_id)
        .ilike("name", category_name)
        .single();
      if (category) category_id = category.id;
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        title,
        description,
        priority: priority || "medium",
        requester_id: profile.id,
        source_system,
        external_reference: external_reference || null,
        external_payload: external_payload || null,
        service_id,
        category_id,
        department_id,
      })
      .select("id, ticket_number, code, status, priority, created_at")
      .single();

    if (ticketError) throw ticketError;

    return new Response(JSON.stringify({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        code: ticket.code,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
      },
    }), {
      status: 201,
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
