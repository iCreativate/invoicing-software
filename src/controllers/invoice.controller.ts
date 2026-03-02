import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/dataSource';
import { Invoice, InvoiceStatus } from '../entities/Invoice';
import { InvoiceItem } from '../entities/InvoiceItem';
import { Quote } from '../entities/Quote';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateInvoiceNumber } from '../utils/invoiceUtils';

export const createInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure database connection is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.companyId) {
      throw new AppError('User must be associated with a company to create invoices', 400);
    }

    const {
      clientId,
      issueDate,
      dueDate,
      items,
      notes,
      terms,
      currency,
      quoteId,
    } = req.body;

    if (!clientId || !items || items.length === 0) {
      throw new AppError('Client ID and items are required', 400);
    }

    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const invoiceNumber = await generateInvoiceNumber(req.user!.companyId!);

    let subtotal = 0;
    let taxAmount = 0;
    const invoiceItems = [];

    for (const item of items) {
      const lineTotal = item.quantity * item.unitPrice;
      const itemTax = lineTotal * (item.taxRate || 0) / 100;
      subtotal += lineTotal;
      taxAmount += itemTax;

      invoiceItems.push({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        lineTotal: lineTotal + itemTax,
      });
    }

    const totalAmount = subtotal + taxAmount;

    const invoice = invoiceRepository.create({
      invoiceNumber,
      clientId,
      companyId: req.user!.companyId!,
      createdById: req.user!.id,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal,
      taxAmount,
      discountAmount: 0, // Ensure discountAmount is set
      totalAmount,
      balanceAmount: totalAmount,
      paidAmount: 0, // Ensure paidAmount is set
      notes,
      terms,
      currency: currency || 'ZAR',
      quoteId,
      items: invoiceItems.map(item => {
        const invoiceItem = new InvoiceItem();
        invoiceItem.description = item.description;
        invoiceItem.quantity = item.quantity;
        invoiceItem.unitPrice = item.unitPrice;
        invoiceItem.taxRate = item.taxRate;
        invoiceItem.lineTotal = item.lineTotal;
        return invoiceItem;
      }),
    });

    await invoiceRepository.save(invoice);

    const savedInvoice = await invoiceRepository.findOne({
      where: { id: invoice.id },
      relations: ['client', 'items', 'createdBy'],
    });

    res.status(201).json({
      success: true,
      data: { invoice: savedInvoice },
    });
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error('Error creating invoice:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      detail: error?.detail,
      constraint: error?.constraint,
      table: error?.table,
      column: error?.column,
    });
    next(error);
  }
};

export const getInvoices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, clientId, page = 1, limit = 20 } = req.query;
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const queryBuilder = invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.companyId = :companyId', { companyId: req.user!.companyId });

    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    if (clientId) {
      queryBuilder.andWhere('invoice.clientId = :clientId', { clientId });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await queryBuilder
      .skip(skip)
      .take(Number(limit))
      .orderBy('invoice.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const invoice = await invoiceRepository.findOne({
      where: { id, companyId: req.user!.companyId },
      relations: ['client', 'items', 'createdBy', 'payments', 'company'],
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.json({
      success: true,
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure database connection is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { id } = req.params;
    const {
      clientId,
      issueDate,
      dueDate,
      items,
      notes,
      terms,
      disclaimer,
      subtotal,
      taxAmount,
      totalAmount,
      template,
      colors,
      invoiceNumber,
    } = req.body;

    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const invoice = await invoiceRepository.findOne({
      where: { id, companyId: req.user!.companyId },
      relations: ['items'],
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError('Cannot update paid or cancelled invoice', 400);
    }

    // Update basic invoice fields
    if (invoiceNumber !== undefined && String(invoiceNumber).trim()) invoice.invoiceNumber = String(invoiceNumber).trim();
    if (clientId !== undefined) invoice.clientId = clientId;
    if (issueDate !== undefined) invoice.issueDate = new Date(issueDate);
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;
    if (subtotal !== undefined) invoice.subtotal = subtotal;
    if (taxAmount !== undefined) invoice.taxAmount = taxAmount;
    if (totalAmount !== undefined) {
      invoice.totalAmount = totalAmount;
      invoice.balanceAmount = totalAmount - (invoice.paidAmount || 0);
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Remove existing items
      if (invoice.items && invoice.items.length > 0) {
        await invoiceRepository.manager.remove(invoice.items);
      }

      // Create new items
      invoice.items = items.map((item: any) => {
        const invoiceItem = new InvoiceItem();
        invoiceItem.description = item.description;
        invoiceItem.quantity = item.quantity;
        invoiceItem.unitPrice = item.unitPrice;
        invoiceItem.taxRate = item.taxRate || 0;
        const lineTotal = item.quantity * item.unitPrice;
        const itemTax = lineTotal * (item.taxRate || 0) / 100;
        invoiceItem.lineTotal = lineTotal + itemTax;
        return invoiceItem;
      });
    }

    await invoiceRepository.save(invoice);

    const updatedInvoice = await invoiceRepository.findOne({
      where: { id },
      relations: ['client', 'items', 'createdBy', 'company'],
    });

    res.json({
      success: true,
      data: { invoice: updatedInvoice },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const invoice = await invoiceRepository.findOne({
      where: { id, companyId: req.user!.companyId },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status === 'paid') {
      throw new AppError('Cannot delete paid invoice', 400);
    }

    await invoiceRepository.remove(invoice);

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const sendInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure database connection is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { id } = req.params;
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const invoice = await invoiceRepository.findOne({
      where: { id, companyId: req.user!.companyId },
      relations: ['client'],
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Set status to pending when invoice is sent (not paid yet)
    // When invoice is sent, it should appear as pending (not paid yet)
    // The status will be updated to PAID when payment is received
    // For now, keep as SENT but frontend will display it as "pending"
    invoice.status = InvoiceStatus.SENT;
    await invoiceRepository.save(invoice);

    // TODO: Send email notification to client

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};

export const convertQuoteToInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quoteId } = req.params;
    const quoteRepository = AppDataSource.getRepository(Quote);
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const quote = await quoteRepository.findOne({
      where: { id: quoteId, companyId: req.user!.companyId },
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    if (quote.status !== 'accepted') {
      throw new AppError('Only accepted quotes can be converted to invoices', 400);
    }

    const invoiceNumber = await generateInvoiceNumber(req.user!.companyId!);

    const invoice = invoiceRepository.create({
      invoiceNumber,
      clientId: quote.clientId,
      companyId: quote.companyId,
      createdById: req.user!.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
      balanceAmount: quote.totalAmount,
      notes: quote.notes,
      terms: quote.terms,
      quoteId: quote.id,
      items: quote.items?.map(item => {
        const invoiceItem = new InvoiceItem();
        invoiceItem.description = item.description;
        invoiceItem.quantity = item.quantity;
        invoiceItem.unitPrice = item.unitPrice;
        invoiceItem.taxRate = item.taxRate;
        invoiceItem.lineTotal = item.lineTotal;
        return invoiceItem;
      }) || [],
    });

    await invoiceRepository.save(invoice);

    const savedInvoice = await invoiceRepository.findOne({
      where: { id: invoice.id },
      relations: ['client', 'items'],
    });

    res.status(201).json({
      success: true,
      data: { invoice: savedInvoice },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const [total, paid, pending, overdue] = await Promise.all([
      invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.totalAmount)', 'total')
        .where('invoice.companyId = :companyId', { companyId: req.user!.companyId })
        .getRawOne(),
      invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.totalAmount)', 'total')
        .where('invoice.companyId = :companyId', { companyId: req.user!.companyId })
        .andWhere('invoice.status = :status', { status: 'paid' })
        .getRawOne(),
      invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.balanceAmount)', 'total')
        .where('invoice.companyId = :companyId', { companyId: req.user!.companyId })
        .andWhere('invoice.status IN (:...statuses)', { statuses: ['sent', 'partial'] })
        .getRawOne(),
      invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.balanceAmount)', 'total')
        .where('invoice.companyId = :companyId', { companyId: req.user!.companyId })
        .andWhere('invoice.status = :status', { status: 'overdue' })
        .getRawOne(),
    ]);

    res.json({
      success: true,
      data: {
        total: parseFloat(total?.total || '0'),
        paid: parseFloat(paid?.total || '0'),
        pending: parseFloat(pending?.total || '0'),
        overdue: parseFloat(overdue?.total || '0'),
      },
    });
  } catch (error) {
    next(error);
  }
};

