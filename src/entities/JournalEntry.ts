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

export enum EntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  entryNumber!: string;

  @Column({ type: 'date' })
  entryDate!: Date;

  @Column()
  account!: string;

  @Column({ type: 'enum', enum: EntryType })
  type!: EntryType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column()
  description!: string;

  @Column({ nullable: true })
  reference?: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

