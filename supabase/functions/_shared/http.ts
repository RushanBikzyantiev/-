export const siteOrigin = Deno.env.get('SITE_ORIGIN') || 'https://rushanbikzyantiev.github.io';

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === siteOrigin ? origin : siteOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function yookassaAuthorization(): string {
  const shopId = Deno.env.get('YOOKASSA_SHOP_ID');
  const secret = Deno.env.get('YOOKASSA_SECRET_KEY');
  if (!shopId || !secret) throw new Error('ЮKassa не настроена');
  return `Basic ${btoa(`${shopId}:${secret}`)}`;
}

