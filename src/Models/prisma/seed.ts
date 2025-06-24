import { parseArgs } from 'node:util';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Inisialisasi Prisma
const prisma = new PrismaClient();

async function main() {

  const environment = process.env.ENV || 'development'; 

  switch (environment) {
    case 'development':
      const salt = bcrypt.genSaltSync(10);
      const admin = await prisma.users.upsert({
        where: { username: '3202216016' },
        update: { username: '3202216016' },
        create: { 
          username: '3202216016',
          name: 'Muhammad Fitriadi',
          password: bcrypt.hashSync('admin12345', salt),
          role: 'super_admin',
        },
      });
      console.log(admin);
      break;
    case 'test':
      // Data untuk environment test
      break;
    case 'production':
      // Data untuk environment production
      break;
    default:
      console.log('Environment not specified or invalid');
      break;
  }
}

// Menjalankan fungsi utama
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
