import { PrismaClient } from "@prisma/client";


export default async function checkConnection(prisma: PrismaClient): Promise<void> {
    try {
        await prisma.$connect();
        console.log(`Connect to Database ${process.env.DATABASE}`);
    }catch{
        console.error(`Connection Database ${process.env.DATABASE} not found`);
    }
}