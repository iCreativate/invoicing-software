import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Client } from './Client';
import { Employee } from './Employee';
import { Invoice } from './Invoice';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  registrationNumber?: string;

  @Column({ nullable: true })
  taxNumber?: string;

  @Column({ nullable: true })
  vatNumber?: string;

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
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @OneToMany(() => User, (user) => user.company)
  users?: User[];

  @OneToMany(() => Client, (client) => client.company)
  clients?: Client[];

  @OneToMany(() => Employee, (employee) => employee.company)
  employees?: Employee[];

  @OneToMany(() => Invoice, (invoice) => invoice.company)
  invoices?: Invoice[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

