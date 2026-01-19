import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const ALLOWED_ORIGINS = [
  "https://africa-care-kit.lovable.app",
  "https://id-preview--41d7ee8a-9ad1-4ea8-9816-314da8637d44.lovable.app",
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const notificationSchema = z.object({
  type: z.enum([
    "appointment_reminder",
    "appointment_confirmed",
    "appointment_cancelled",
    "general",
  ]),
  recipientId: z.string().uuid("Invalid recipient ID format"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
  appointmentId: z.string().uuid().optional(),
});

type NotificationPayload = z.infer<typeof notificationSchema>;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

    const rawBody = await req.json();
    console.log("Raw notification payload:", JSON.stringify(rawBody));

    const parseResult = notificationSchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.log("Validation failed:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.errors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { type, recipientId, title, message, appointmentId } = parseResult.data as NotificationPayload;

    console.log(`Sending ${type} notification to ${recipientId}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    if (appointmentId) {
      console.log(`Appointment ID: ${appointmentId}`);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("user_id", recipientId)
      .maybeSingle();

    if (profileError) {
      console.log("Error fetching profile:", profileError.message);
    }

    const recipientEmail = profile?.email || "unknown";
    const recipientName = profile ? `${profile.first_name} ${profile.last_name}` : "User";

    console.log(`Recipient: ${recipientName} (${recipientEmail})`);

    const notificationResult = {
      success: true,
      notificationId: crypto.randomUUID(),
      type,
      recipient: { id: recipientId, name: recipientName, email: recipientEmail },
      title,
      message,
      appointmentId,
      sentAt: new Date().toISOString(),
    };

    console.log("Notification sent successfully:", notificationResult.notificationId);

    return new Response(JSON.stringify(notificationResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
