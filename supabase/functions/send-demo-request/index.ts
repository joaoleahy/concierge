import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DemoRequestData {
  name: string;
  email: string;
  hotelName: string;
  rooms?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, hotelName, rooms, message }: DemoRequestData = await req.json();

    if (!name || !email || !hotelName) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send notification email to sales team
    const salesEmailResponse = await resend.emails.send({
      from: "HotelConcierge <onboarding@resend.dev>",
      to: ["contato@hotelconcierge.ai"], // Replace with actual sales email
      reply_to: email,
      subject: `🏨 Nova Solicitação de Demo - ${hotelName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; }
            .field { margin-bottom: 15px; }
            .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 16px; color: #333; margin-top: 4px; }
            .footer { padding: 15px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🏨 Nova Solicitação de Demo</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nome</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Hotel</div>
                <div class="value">${hotelName}</div>
              </div>
              ${rooms ? `
              <div class="field">
                <div class="label">Número de Quartos</div>
                <div class="value">${rooms}</div>
              </div>
              ` : ''}
              ${message ? `
              <div class="field">
                <div class="label">Mensagem</div>
                <div class="value">${message}</div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              Responda diretamente a este email para entrar em contato com o lead.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Send confirmation email to the lead
    const confirmationEmailResponse = await resend.emails.send({
      from: "HotelConcierge <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos sua solicitação de demo - HotelConcierge.ai",
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
            .footer { text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏨 HotelConcierge.ai</div>
            </div>
            <div class="content">
              <h2>Olá, ${name}!</h2>
              <p>Obrigado pelo interesse no HotelConcierge.ai! Recebemos sua solicitação de demonstração para o <strong>${hotelName}</strong>.</p>
              <p>Nossa equipe entrará em contato em até <strong>24 horas</strong> para agendar uma demonstração personalizada da plataforma.</p>
              <p>Enquanto isso, fique à vontade para responder este email se tiver alguma dúvida.</p>
              <p>Até breve!<br><strong>Equipe HotelConcierge.ai</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático. Você pode responder diretamente para falar com nossa equipe.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Emails sent successfully:", { salesEmailResponse, confirmationEmailResponse });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending demo request emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
