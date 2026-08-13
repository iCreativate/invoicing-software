import crypto from 'crypto';

export type PayFastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  sandbox?: boolean;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
};

export function getPayFastEndpoint(sandbox?: boolean) {
  return sandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
}

function encodeKV(v: string) {
  // PayFast uses standard URL encoding with spaces as + in signature string
  return encodeURIComponent(v).replace(/%20/g, '+');
}

export function buildPayFastPaymentUrl(input: {
  config: PayFastConfig;
  mPaymentId: string; // our payment session id
  amount: number; // ZAR amount
  itemName: string;
  itemDescription?: string;
  emailAddress?: string;
  /** When set, creates a PayFast subscription (recurring billing). */
  subscription?: {
    frequency: 3 | 4 | 5 | 6; // 3=monthly, 4=quarterly, 5=biannual, 6=annual
    cycles: number; // 0 = until cancelled
  };
}): { endpoint: string; params: Record<string, string>; signature: string; url: string } {
  const { config } = input;
  const params: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: config.returnUrl,
    cancel_url: config.cancelUrl,
    notify_url: config.notifyUrl,
    m_payment_id: input.mPaymentId,
    amount: Number(input.amount).toFixed(2),
    item_name: input.itemName,
  };

  if (input.itemDescription) params.item_description = input.itemDescription;
  if (input.emailAddress) params.email_address = input.emailAddress;

  if (input.subscription) {
    params.subscription_type = '1';
    params.billing_date = new Date().toISOString().slice(0, 10);
    params.recurring_amount = Number(input.amount).toFixed(2);
    params.frequency = String(input.subscription.frequency);
    params.cycles = String(input.subscription.cycles);
  }

  const signatureString =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${encodeKV(params[k]!)}`)
      .join('&') + (config.passphrase ? `&passphrase=${encodeKV(config.passphrase)}` : '');

  const signature = crypto.createHash('md5').update(signatureString).digest('hex');
  params.signature = signature;

  const endpoint = getPayFastEndpoint(config.sandbox);
  const url = `${endpoint}?${Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeKV(params[k]!)}`)
    .join('&')}`;

  return { endpoint, params, signature, url };
}

export function verifyPayFastSignature(body: Record<string, string>, passphrase?: string) {
  // Expects body already parsed as key-values (strings)
  const data: Record<string, string> = { ...body };
  const provided = String(data.signature ?? '');
  delete data.signature;

  const signatureString =
    Object.keys(data)
      .sort()
      .map((k) => `${k}=${encodeKV(String(data[k] ?? ''))}`)
      .join('&') + (passphrase ? `&passphrase=${encodeKV(passphrase)}` : '');

  const computed = crypto.createHash('md5').update(signatureString).digest('hex');
  return { ok: computed === provided, computed, provided };
}

