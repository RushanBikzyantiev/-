import { createClient } from '@supabase/supabase-js';

let client = null;
let config = null;

export async function initializeBackend() {
  try {
    const response = await fetch('./config.json', { cache: 'no-store' });
    if (!response.ok) return false;
    const loaded = await response.json();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(loaded.supabaseUrl || '') ||
        !loaded.publishableKey || !loaded.databaseReady) return false;
    config = loaded;
    client = createClient(config.supabaseUrl, config.publishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    });
    return true;
  } catch (_) { return false; }
}

export const backend = () => client;

export async function sendLoginLink(email) {
  if (!client) throw new Error('Авторизация пока не подключена.');
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${location.origin}${location.pathname}` },
  });
  if (error) throw error;
}

export async function getIdentity() {
  if (!client) return { user: null, role: 'guest', paid: false };
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { user: null, role: 'guest', paid: false };
  const [{ data: role }, { data: entitlement }] = await Promise.all([
    client.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
    client.from('course_entitlements').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  return { user, role: role?.role || 'student', paid: Boolean(entitlement) };
}

export async function startPayment() {
  if (!client) throw new Error('Оплата пока не подключена.');
  if (!config.paymentsReady) throw new Error('Приём оплаты настраивается. Скоро можно будет открыть полный курс.');
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error('Войдите в аккаунт, чтобы оплатить курс.');
  const response = await fetch(`${config.supabaseUrl}/functions/v1/start-payment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: config.publishableKey,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Не удалось начать оплату.');
  return result;
}
