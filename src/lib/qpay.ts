// QPay V2 API Integration for pajama.mn
// Documentation: https://developer.qpay.mn

interface QPayAuthResponse {
  token_type: string;
  refresh_expires_in: number;
  refresh_token: string;
  access_token: string;
  expires_in: number;
  scope: string;
  session_state: string;
}

interface QPayInvoiceRequest {
  invoice_code: string;
  sender_invoice_no: string;
  invoice_receiver_code: string;
  invoice_description: string;
  amount: number;
  callback_url: string;
}

interface QPayUrl {
  name: string;
  description: string;
  logo: string;
  link: string;
}

interface QPayInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  qPay_shortUrl: string;
  urls: QPayUrl[];
}

interface QPayPaymentCheckResponse {
  count: number;
  paid_amount: number;
  rows: Array<{
    payment_id: string;
    payment_status: string;
    payment_date: string;
    payment_fee: string;
    payment_amount: string;
    payment_currency: string;
    payment_wallet: string;
    transaction_type: string;
  }>;
}

const QPAY_URL = process.env.QPAY_URL || "https://merchant.qpay.mn/v2";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
  ).toString("base64");

  const response = await fetch(`${QPAY_URL}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`QPay auth failed: ${response.statusText}`);
  }

  const data: QPayAuthResponse = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function createQPayInvoice(
  orderNumber: string,
  amount: number,
  description: string
): Promise<QPayInvoiceResponse> {
  const token = await getAccessToken();
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/qpay/callback?order=${orderNumber}`;

  const invoiceData: QPayInvoiceRequest = {
    invoice_code: process.env.QPAY_INVOICE_CODE!,
    sender_invoice_no: orderNumber,
    invoice_receiver_code: "terminal",
    invoice_description: description,
    amount,
    callback_url: callbackUrl,
  };

  const response = await fetch(`${QPAY_URL}/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QPay invoice creation failed: ${errorText}`);
  }

  return response.json();
}

export async function checkQPayPayment(
  invoiceId: string
): Promise<QPayPaymentCheckResponse> {
  const token = await getAccessToken();

  const response = await fetch(`${QPAY_URL}/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`QPay payment check failed: ${response.statusText}`);
  }

  return response.json();
}

export type { QPayInvoiceResponse, QPayPaymentCheckResponse, QPayUrl };
