import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/dataSource';
import { Quote, QuoteStatus } from '../entities/Quote';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateQuoteNumber } from '../utils/invoiceUtils';

export const createQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    if (!req.user || !req.user.companyId) {
      throw new AppError('User must be associated with a company to create quotes', 400);
    }

    const quoteRepository = AppDataSource.getRepository(Quote);
    const { clientId, issueDate, expiryDate, items, notes, terms } = req.body;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    const quoteItems = items.map((item: any) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const itemTax = lineSubtotal * (item.taxRate || 0) / 100;
      subtotal += lineSubtotal;
      taxAmount += itemTax;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        lineTotal: lineSubtotal + itemTax,
      };
    });

    const totalAmount = subtotal + taxAmount;
    const quoteNumber = await generateQuoteNumber(req.user!.companyId);

    const quote = new Quote();
    quote.quoteNumber = quoteNumber;
    quote.companyId = req.user!.companyId;
    quote.clientId = clientId;
    quote.issueDate = new Date(issueDate);
    quote.expiryDate = new Date(expiryDate);
    quote.subtotal = subtotal;
    quote.taxAmount = taxAmount;
    quote.totalAmount = totalAmount;
    quote.items = quoteItems;
    quote.notes = notes;
    quote.terms = terms;
    quote.status = QuoteStatus.DRAFT;

    await quoteRepository.save(quote);

    const savedQuote = await quoteRepository.findOne({
      where: { id: quote.id },
      relations: ['client', 'company'],
    });

    res.json({
      success: true,
      message: 'Quote created successfully',
      data: { quote: savedQuote },
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    next(error);
  }
};

export const getQuotes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    if (!req.user || !req.user.companyId) {
      throw new AppError('User must be associated with a company', 400);
    }

    const quoteRepository = AppDataSource.getRepository(Quote);
    const quotes = await quoteRepository.find({
      where: { companyId: req.user.companyId },
      relations: ['client', 'company'],
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: { quotes },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    next(error);
  }
};

export const getQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { id } = req.params;
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository.findOne({
      where: { id, companyId: req.user!.companyId },
      relations: ['client', 'company'],
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    res.json({
      success: true,
      data: { quote },
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    next(error);
  }
};

export const updateQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { id } = req.params;
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository.findOne({
      where: { id, companyId: req.user!.companyId },
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    if (quote.status === QuoteStatus.ACCEPTED || quote.status === QuoteStatus.REJECTED) {
      throw new AppError('Cannot update accepted or rejected quote', 400);
    }

    const { items, clientId, issueDate, expiryDate, notes, terms, status } = req.body;

    // Recalculate totals if items are provided
    if (items) {
      let subtotal = 0;
      let taxAmount = 0;
      const quoteItems = items.map((item: any) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const itemTax = lineSubtotal * (item.taxRate || 0) / 100;
        subtotal += lineSubtotal;
        taxAmount += itemTax;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
          lineTotal: lineSubtotal + itemTax,
        };
      });

      quote.subtotal = subtotal;
      quote.taxAmount = taxAmount;
      quote.totalAmount = subtotal + taxAmount;
      quote.items = quoteItems;
    }

    if (clientId) quote.clientId = clientId;
    if (issueDate) quote.issueDate = new Date(issueDate);
    if (expiryDate) quote.expiryDate = new Date(expiryDate);
    if (notes !== undefined) quote.notes = notes;
    if (terms !== undefined) quote.terms = terms;
    if (status) quote.status = status as QuoteStatus;

    await quoteRepository.save(quote);

    const updatedQuote = await quoteRepository.findOne({
      where: { id },
      relations: ['client', 'company'],
    });

    res.json({
      success: true,
      message: 'Quote updated successfully',
      data: { quote: updatedQuote },
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    next(error);
  }
};

export const deleteQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { id } = req.params;
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository.findOne({
      where: { id, companyId: req.user!.companyId },
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    await quoteRepository.remove(quote);

    res.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    next(error);
  }
};

export const sendQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { id } = req.params;
    const quoteRepository = AppDataSource.getRepository(Quote);
    const quote = await quoteRepository.findOne({
      where: { id, companyId: req.user!.companyId },
      relations: ['client'],
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    quote.status = QuoteStatus.SENT;
    await quoteRepository.save(quote);

    // TODO: Send email notification to client

    res.json({
      success: true,
      message: 'Quote sent successfully',
      data: { quote },
    });
  } catch (error) {
    console.error('Error sending quote:', error);
    next(error);
  }
};

