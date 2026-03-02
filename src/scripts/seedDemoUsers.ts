import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import dbConfig from '../config/database';
import { User, UserRole } from '../entities/User';
import { Company } from '../entities/Company';

dotenv.config();

const AppDataSource = new DataSource(dbConfig);

const demoUsers = [
  {
    email: 'admin@timely.demo',
    password: 'demo123',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    companyName: 'Timely Demo Company',
  },
  {
    email: 'accountant@timely.demo',
    password: 'demo123',
    firstName: 'Accountant',
    lastName: 'User',
    role: UserRole.ACCOUNTANT,
    companyName: 'Timely Demo Company',
  },
  {
    email: 'manager@timely.demo',
    password: 'demo123',
    firstName: 'Manager',
    lastName: 'User',
    role: UserRole.MANAGER,
    companyName: 'Timely Demo Company',
  },
];

async function seedDemoUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository(User);
    const companyRepository = AppDataSource.getRepository(Company);

    // Find or create demo company
    let demoCompany = await companyRepository.findOne({
      where: { name: 'Timely Demo Company' },
    });

    if (!demoCompany) {
      demoCompany = companyRepository.create({
        name: 'Timely Demo Company',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
      });
      await companyRepository.save(demoCompany);
      console.log('✅ Created demo company');
    } else {
      console.log('✅ Demo company already exists');
    }

    // Create demo users
    for (const demoUser of demoUsers) {
      const existingUser = await userRepository.findOne({
        where: { email: demoUser.email },
      });

      if (existingUser) {
        console.log(`⏭️  User ${demoUser.email} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(demoUser.password, 10);

      const user = userRepository.create({
        email: demoUser.email,
        password: hashedPassword,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        role: demoUser.role,
        companyId: demoCompany.id,
        isActive: true,
      });

      await userRepository.save(user);
      console.log(`✅ Created demo user: ${demoUser.email} (${demoUser.role})`);
    }

    console.log('\n🎉 Demo users seeded successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    demoUsers.forEach((user) => {
      console.log(`\n👤 ${user.role}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seedDemoUsers();

