import { PrismaClient } from "@prisma/client";
import { AmazonScrapingService } from "../services/amazonScrapingService";
import { TelegramService } from "../services/telegramService";

const prisma = new PrismaClient();
const scrapingService = new AmazonScrapingService();
const telegramService = new TelegramService();

export class PriceMonitoringService {
    
    /**
     * Monitora tutti i prodotti e invia notifiche se il prezzo diminuisce
     */
    async monitorAllProducts(): Promise<void> {
        try {
            // Ottieni tutti i prodotti attivi
            const activeProducts = await prisma.amazonProduct.findMany({
                include: {
                    trackedByUsers: {
                        where: { isActive: true },
                        include: {
                            user: true
                        }
                    }
                }
            });

            // Monitora ogni prodotto
            for (const product of activeProducts) {
                await this.monitorSingleProduct(product);
                
                // Pausa tra le richieste per evitare rate limiting
                await this.sleep(2000);
            }

        } catch (error) {
            console.error('❌ Errore nel monitoraggio prezzi:', error);
        }
    }

    /**
     * Monitora un singolo prodotto
     */
    private async monitorSingleProduct(product: any): Promise<void> {
        try {
            // Fai scraping del prodotto
            const scrapedInfo = await scrapingService.scrapeProduct(product.link);
            
            if (!scrapedInfo || scrapedInfo.currentPrice === null) {
                return;
            }

            const oldPrice = product.currentPrice;
            const newPrice = scrapedInfo.currentPrice;

            // Aggiorna il prodotto nel database
            await prisma.amazonProduct.update({
                where: { id: product.id },
                data: {
                    title: scrapedInfo.title,
                    currentPrice: newPrice,
                    originalPrice: scrapedInfo.originalPrice,
                    currency: scrapedInfo.currency
                }
            });

            // Aggiungi record nella price history
            await prisma.priceHistory.create({
                data: {
                    productId: product.id,
                    price: newPrice,
                    currency: scrapedInfo.currency
                }
            });

            // Controlla se il prezzo è diminuito e invia notifiche
            if (oldPrice !== null && newPrice < oldPrice) {
                console.log(`📉 ${product.title}: ${oldPrice} → ${newPrice} ${scrapedInfo.currency}`);
                await this.sendPriceDropNotifications(product, oldPrice, newPrice, scrapedInfo.currency);
            }

        } catch (error) {
            console.error(`❌ Monitoraggio ${product.title}:`, error);
        }
    }

    /**
     * Invia notifiche di calo prezzo a tutti gli utenti
     */
    private async sendPriceDropNotifications(
        product: any, 
        oldPrice: number, 
        newPrice: number, 
        currency: string
    ): Promise<void> {
        const users = product.trackedByUsers;
        
        console.log(`📬 Invio notifiche a ${users.length} utenti per ${product.title}`);

        for (const tracking of users) {
            try {
                const user = tracking.user;
                const chatId = parseInt(user.chatId);

                // Calcola il risparmio
                const savings = oldPrice - newPrice;
                const discountPercent = Math.round((savings / oldPrice) * 100);

                const message = `
🎯 <b>Prezzo in calo!</b>

📦 <b>${product.title}</b>

💰 <b>Nuovo prezzo:</b> ${newPrice.toFixed(2)} ${currency}
💸 <b>Prezzo precedente:</b> <s>${oldPrice.toFixed(2)} ${currency}</s>

📉 <b>Risparmio:</b> ${savings.toFixed(2)} ${currency} (-${discountPercent}%)

🛒 <a href="${product.link}">Vai al prodotto</a>

⏰ Controllato il ${new Date().toLocaleString('it-IT')}
                `.trim();

                await telegramService.sendMessage(chatId, message);

                // Pausa tra le notifiche
                await this.sleep(500);

            } catch (error) {
                console.error(`❌ Notifica fallita per ${tracking.user.chatId}:`, error);
            }
        }
    }

    /**
     * Ottieni statistiche del monitoraggio
     */
    async getMonitoringStats(): Promise<{
        totalProducts: number;
        activeUsers: number;
        totalTrackings: number;
        lastPriceUpdate: Date | null;
    }> {
        try {
            const [totalProducts, activeUsers, totalTrackings, lastPriceHistory] = await Promise.all([
                prisma.amazonProduct.count(),
                prisma.telegramUser.count(),
                prisma.userProductTracking.count({ where: { isActive: true } }),
                prisma.priceHistory.findFirst({
                    orderBy: { timestamp: 'desc' }
                })
            ]);

            return {
                totalProducts,
                activeUsers,
                totalTrackings,
                lastPriceUpdate: lastPriceHistory?.timestamp || null
            };
        } catch (error) {
            console.error('Errore nel recupero statistiche:', error);
            return {
                totalProducts: 0,
                activeUsers: 0,
                totalTrackings: 0,
                lastPriceUpdate: null
            };
        }
    }

    /**
     * Pulisci la price history vecchia (mantieni solo gli ultimi 30 giorni)
     */
    async cleanupOldPriceHistory(): Promise<void> {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deleted = await prisma.priceHistory.deleteMany({
                where: {
                    timestamp: {
                        lt: thirtyDaysAgo
                    }
                }
            });

        } catch (error) {
            console.error('Errore nella pulizia price history:', error);
        }
    }

    /**
     * Utility per pausa
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup delle risorse
     */
    async cleanup(): Promise<void> {
        await scrapingService.cleanup();
        await prisma.$disconnect();
    }
}
