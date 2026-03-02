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
import { Company } from './Company';
import { Client } from './Client';
import { User } from './User';
import { InvoiceItem } from './InvoiceItem';
import { Payment } from './Payment';
import { Quote } from './Quote';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  STANDARD = 'standard',
  RECURRING = 'recurring',
  CREDIT = 'credit',
  DEBIT = 'debit',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  invoiceNumber!: string;

  @Column({ type: 'enum', enum: InvoiceType, default: InvoiceType.STANDARD })
  type!: InvoiceType;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  @Column({ type: 'date' })
  issueDate!: Date;

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column({ type: 'date', nullable: true })
  paidDate?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balanceAmount!: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  terms?: string;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  exchangeRate?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  clientId!: string;

  @Column({ type: 'uuid' })
  createdById!: string;

  @Column({ type: 'uuid', nullable: true })
  quoteId?: string;

  @ManyToOne(() => Company, (company) => company.invoices)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @ManyToOne(() => Client, (client) => client.invoices)
  @JoinColumn({ name: 'clientId' })
  client!: Client;

  @ManyToOne(() => User, (user) => user.invoices)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @ManyToOne(() => Quote, (quote) => quote.invoices)
  @JoinColumn({ name: 'quoteId' })
  quote?: Quote;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items!: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments?: Payment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

