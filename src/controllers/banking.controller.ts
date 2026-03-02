import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/dataSource';
import { BankAccount } from '../entities/BankAccount';
import { AccountType } from '../entities/BankAccount';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getBankAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    const bankAccountRepository = AppDataSource.getRepository(BankAccount);
    const accounts = await bankAccountRepository.find({
      where: { companyId: req.user.companyId },
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: { accounts },
    });
  } catch (error) {
    next(error);
  }
};

export const createBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    const {
      accountName,
      accountNumber,
      bankName,
      branchCode,
      swiftCode,
      type,
      isActive = true,
    } = req.body;

    if (!accountName || !accountNumber || !bankName) {
      throw new AppError('Account name, account number, and bank name are required', 400);
    }

    const bankAccountRepository = AppDataSource.getRepository(BankAccount);
    const bankAccount = bankAccountRepository.create({
      accountName,
      accountNumber,
      bankName,
      branchCode,
      swiftCode,
      type: type || AccountType.CHECKING,
      isActive,
      companyId: req.user.companyId,
      balance: 0,
    });

    await bankAccountRepository.save(bankAccount);

    res.status(201).json({
      success: true,
      data: { bankAccount },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!req.user?.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    const bankAccountRepository = AppDataSource.getRepository(BankAccount);
    const bankAccount = await bankAccountRepository.findOne({
      where: { id, companyId: req.user.companyId },
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found', 404);
    }

    const {
      accountName,
      accountNumber,
      bankName,
      branchCode,
      swiftCode,
      type,
      isActive,
    } = req.body;

    if (accountName !== undefined) bankAccount.accountName = accountName;
    if (accountNumber !== undefined) bankAccount.accountNumber = accountNumber;
    if (bankName !== undefined) bankAccount.bankName = bankName;
    if (branchCode !== undefined) bankAccount.branchCode = branchCode;
    if (swiftCode !== undefined) bankAccount.swiftCode = swiftCode;
    if (type !== undefined) bankAccount.type = type;
    if (isActive !== undefined) bankAccount.isActive = isActive;

    await bankAccountRepository.save(bankAccount);

    res.json({
      success: true,
      data: { bankAccount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!req.user?.companyId) {
      throw new AppError('Company ID is required', 400);
    }

    const bankAccountRepository = AppDataSource.getRepository(BankAccount);
    const bankAccount = await bankAccountRepository.findOne({
      where: { id, companyId: req.user.companyId },
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found', 404);
    }

    await bankAccountRepository.remove(bankAccount);

    res.json({
      success: true,
      message: 'Bank account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

