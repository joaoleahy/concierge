import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invitationId }: InvitationEmailRequest = await req.json();

    // Fetch invitation with hotel info
    const { data: invitation, error: invitationError } = await supabase
      .from("staff_invitations")
      .select(`
        *,
        hotels!inner(name)
      `)
      .eq("id", invitationId)
      .single();

    if (invitationError || !invitation) {
      throw new Error("Convite não encontrado");
    }

    const baseUrl = req.headers.get("origin") || Deno.env.get("APP_URL") || "https://hotelconcierge.app";
    const inviteUrl = `${baseUrl}/login?invite=${invitation.token}`;

    const emailResponse = await resend.emails.send({
      from: "HotelConcierge <onboarding@resend.dev>",
      to: [invitation.email],
      subject: `Convite para equipe - ${invitation.hotels.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e3a5f; }
            .content { background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px; }
            .button { display: inline-block; background: #1e3a5f; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏨 HotelConcierge.ai</div>
            </div>
            <div class="content">
              <h2>Você foi convidado!</h2>
              <p>Você recebeu um convite para fazer parte da equipe do <strong>${invitation.hotels.name}</strong> como <strong>${invitation.role === 'admin' ? 'Administrador' : 'Staff'}</strong>.</p>
              <p>Clique no botão abaixo para criar sua conta e aceitar o convite:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" class="button">Aceitar Convite</a>
              </p>
              <p style="color: #666; font-size: 14px;">Este convite expira em 7 dias.</p>
            </div>
            <div class="footer">
              <p>Se você não esperava este email, pode ignorá-lo.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
