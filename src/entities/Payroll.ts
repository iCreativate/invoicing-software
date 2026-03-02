import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Employee } from './Employee';
import { Company } from './Company';
import { Payslip } from './Payslip';

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('payrolls')
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  payrollNumber!: string;

  @Column({ type: 'date' })
  payPeriodStart!: Date;

  @Column({ type: 'date' })
  payPeriodEnd!: Date;

  @Column({ type: 'date' })
  payDate!: Date;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status!: PayrollStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  grossSalary!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  allowances!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deductions!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netSalary!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paye!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  uif!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  sdl!: number;

  @Column({ type: 'jsonb', nullable: true })
  breakdown?: {
    earnings?: Array<{ description: string; amount: number }>;
    deductions?: Array<{ description: string; amount: number }>;
  };

  @Column({ type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Employee, (employee) => employee.payrolls)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @OneToMany(() => Payslip, (payslip) => payslip.payroll)
  payslips?: Payslip[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

