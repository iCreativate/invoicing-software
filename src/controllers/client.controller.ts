import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/dataSource';
import { Client } from '../entities/Client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const createClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.companyId) {
      throw new AppError('User must be associated with a company to create clients', 400);
    }

    const clientRepository = AppDataSource.getRepository(Client);
    const client = clientRepository.create({
      ...req.body,
      companyId: req.user.companyId,
    });

    await clientRepository.save(client);

    res.status(201).json({
      success: true,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

export const getClients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientRepository = AppDataSource.getRepository(Client);
    // Select only needed fields for better performance
    const clients = await clientRepository.find({
      where: { companyId: req.user!.companyId },
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'phone', 'address', 'city', 'province', 'postalCode', 'country', 'isActive', 'createdAt'],
    });

    res.json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    next(error);
  }
};

export const getClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const clientRepository = AppDataSource.getRepository(Client);

    const client = await clientRepository.findOne({
      where: { id, companyId: req.user!.companyId },
      relations: ['invoices'],
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    res.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const clientRepository = AppDataSource.getRepository(Client);

    const client = await clientRepository.findOne({
      where: { id, companyId: req.user!.companyId },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    Object.assign(client, req.body);
    await clientRepository.save(client);

    res.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const clientRepository = AppDataSource.getRepository(Client);

    const client = await clientRepository.findOne({
      where: { id, companyId: req.user!.companyId },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    await clientRepository.remove(client);

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

