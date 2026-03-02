import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payroll } from './Payroll';
import { Employee } from './Employee';

@Entity('payslips')
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  payslipNumber!: string;

  @Column({ type: 'uuid' })
  payrollId!: string;

  @Column({ type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'date' })
  payDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  grossSalary!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netSalary!: number;

  @Column({ type: 'jsonb' })
  breakdown!: {
    earnings: Array<{ description: string; amount: number }>;
    deductions: Array<{ description: string; amount: number }>;
    taxes: Array<{ description: string; amount: number }>;
  };

  @Column({ nullable: true })
  pdfUrl?: string;

  @ManyToOne(() => Payroll, (payroll) => payroll.payslips)
  @JoinColumn({ name: 'payrollId' })
  payroll!: Payroll;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

