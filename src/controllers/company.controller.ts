import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/dataSource';
import { Company } from '../entities/Company';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

export const getCompany = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.params.id || req.user?.companyId;
    
    if (!companyId) {
      throw new AppError('Company ID is required', 400);
    }

    const companyRepository = AppDataSource.getRepository(Company);
    const company = await companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.params.id || req.user?.companyId;
    
    if (!companyId) {
      throw new AppError('Company ID is required', 400);
    }

    const companyRepository = AppDataSource.getRepository(Company);
    const company = await companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const {
      name,
      email,
      phone,
      address,
      city,
      province,
      postalCode,
      country,
      taxNumber,
      vatNumber,
      currency,
      website,
    } = req.body;

    if (name) company.name = name;
    if (email !== undefined) company.email = email;
    if (phone !== undefined) company.phone = phone;
    if (address !== undefined) company.address = address;
    if (city !== undefined) company.city = city;
    if (province !== undefined) company.province = province;
    if (postalCode !== undefined) company.postalCode = postalCode;
    if (country !== undefined) company.country = country;
    if (taxNumber !== undefined) company.taxNumber = taxNumber;
    if (vatNumber !== undefined) company.vatNumber = vatNumber;
    if (currency !== undefined) company.currency = currency;
    if (website !== undefined) company.website = website;

    await companyRepository.save(company);

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.params.id || req.user?.companyId;
    
    if (!companyId) {
      throw new AppError('Company ID is required', 400);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const companyRepository = AppDataSource.getRepository(Company);
    const company = await companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Delete old logo if exists
    if (company.logo) {
      const oldLogoPath = company.logo.startsWith('/') ? company.logo.substring(1) : company.logo;
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Save new logo path (relative to project root)
    const logoPath = `/uploads/${req.file.filename}`;
    company.logo = logoPath;
    await companyRepository.save(company);

    res.json({
      success: true,
      data: {
        logo: logoPath,
        message: 'Logo uploaded successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMiddleware = upload.single('logo');

