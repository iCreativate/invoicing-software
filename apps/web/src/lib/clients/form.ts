import { z } from 'zod';

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  companyRegistration: z.string().optional().or(z.literal('')),
  vatNumber: z.string().optional().or(z.literal('')),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const EMPTY_CLIENT_FORM: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  companyName: '',
  website: '',
  companyRegistration: '',
  vatNumber: '',
};

export type ClientKind = 'individual' | 'business';

export function normalizeClientPayload(values: ClientFormValues) {
  const website = (values.website ?? '').trim();
  const normalizedWebsite =
    website && !/^https?:\/\//i.test(website) ? `https://${website}` : website || undefined;

  return {
    name: values.name.trim(),
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    address: values.address?.trim() || undefined,
    companyName: values.companyName?.trim() || undefined,
    website: normalizedWebsite,
    companyRegistration: values.companyRegistration?.trim() || undefined,
    vatNumber: values.vatNumber?.trim() || undefined,
  };
}

export function displayName(values: ClientFormValues, kind: ClientKind) {
  const company = (values.companyName ?? '').trim();
  if (kind === 'business' && company) return company;
  return values.name.trim() || 'New client';
}

export function formCompletion(values: ClientFormValues) {
  const fields = [
    values.name,
    values.email ?? '',
    values.phone ?? '',
    values.companyName ?? '',
    values.website ?? '',
    values.companyRegistration ?? '',
    values.vatNumber ?? '',
    values.address ?? '',
  ];
  const filled = fields.filter((v) => v.trim().length > 0).length;
  return { filled, total: fields.length };
}
