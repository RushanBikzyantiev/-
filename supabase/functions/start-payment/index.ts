import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json, siteOrigin, yookassaAuthorization } from '../_shared/http.ts';

const PRICE_KOPECKS = 299000;

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Метод не поддерживается' }, 405);
  if (request.headers.get('origin') !== siteOrigin) return json(request, { error: 'Недопустимый источник' }, 403);

  const jwt = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(request, { error: 'Войдите в аккаунт' }, 401);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return json(request, { error: 'Сервис временно недоступен' }, 503);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: authError } = await db.auth.getUser(jwt);
  const user = userData.user;
  if (authError || !user || !user.email_confirmed_at) return json(request, { error: 'Подтвердите адрес электронной почты' }, 401);

  const [{ data: role }, { data: entitlement }] = await Promise.all([
    db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
    db.from('course_entitlements').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  if (role?.role === 'admin' || entitlement) return json(request, { alreadyAccess: true });

  try {
    const paymentId = crypto.randomUUID();
    const { error: insertError } = await db.from('course_payments').insert({
      id: paymentId, user_id: user.id, amount_kopecks: PRICE_KOPECKS, currency: 'RUB', status: 'pending',
    });
    if (insertError) throw insertError;

    const paymentResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: yookassaAuthorization(),
        'Content-Type': 'application/json',
        'Idempotence-Key': paymentId,
      },
      body: JSON.stringify({
        amount: { value: '2990.00', currency: 'RUB' },
        capture: true,
        confirmation: { type: 'redirect', return_url: `${siteOrigin}/-/?payment=return` },
        description: 'Полный курс SQL — Запрос',
        metadata: { course_payment_id: paymentId, user_id: user.id },
      }),
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || !payment.id || !payment.confirmation?.confirmation_url) {
      await db.from('course_payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentId);
      return json(request, { error: 'Не удалось создать платёж. Попробуйте позже.' }, 502);
    }
    const { error: updateError } = await db.from('course_payments').update({
      provider_payment_id: payment.id, updated_at: new Date().toISOString(),
    }).eq('id', paymentId);
    if (updateError) throw updateError;
    return json(request, { confirmationUrl: payment.confirmation.confirmation_url });
  } catch (error) {
    console.error('start-payment failed', error instanceof Error ? error.message : String(error));
    return json(request, { error: 'Не удалось начать оплату. Попробуйте позже.' }, 500);
  }
});

