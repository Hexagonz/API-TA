import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import checkConnection from '@/Models/connection';
// const prisma = new PrismaClient();

// export function scheduleTokenCleanup(): void {
//     (async() => await checkConnection(prisma))(); 
//     cron.schedule('0 0 * * *', async () => { 
//         try {
//             console.log("Starting token cleanup...");
//             await prisma.refresh_Token.deleteMany({
//                 where: {
//                     expiresAt: { lt: new Date() } 
//                 }
//             });

//             console.log("Token cleanup completed.");
//         } catch (err) {
//             console.error("Error during token cleanup:", err);
//         }
//     });
// }