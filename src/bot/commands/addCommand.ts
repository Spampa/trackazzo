import { TelegramMessage } from "../../types/telegram";
import { BaseCommand } from "./baseCommand";
import { PrismaClient } from "@prisma/client";
import { AmazonScrapingService } from "../../services/amazonScrapingService";

const prisma = new PrismaClient();
const scrapingService = new AmazonScrapingService();

export class AddCommand extends BaseCommand {
    async execute(message: TelegramMessage): Promise<void> {
        const text = message.text?.trim() || '';
        const chatId = this.extractChatId(message);

        // Estrai il link dal comando
        const linkMatch = text.match(/\/add\s+(https?:\/\/[^\s]+)/);
        
        if (!linkMatch) {
            await this.telegramService.sendMessage(
                chatId,
                '❌ Formato non valido!\n\n💡 <b>Usa:</b> <code>/add [link Amazon]</code>\n\n📝 <b>Esempio:</b>\n<code>/add https://amazon.it/dp/B08N5WRWNW</code>'
            );
            return;
        }

        const amazonLink = linkMatch[1];
        if (amazonLink) {
            await this.handleAmazonLink(chatId, amazonLink);
        }
    }

    async handleDirectLink(message: TelegramMessage): Promise<void> {
        const text = message.text?.trim() || '';
        const chatId = this.extractChatId(message);
        
        await this.handleAmazonLink(chatId, text);
    }

    private async handleAmazonLink(chatId: number, link: string): Promise<void> {
        try {
            // Valida che sia un link Amazon
            if (!this.isValidAmazonLink(link)) {
                await this.telegramService.sendMessage(
                    chatId,
                    '❌ Il link fornito non sembra essere un link Amazon valido.\n\n💡 Assicurati che contenga "amazon." o "amzn."'
                );
                return;
            }

            // Normalizza il link Amazon
            const cleanLink = this.cleanAmazonLink(link);
            
            // Estrai ASIN per controllo duplicati avanzato
            const asin = await scrapingService.extractAsinFromUrl(cleanLink);

            // Verifica se l'utente esiste
            const user = await prisma.telegramUser.findUnique({
                where: { chatId: chatId.toString() }
            });

            if (!user) {
                await this.telegramService.sendMessage(
                    chatId,
                    '❌ Utente non registrato. Usa /start per registrarti prima.'
                );
                return;
            }

            await this.telegramService.sendMessage(chatId, '🔄 Sto analizzando il prodotto...');

            // Scraping delle informazioni del prodotto
            const productInfo = await scrapingService.scrapeProduct(cleanLink, chatId);
            
            if (!productInfo) {
                await this.telegramService.sendMessage(
                    chatId,
                    '❌ Non sono riuscito a ottenere le informazioni del prodotto. Il link potrebbe non essere valido o il prodotto non disponibile.'
                );
                return;
            }

            // Prima cerca per link esatto
            let product = await prisma.amazonProduct.findUnique({
                where: { link: cleanLink }
            });

            // Se non trovato e abbiamo un ASIN, cerca per ASIN in altri link
            if (!product && asin) {
                const foundProduct = await prisma.amazonProduct.findFirst({
                    where: {
                        link: {
                            contains: `/dp/${asin}`
                        }
                    }
                });

                if (foundProduct) {
                    // Aggiorna il link al formato normalizzato se necessario
                    if (foundProduct.link !== cleanLink) {
                        product = await prisma.amazonProduct.update({
                            where: { id: foundProduct.id },
                            data: { link: cleanLink }
                        });
                    } else {
                        product = foundProduct;
                    }
                }
            }

            if (!product) {
                // Crea nuovo prodotto con le informazioni estratte
                product = await prisma.amazonProduct.create({
                    data: {
                        link: cleanLink,
                        title: productInfo.title,
                        currentPrice: productInfo.currentPrice,
                        originalPrice: productInfo.originalPrice,
                        currency: productInfo.currency
                    }
                });

                // Aggiungi il primo record nella price history
                if (productInfo.currentPrice) {
                    await prisma.priceHistory.create({
                        data: {
                            productId: product.id,
                            price: productInfo.currentPrice,
                            currency: productInfo.currency
                        }
                    });
                }
            } else {
                // Aggiorna le informazioni del prodotto esistente
                await prisma.amazonProduct.update({
                    where: { id: product.id },
                    data: {
                        title: productInfo.title,
                        currentPrice: productInfo.currentPrice,
                        originalPrice: productInfo.originalPrice,
                        currency: productInfo.currency
                    }
                });

                // Aggiungi nuovo record nella price history se il prezzo è cambiato
                if (productInfo.currentPrice && productInfo.currentPrice !== product.currentPrice) {
                    await prisma.priceHistory.create({
                        data: {
                            productId: product.id,
                            price: productInfo.currentPrice,
                            currency: productInfo.currency
                        }
                    });
                }
            }

            // Verifica se l'utente sta già tracciando questo prodotto
            const existingTracking = await prisma.userProductTracking.findUnique({
                where: {
                    userId_productId: {
                        userId: user.id,
                        productId: product.id
                    }
                }
            });

            if (existingTracking) {
                // Controlla se questo è un caso di unificazione (stesso ASIN, URL diverso)
                const wasUnified = asin && cleanLink !== (await prisma.amazonProduct.findUnique({ 
                    where: { id: product.id }, 
                    select: { link: true } 
                }))?.link;

                const message = wasUnified 
                    ? `⚠️ Stai già tracciando questo prodotto!\n\n🔗 Ho unificato il tracking perché si tratta dello stesso prodotto Amazon (ASIN: ${asin}).\n\nUsa /list per vedere tutti i tuoi prodotti tracciati.`
                    : `⚠️ Stai già tracciando questo prodotto!\n\nUsa /list per vedere tutti i tuoi prodotti tracciati.`;
                    
                await this.telegramService.sendMessage(chatId, message);
                return;
            }

            // Aggiungi il tracking
            await prisma.userProductTracking.create({
                data: {
                    userId: user.id,
                    productId: product.id,
                    isActive: true
                }
            });

            // Ottieni il numero totale di utenti che tracciano questo prodotto
            const totalTrackers = await prisma.userProductTracking.count({
                where: { 
                    productId: product.id,
                    isActive: true 
                }
            });

            const successMessage = `
✅ <b>Prodotto aggiunto al tracking!</b>

📦 <b>${productInfo.title}</b>

💰 <b>Prezzo attuale:</b> ${productInfo.currentPrice ? `${productInfo.currentPrice.toFixed(2)} ${productInfo.currency}` : 'Non disponibile'}
${productInfo.originalPrice && productInfo.currentPrice && productInfo.originalPrice > productInfo.currentPrice ? 
    `💸 <b>Prezzo originale:</b> <s>${productInfo.originalPrice.toFixed(2)} ${productInfo.currency}</s>` : ''}

🔗 <a href="${cleanLink}">Vai al prodotto</a>

📊 Inizierò a monitorare il prezzo e ti avviserò quando scende.
${totalTrackers > 1 ? `\n👥 <i>Questo prodotto è tracciato da ${totalTrackers} utenti</i>` : ''}

💡 Usa /list per vedere tutti i tuoi prodotti tracciati.
            `.trim();

            await this.telegramService.sendMessage(chatId, successMessage);

            console.log(`✅ ${productInfo.title} | ${user.username || user.chatId}`);

        } catch (error) {
            console.error('Errore nell\'aggiunta del prodotto:', error);
            await this.telegramService.sendMessage(
                chatId,
                '❌ Si è verificato un errore durante l\'aggiunta del prodotto. Riprova più tardi.'
            );
        }
    }

    private isValidAmazonLink(link: string): boolean {
        return scrapingService.isValidAmazonUrl(link);
    }

    private cleanAmazonLink(link: string): string {
        try {
            const url = new URL(link);
            
            // Estrai l'ASIN dal path
            const asinMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
            
            if (asinMatch) {
                const asin = asinMatch[1] || asinMatch[2];
                // Normalizza sempre al formato standard per amazon.it
                return `https://amazon.it/dp/${asin}`;
            }
            
            // Se non trova l'ASIN, ritorna il link originale pulito
            return `${url.protocol}//${url.host}${url.pathname}`;
        } catch (error) {
            // Se il parsing dell'URL fallisce, ritorna il link originale
            return link;
        }
    }
}
