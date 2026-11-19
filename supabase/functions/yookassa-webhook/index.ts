import { createClient } from 'npm:@supabase/supabase-js@2';
import { yookassaAuthorization } from '../_shared/http.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const notification = await request.json();
    const providerId = notification?.object?.id;
    if (typeof providerId !== 'string' || providerId.length > 100) return new Response('Invalid payment', { status: 400 });

    // YooKassa notifications are not trusted. Fetch the payment from YooKassa before granting access.
    const checkResponse = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(providerId)}`, {
      headers: { Authorization: yookassaAuthorization() },
    });
    if (!checkResponse.ok) return new Response('Could not verify payment', { status: 503 });
    const payment = await checkResponse.json();
    const localId = payment?.metadata?.course_payment_id;
    const userId = payment?.metadata?.user_id;
    if (payment.id !== providerId || !uuidPattern.test(localId || '') || !uuidPattern.test(userId || '')) {
      return new Response('Invalid payment metadata', { status: 400 });
    }

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });
    const { data: local, error: findError } = await db.from('course_payments')
      .select('id,user_id,amount_kopecks,currency,provider_payment_id,status').eq('id', localId).single();
    if (findError || !local || local.user_id !== userId || local.amount_kopecks !== 299000 ||
        local.currency !== 'RUB' || (local.provider_payment_id && local.provider_payment_id !== providerId)) {
      return new Response('Payment mismatch', { status: 400 });
    }
    if (payment.amount?.value !== '2990.00' || payment.amount?.currency !== 'RUB') {
      return new Response('Amount mismatch', { status: 400 });
    }

    const nextStatus = ['succeeded', 'canceled', 'waiting_for_capture'].includes(payment.status)
      ? payment.status : 'pending';
    const { error: updateError } = await db.from('course_payments').update({
      status: nextStatus, provider_payment_id: providerId, updated_at: new Date().toISOString(),
    }).eq('id', localId);
    if (updateError) throw updateError;
    if (payment.status === 'succeeded' && payment.paid === true && payment.captured_at) {
      const { error: entitlementError } = await db.from('course_entitlements').upsert({
        user_id: userId, source: 'yookassa', payment_id: localId,
      }, { onConflict: 'user_id' });
      if (entitlementError) throw entitlementError;
    }
    return new Response('OK');
  } catch (error) {
    console.error('yookassa-webhook failed', error instanceof Error ? error.message : String(error));
    return new Response('Temporary error', { status: 503 });
  }
});
