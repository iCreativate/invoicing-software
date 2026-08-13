import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { AppDataSource } from '../config/dataSource';
import { User, UserRole } from '../entities/User';
import { Company } from '../entities/Company';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const RESET_TOKEN_BYTES = 32;
const RESET_EXPIRY_MS = 60 * 60 * 1000;

function hashPasswordResetToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    logger.warn(`Password reset email skipped (SMTP_HOST not set). Link for ${to}: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER || 'noreply@localhost';

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your Timely password',
    text: `You requested a password reset.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Set a new password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, phone, companyName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Missing required fields', 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company if provided
    let company;
    if (companyName) {
      const companyRepository = AppDataSource.getRepository(Company);
      company = companyRepository.create({
        name: companyName,
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
      });
      await companyRepository.save(company);
    }

    const user = userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      companyId: company?.id,
      role: company ? UserRole.ADMIN : UserRole.EMPLOYEE,
    });

    await userRepository.save(user);

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email },
      relations: ['company'],
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          company: user.company,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    const genericMessage =
      'If an account exists for that email, we sent password reset instructions.';

    if (!email) {
      res.json({ success: true, message: genericMessage });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.email) = :email', { email })
      .getOne();

    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
      user.passwordResetTokenHash = hashPasswordResetToken(rawToken);
      user.passwordResetExpires = new Date(Date.now() + RESET_EXPIRY_MS);
      await userRepository.save(user);

      const frontend =
        process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3003';
      const resetUrl = `${frontend}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(user.email)}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (mailErr) {
        logger.error({ err: mailErr, message: 'Failed to send password reset email' });
      }
    }

    res.json({ success: true, message: genericMessage });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email =
      typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !token || !password) {
      throw new AppError('Email, token, and new password are required', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.email) = :email', { email })
      .getOne();

    if (
      !user ||
      !user.passwordResetTokenHash ||
      !user.passwordResetExpires ||
      user.passwordResetExpires.getTime() < Date.now()
    ) {
      throw new AppError('Invalid or expired reset link. Request a new one.', 400);
    }

    if (hashPasswordResetToken(token) !== user.passwordResetTokenHash) {
      throw new AppError('Invalid or expired reset link. Request a new one.', 400);
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await userRepository.save(user);

    res.json({
      success: true,
      message: 'Password updated. You can sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user!.id },
      relations: ['company'],
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'avatar', 'createdAt'],
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.id } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await userRepository.save(user);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

