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
import { Transaction } from './Transaction';

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT = 'credit',
}

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  accountName!: string;

  @Column()
  accountNumber!: string;

  @Column()
  bankName!: string;

  @Column({ nullable: true })
  branchCode?: string;

  @Column({ nullable: true })
  swiftCode?: string;

  @Column({ type: 'enum', enum: AccountType, default: AccountType.CHECKING })
  type!: AccountType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  lastSyncedBalance?: number;

  @Column({ nullable: true })
  lastSyncedAt?: Date;

  @Column({ nullable: true })
  apiKey?: string;

  @Column({ nullable: true })
  apiSecret?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @OneToMany(() => Transaction, (transaction) => transaction.bankAccount)
  transactions?: Transaction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

