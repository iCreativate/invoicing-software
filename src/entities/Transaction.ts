import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BankAccount } from './BankAccount';
import { Company } from './Company';

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum TransactionCategory {
  SALES = 'sales',
  EXPENSE = 'expense',
  SALARY = 'salary',
  TRANSFER = 'transfer',
  FEE = 'fee',
  REFUND = 'refund',
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: TransactionCategory })
  category!: TransactionCategory;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ type: 'date' })
  transactionDate!: Date;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  counterparty?: string;

  @Column({ nullable: true })
  counterpartyAccount?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: false })
  isReconciled!: boolean;

  @Column({ type: 'uuid', nullable: true })
  reconciledById?: string;

  @Column({ type: 'uuid' })
  bankAccountId!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => BankAccount, (account) => account.transactions)
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount!: BankAccount;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

