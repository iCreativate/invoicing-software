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
import { Expense } from './Expense';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  province?: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  taxNumber?: string;

  @Column({ nullable: true })
  vatNumber?: string;

  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  bankAccount?: string;

  @Column({ nullable: true })
  bankName?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, (company) => company.clients)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @OneToMany(() => Expense, (expense) => expense.vendor)
  expenses?: Expense[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

