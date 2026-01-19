import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const emailPayloadSchema = z.object({
  type: z.enum(["appointment_confirmation", "appointment_reminder", "appointment_cancelled"]),
  appointmentId: z.string().uuid("Invalid appointment ID").optional(),
  recipientEmail: z.string().email("Invalid email format").max(255, "Email too long"),
  recipientName: z.string().min(1, "Recipient name required").max(100, "Name too long"),
  doctorName: z.string().min(1, "Doctor name required").max(100, "Doctor name too long"),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
  appointmentType: z.string().max(50, "Appointment type too long").optional(),
});

type EmailPayload = z.infer<typeof emailPayloadSchema>;

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

function getEmailContent(payload: EmailPayload): { subject: string; html: string } {
  const formattedTime = formatTime(payload.appointmentTime);
  const formattedDate = new Date(payload.appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  switch (payload.type) {
    case "appointment_confirmation":
      return {
        subject: `Appointment Confirmed - ${formattedDate}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Appointment Confirmed</h1>
              </div>
              <div class="content">
                <p>Dear ${payload.recipientName},</p>
                <p>Your appointment has been successfully scheduled. Here are the details:</p>
                <div class="details">
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <p><strong>Time:</strong> ${formattedTime}</p>
                  <p><strong>Doctor:</strong> ${payload.doctorName}</p>
                  <p><strong>Type:</strong> ${payload.appointmentType}</p>
                </div>
                <p>Please arrive 15 minutes before your scheduled time.</p>
                <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
                <p>Best regards,<br><strong>Africa Care Kit Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from Africa Care Kit Healthcare System</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "appointment_reminder":
      return {
        subject: `Reminder: Appointment Tomorrow - ${formattedDate}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Appointment Reminder</h1>
              </div>
              <div class="content">
                <p>Dear ${payload.recipientName},</p>
                <p>This is a friendly reminder about your upcoming appointment:</p>
                <div class="details">
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <p><strong>Time:</strong> ${formattedTime}</p>
                  <p><strong>Doctor:</strong> ${payload.doctorName}</p>
                  <p><strong>Type:</strong> ${payload.appointmentType}</p>
                </div>
                <p>Please remember to:</p>
                <ul>
                  <li>Arrive 15 minutes early</li>
                  <li>Bring your ID and insurance card</li>
                  <li>Bring any relevant medical records</li>
                </ul>
                <p>Best regards,<br><strong>Africa Care Kit Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from Africa Care Kit Healthcare System</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "appointment_cancelled":
      return {
        subject: `Appointment Cancelled - ${formattedDate}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Appointment Cancelled</h1>
              </div>
              <div class="content">
                <p>Dear ${payload.recipientName},</p>
                <p>Your appointment has been cancelled. Here were the details:</p>
                <div class="details">
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <p><strong>Time:</strong> ${formattedTime}</p>
                  <p><strong>Doctor:</strong> ${payload.doctorName}</p>
                  <p><strong>Type:</strong> ${payload.appointmentType}</p>
                </div>
                <p>If you would like to reschedule, please book a new appointment through our system.</p>
                <p>Best regards,<br><strong>Africa Care Kit Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from Africa Care Kit Healthcare System</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Africa Care Kit - Notification",
        html: "<p>You have a new notification from Africa Care Kit.</p>",
      };
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      console.log("Auth error:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Authenticated user:", claimsData.claims.sub);

    const rawBody = await req.json();
    console.log("Raw email payload:", JSON.stringify(rawBody));

    const parseResult = emailPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.log("Validation failed:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = parseResult.data;
    const { type, appointmentId, recipientEmail } = body;

    const { subject, html } = getEmailContent({
      ...body,
      appointmentType: body.appointmentType || "General",
    });

    console.log(`Sending ${type} email to ${recipientEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Africa Care Kit <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
        type,
        recipientEmail,
        appointmentId,
        sentAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
