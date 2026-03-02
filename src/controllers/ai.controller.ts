import { Response } from 'express';
import { AppDataSource } from '../config/dataSource';
import { Company } from '../entities/Company';
import { Client } from '../entities/Client';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

interface GenerateTermsRequest {
  companyId: string;
  clientId?: string;
  dueDate?: string;
  totalAmount?: number;
  currency?: string;
  paymentTerms?: string;
}

/**
 * Generate Terms & Conditions based on invoice details
 * Uses template-based generation (can be enhanced with AI if OpenAI is configured)
 */
export const generateTermsAndConditions = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, clientId, dueDate, totalAmount, currency, paymentTerms } = req.body as GenerateTermsRequest;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Company ID is required' }
      });
    }

    // Verify user has access to the company
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    // Fetch company details
    const companyRepository = AppDataSource.getRepository(Company);
    const company = await companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: 'Company not found' }
      });
    }

    // Verify user belongs to this company
    if (user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have access to this company' }
      });
    }

    // Fetch client details if provided
    let client: Client | null = null;
    if (clientId) {
      const clientRepository = AppDataSource.getRepository(Client);
      client = await clientRepository.findOne({
        where: { id: clientId, companyId }
      });
    }

    // Calculate payment due days
    let paymentDueDays = 30; // default
    if (dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        paymentDueDays = diffDays;
      }
    }

    // Generate Terms & Conditions using template
    const terms = generateTermsTemplate({
      company,
      client,
      paymentDueDays,
      totalAmount,
      currency: currency || company.currency || 'ZAR',
      paymentTerms: paymentTerms || `${paymentDueDays} days`
    });

    // Optional: Enhance with AI if OpenAI is configured
    // This can be uncommented if OpenAI API key is available
    /*
    if (process.env.OPENAI_API_KEY) {
      try {
        const enhancedTerms = await enhanceWithAI(terms, { company, client, paymentDueDays });
        return res.json({
          success: true,
          data: { terms: enhancedTerms }
        });
      } catch (aiError) {
        logger.warn('AI enhancement failed, using template:', aiError);
        // Fall through to return template-based terms
      }
    }
    */

    return res.json({
      success: true,
      data: { terms }
    });

  } catch (error: any) {
    logger.error('Error generating Terms & Conditions:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to generate Terms & Conditions', details: error.message }
    });
  }
};

/**
 * Generate Terms & Conditions template based on company and invoice details
 */
function generateTermsTemplate(params: {
  company: Company;
  client: Client | null;
  paymentDueDays: number;
  totalAmount?: number;
  currency: string;
  paymentTerms: string;
}): string {
  const { company, paymentDueDays, currency } = params;
  
  const companyName = company.name;
  
  // Build simplified Terms & Conditions - essential information only
  const terms = [
    `Payment is due within ${paymentDueDays} ${paymentDueDays === 1 ? 'day' : 'days'} of the invoice date.`,
    `Payment can be made via bank transfer or EFT. All payments must reference the invoice number.`,
    `All amounts are stated in ${currency}.`,
  ];

  return terms.join(' ');
}

/**
 * Get currency symbol for display
 */
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'ZAR': 'R',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AUD': 'A$',
    'CAD': 'C$',
  };
  return symbols[currency.toUpperCase()] || currency;
}

/**
 * Optional: Enhance terms with AI using OpenAI
 * Uncomment and configure if OpenAI API key is available
 */
/*
async function enhanceWithAI(
  templateTerms: string,
  context: { company: Company; client: Client | null; paymentDueDays: number }
): Promise<string> {
  const { Configuration, OpenAIApi } = require('openai');
  
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const prompt = `Generate professional Terms & Conditions for an invoice based on the following template and context:

Template:
${templateTerms}

Company: ${context.company.name}
Client: ${context.client?.name || 'N/A'}
Payment Terms: ${context.paymentDueDays} days

Please enhance and refine the Terms & Conditions to be more professional, comprehensive, and legally sound while maintaining the key information. Return only the enhanced Terms & Conditions text.`;

  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 1000,
    temperature: 0.7,
  });

  return response.data.choices[0]?.text?.trim() || templateTerms;
}
*/

