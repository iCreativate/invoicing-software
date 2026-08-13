/**
 * Creates (or updates) TimelyInvoices demo auth users + company profiles.
 *
 * Usage (from apps/web):
 *   node --env-file=.env.local scripts/seed-demo-users.mjs
 *
 * Credentials are printed at the end. Do not use these passwords in production
 * without rotating them.
 */

import { createClient } from '@supabase/supabase-js';

const PASSWORD = process.env.DEMO_PASSWORD?.trim();
if (!PASSWORD) {
  console.error('Set DEMO_PASSWORD in the environment before seeding.');
  process.exit(1);
}

const ACCOUNTS = [
  {
    email: 'demo@timelyinvoices.app',
    company_name: 'Demo Studio',
    subscription_plan: 'free',
    label: 'Free',
  },
  {
    email: 'demo.pro@timelyinvoices.app',
    company_name: 'Cape Creative',
    subscription_plan: 'pro',
    label: 'Pro',
  },
  {
    email: 'demo.business@timelyinvoices.app',
    company_name: 'Harbour Collective',
    subscription_plan: 'business',
    label: 'Business',
  },
];

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing ${name}. Load apps/web/.env.local via --env-file.`);
    process.exit(1);
  }
  return v;
}

async function ensureUser(admin, { email, company_name }) {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (list.error) throw list.error;
  const existing = (list.data?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { company_name },
    });
    if (error) throw error;
    return { user: data.user, created: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { company_name },
  });
  if (error) throw error;
  return { user: data.user, created: true };
}

async function ensureCompanyProfile(admin, ownerId, { company_name, subscription_plan, email }) {
  const { data: row, error: selErr } = await admin
    .from('company_profiles')
    .select('id,subscription_plan')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (!row) {
    const { error } = await admin.from('company_profiles').insert({
      owner_id: ownerId,
      company_name,
      email,
      subscription_plan,
    });
    if (error) throw error;
    return 'insert';
  }

  const { error } = await admin
    .from('company_profiles')
    .update({ company_name, email, subscription_plan })
    .eq('owner_id', ownerId);
  if (error) throw error;
  return 'update';
}

async function ensureSampleClient(admin, ownerId) {
  const { data: existing, error: selErr } = await admin
    .from('clients')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('email', 'client@example.co.za')
    .maybeSingle();
  if (selErr) {
    // clients table / columns may differ; non-fatal
    console.warn('  skip sample client:', selErr.message);
    return;
  }
  if (existing) return;

  const { error } = await admin.from('clients').insert({
    owner_id: ownerId,
    name: 'Acme Retail',
    email: 'client@example.co.za',
    phone: '+27821234567',
  });
  if (error) console.warn('  skip sample client:', error.message);
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('Seeding demo logins…\n');
  const results = [];

  for (const account of ACCOUNTS) {
    const { user, created } = await ensureUser(admin, account);
    const profile = await ensureCompanyProfile(admin, user.id, {
      company_name: account.company_name,
      subscription_plan: account.subscription_plan,
      email: account.email,
    });
    await ensureSampleClient(admin, user.id);
    results.push({ ...account, id: user.id, created, profile });
    console.log(
      `✓ ${account.label.padEnd(8)} ${account.email}  (${created ? 'created' : 'updated'}, profile ${profile})`
    );
  }

  console.log('\nSeeded accounts (password not printed):');
  for (const r of results) {
    console.log(`  ${r.email}  — ${r.label} / ${r.company_name}`);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err?.message || err);
  process.exit(1);
});
