import { AppDataSource } from '../config/dataSource';
import { Invoice } from '../entities/Invoice';
import { Quote } from '../entities/Quote';

export async function generateInvoiceNumber(companyId: string): Promise<string> {
  // Ensure database connection is initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const invoiceRepository = AppDataSource.getRepository(Invoice);
  
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastInvoice = await invoiceRepository
    .createQueryBuilder('invoice')
    .where('invoice.companyId = :companyId', { companyId })
    .andWhere('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
    .orderBy('invoice.invoiceNumber', 'DESC')
    .getOne();

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

export async function generateQuoteNumber(companyId: string): Promise<string> {
  // Ensure database connection is initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const quoteRepository = AppDataSource.getRepository(Quote);
  
  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;

  const lastQuote = await quoteRepository
    .createQueryBuilder('quote')
    .where('quote.companyId = :companyId', { companyId })
    .andWhere('quote.quoteNumber LIKE :prefix', { prefix: `${prefix}%` })
    .orderBy('quote.quoteNumber', 'DESC')
    .getOne();

  let sequence = 1;
  if (lastQuote) {
    const lastSequence = parseInt(lastQuote.quoteNumber.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

