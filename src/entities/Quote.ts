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
import { Invoice } from './Invoice';

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  quoteNumber!: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status!: QuoteStatus;

  @Column({ type: 'date' })
  issueDate!: Date;

  @Column({ type: 'date' })
  expiryDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount!: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  terms?: string;

  @Column({ type: 'jsonb', nullable: true })
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
  }>;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  clientId!: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @ManyToOne(() => Client, (client) => client.quotes)
  @JoinColumn({ name: 'clientId' })
  client!: Client;

  @OneToMany(() => Invoice, (invoice) => invoice.quote)
  invoices?: Invoice[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

