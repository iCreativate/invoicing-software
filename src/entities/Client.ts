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
import { Invoice } from './Invoice';
import { Quote } from './Quote';

@Entity('clients')
export class Client {
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

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditLimit!: number;

  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, (company) => company.clients)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices?: Invoice[];

  @OneToMany(() => Quote, (quote) => quote.client)
  quotes?: Quote[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

