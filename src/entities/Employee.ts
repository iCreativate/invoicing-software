import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Company } from './Company';
import { User } from './User';
import { Payroll } from './Payroll';
import { LeaveRequest } from './LeaveRequest';
import { Timesheet } from './Timesheet';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  RESIGNED = 'resigned',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeNumber!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  idNumber?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'date' })
  hireDate!: Date;

  @Column({ type: 'date', nullable: true })
  terminationDate?: Date;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  employmentType!: EmploymentType;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  status!: EmploymentStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  baseSalary!: number;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  bankAccount?: string;

  @Column({ nullable: true })
  bankName?: string;

  @Column({ nullable: true })
  branchCode?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  emergencyContact?: string;

  @Column({ nullable: true })
  emergencyPhone?: string;

  @Column({ type: 'jsonb', nullable: true })
  taxInfo?: {
    paye?: number;
    uif?: number;
    sdl?: number;
    taxNumber?: string;
  };

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => Company, (company) => company.employees)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => Payroll, (payroll) => payroll.employee)
  payrolls?: Payroll[];

  @OneToMany(() => LeaveRequest, (leave) => leave.employee)
  leaveRequests?: LeaveRequest[];

  @OneToMany(() => Timesheet, (timesheet) => timesheet.employee)
  timesheets?: Timesheet[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

