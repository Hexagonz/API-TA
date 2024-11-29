import { parseArgs } from 'node:util';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Inisialisasi Prisma
const prisma = new PrismaClient();

// Konfigurasi argumen yang diterima
const options = {
  environment: 'development'
};

async function main() {

  const environment = options.environment || 'development'; 

  switch (environment) {
    case 'development':
      const salt = bcrypt.genSaltSync(10);
      const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { name: 'Admin' },
        create: { 
          email: 'admin@example.com', 
          name: 'Admin',
          password: bcrypt.hashSync('admin12345', salt),
          role: 'admin',
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
