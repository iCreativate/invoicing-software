import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './Company';
import { Vendor } from './Vendor';

export enum ExpenseCategory {
  OFFICE_SUPPLIES = 'office_supplies',
  TRAVEL = 'travel',
  MEALS = 'meals',
  UTILITIES = 'utilities',
  RENT = 'rent',
  MARKETING = 'marketing',
  SOFTWARE = 'software',
  PROFESSIONAL_SERVICES = 'professional_services',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  expenseNumber!: string;

  @Column({ type: 'date' })
  expenseDate!: Date;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category!: ExpenseCategory;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount!: number;

  @Column()
  description!: string;

  @Column({ nullable: true })
  receiptUrl?: string;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status!: ExpenseStatus;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid', nullable: true })
  vendorId?: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @ManyToOne(() => Vendor, (vendor) => vendor.expenses)
  @JoinColumn({ name: 'vendorId' })
  vendor?: Vendor;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

