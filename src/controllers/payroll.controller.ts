import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/dataSource';
import { Payroll, PayrollStatus } from '../entities/Payroll';
import { Employee, EmploymentStatus } from '../entities/Employee';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getPayrolls = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new AppError('User must be associated with a company', 400);
    }
    const payrollRepo = AppDataSource.getRepository(Payroll);
    const payrolls = await payrollRepo.find({
      where: { companyId: req.user.companyId },
      relations: ['employee'],
      order: { payPeriodEnd: 'DESC', createdAt: 'DESC' },
    });
    const list = payrolls.map((p) => ({
      id: p.id,
      payrollNumber: p.payrollNumber,
      employeeId: p.employeeId,
      employeeName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Unknown',
      payPeriodStart: p.payPeriodStart,
      payPeriodEnd: p.payPeriodEnd,
      payDate: p.payDate,
      payPeriod: `${new Date(p.payPeriodStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(p.payPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      grossSalary: Number(p.grossSalary),
      allowances: Number(p.allowances),
      deductions: Number(p.deductions),
      netSalary: Number(p.netSalary),
      paye: Number(p.paye),
      uif: Number(p.uif),
      sdl: Number(p.sdl),
      status: p.status,
      createdAt: p.createdAt,
    }));
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getPayrollById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!req.user?.companyId) {
      throw new AppError('User must be associated with a company', 400);
    }
    const payrollRepo = AppDataSource.getRepository(Payroll);
    const payroll = await payrollRepo.findOne({
      where: { id, companyId: req.user.companyId },
      relations: ['employee'],
    });
    if (!payroll) {
      throw new AppError('Payroll not found', 404);
    }
    res.json({
      success: true,
      data: {
        id: payroll.id,
        payrollNumber: payroll.payrollNumber,
        employeeId: payroll.employeeId,
        employeeName: payroll.employee ? `${payroll.employee.firstName} ${payroll.employee.lastName}` : 'Unknown',
        employeeNumber: payroll.employee?.employeeNumber,
        payPeriodStart: payroll.payPeriodStart,
        payPeriodEnd: payroll.payPeriodEnd,
        payDate: payroll.payDate,
        grossSalary: Number(payroll.grossSalary),
        allowances: Number(payroll.allowances),
        deductions: Number(payroll.deductions),
        netSalary: Number(payroll.netSalary),
        paye: Number(payroll.paye),
        uif: Number(payroll.uif),
        sdl: Number(payroll.sdl),
        status: payroll.status,
        breakdown: payroll.breakdown,
        createdAt: payroll.createdAt,
        updatedAt: payroll.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_STATUS_TRANSITIONS: Record<PayrollStatus, PayrollStatus[]> = {
  [PayrollStatus.DRAFT]: [PayrollStatus.PAID, PayrollStatus.CANCELLED],
  [PayrollStatus.PROCESSING]: [PayrollStatus.APPROVED, PayrollStatus.CANCELLED],
  [PayrollStatus.APPROVED]: [PayrollStatus.PAID, PayrollStatus.CANCELLED],
  [PayrollStatus.PAID]: [],
  [PayrollStatus.CANCELLED]: [],
};

export const updatePayrollStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!req.user?.companyId) {
      throw new AppError('User must be associated with a company', 400);
    }
    if (!status || typeof status !== 'string') {
      throw new AppError('Status is required', 400);
    }
    const newStatus = status.toLowerCase() as PayrollStatus;
    if (!Object.values(PayrollStatus).includes(newStatus)) {
      throw new AppError('Invalid status', 400);
    }
    const payrollRepo = AppDataSource.getRepository(Payroll);
    const payroll = await payrollRepo.findOne({
      where: { id, companyId: req.user.companyId },
    });
    if (!payroll) {
      throw new AppError('Payroll not found', 404);
    }
    const allowed = ALLOWED_STATUS_TRANSITIONS[payroll.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(`Cannot change status from ${payroll.status} to ${newStatus}`, 400);
    }
    payroll.status = newStatus;
    await payrollRepo.save(payroll);
    res.json({
      success: true,
      data: { id: payroll.id, status: payroll.status },
      message: `Payroll status updated to ${payroll.status}.`,
    });
  } catch (error) {
    next(error);
  }
};

function simplePaye(gross: number): number {
  if (gross <= 0) return 0;
  const annual = gross * 12;
  if (annual <= 237100) return gross * 0.18;
  if (annual <= 370500) return 42678 / 12 + (gross - 237100 / 12) * 0.26;
  return 77962 / 12 + (gross - 370500 / 12) * 0.31;
}

export const createPayroll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new AppError('User must be associated with a company to run payroll', 400);
    }
    const { payPeriodStart, payPeriodEnd, payDate } = req.body;
    if (!payPeriodStart || !payPeriodEnd || !payDate) {
      throw new AppError('Pay period start, end and pay date are required', 400);
    }
    const start = new Date(payPeriodStart);
    const end = new Date(payPeriodEnd);
    const pay = new Date(payDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(pay.getTime())) {
      throw new AppError('Invalid date format', 400);
    }
    const employeeRepo = AppDataSource.getRepository(Employee);
    const payrollRepo = AppDataSource.getRepository(Payroll);
    const activeEmployees = await employeeRepo.find({
      where: { companyId: req.user.companyId, status: EmploymentStatus.ACTIVE },
    });
    if (activeEmployees.length === 0) {
      throw new AppError('No active employees to process for this period', 400);
    }
    const yearMonth = `${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}`;
    const existingCount = await payrollRepo.count({
      where: { companyId: req.user.companyId },
    });
    const created: Payroll[] = [];
    for (let i = 0; i < activeEmployees.length; i++) {
      const emp = activeEmployees[i];
      const gross = Number(emp.baseSalary);
      const paye = simplePaye(gross);
      const uif = Math.min(gross * 0.01, 177.12);
      const sdl = gross * 0.01;
      const deductions = paye + uif + sdl;
      const net = gross - deductions;
      const seq = String(existingCount + i + 1).padStart(3, '0');
      const payrollNumber = `PR-${yearMonth}-${seq}`;
      const payroll = payrollRepo.create({
        payrollNumber,
        payPeriodStart: start,
        payPeriodEnd: end,
        payDate: pay,
        status: PayrollStatus.DRAFT,
        grossSalary: gross,
        allowances: 0,
        deductions,
        netSalary: net,
        paye,
        uif,
        sdl,
        employeeId: emp.id,
        companyId: req.user.companyId,
        breakdown: {
          earnings: [{ description: 'Basic salary', amount: gross }],
          deductions: [
            { description: 'PAYE', amount: paye },
            { description: 'UIF', amount: uif },
            { description: 'SDL', amount: sdl },
          ],
        },
      });
      await payrollRepo.save(payroll);
      created.push(payroll);
    }
    const list = created.map((p) => ({
      id: p.id,
      payrollNumber: p.payrollNumber,
      payPeriodStart: p.payPeriodStart,
      payPeriodEnd: p.payPeriodEnd,
      payDate: p.payDate,
      status: p.status,
      netSalary: Number(p.netSalary),
    }));
    res.status(201).json({
      success: true,
      data: { payrolls: list, count: list.length },
      message: `Payroll processed for ${list.length} employee(s).`,
    });
  } catch (error) {
    next(error);
  }
};
