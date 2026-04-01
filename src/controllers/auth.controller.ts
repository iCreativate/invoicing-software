import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../config/dataSource';
import { User, UserRole } from '../entities/User';
import { Company } from '../entities/Company';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

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

