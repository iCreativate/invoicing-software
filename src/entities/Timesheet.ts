import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './Employee';

@Entity('timesheets')
export class Timesheet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'time' })
  clockIn!: string;

  @Column({ type: 'time', nullable: true })
  clockOut?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hoursWorked?: number;

  @Column({ nullable: true })
  project?: string;

  @Column({ nullable: true })
  task?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.timesheets)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

