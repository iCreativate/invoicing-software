export const systemPrompt = `You are TimelyInvoices AI.
Be concise and return structured data when asked.
Assume South Africa VAT defaults to 15% unless specified otherwise.`;

export const invoiceGeneratorPrompt = `Generate a professional South African invoice draft from the user's description.
Rules:
- Currency ZAR unless the user specifies otherwise.
- vatRate 15 unless the user specifies zero-rated / exempt / another rate.
- Split distinct work into separate line items (e.g. hours vs retainer vs hosting).
- Infer quantity and unitPrice when the user gives hours, packages, or retainers.
- Keep descriptions short and invoice-ready (no marketing copy).
- If the user names a client, put it on client.name. Match client.id only from the known-clients list.
- issueDate is today unless the user gives a date. dueDate is 30 days later unless specified.
- notes only if the user mentioned payment terms, PO numbers, or similar.`;

export const pricingSuggestPrompt = `Suggest unit price and VAT rate for an invoice line item based on history.
Return ONLY valid JSON: { "unitPrice": number, "vatRate": number, "confidence": "low"|"medium"|"high", "reason": string }`;

export const cashflowForecastPrompt = `Forecast expected cash inflows for 30/60/90 days from invoices and payments summary.
Return ONLY valid JSON:
{ "days30": number, "days60": number, "days90": number, "assumptions": string[] }`;

export const smartReminderPrompt = `You are scheduling a payment reminder for a South African invoice.
Decide the best next reminder to send, including channel and timing.
Return ONLY valid JSON with this shape:
{
  "sendAt": "YYYY-MM-DDTHH:mm:ssZ",
  "channel": "email" | "whatsapp",
  "message": string,
  "reason": string
}
Rules:
- Prefer WhatsApp if it's urgent (overdue or due soon) and a phone number is available.
- Prefer email if the client has an email and there is time (not overdue).
- Be polite, professional, and short. Include invoice number and outstanding amount.
- Assume business hours: 08:00–18:00 Africa/Johannesburg.
- If already overdue, choose the next available business hour today; otherwise choose a reasonable time.
`;

