import cron from 'node-cron';
import LoginController from '@controllers/LoginController';

const prisma = new LoginController();

export function scheduleTokenCleanup(): void {
    cron.schedule('0 0 * * *', async () => { 
        try {
            console.log("Starting token cleanup...");
            await prisma.refresh_Token.deleteMany({
                where: {
                    expiresAt: { lt: new Date() } 
                }
            });

            console.log("Token cleanup completed.");
        } catch (err) {
            console.error("Error during token cleanup:", err);
        }
    });
}