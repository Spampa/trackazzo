import { TelegramMessage, TelegramInlineKeyboard } from "../../types/telegram";
import { BaseCommand } from "./baseCommand";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ListCommand extends BaseCommand {
    async execute(message: TelegramMessage): Promise<void> {
        const chatId = this.extractChatId(message);

        try {
            // Trova l'utente
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

            // Ottieni tutti i prodotti tracciati dall'utente
            const trackedProducts = await prisma.userProductTracking.findMany({
                where: {
                    userId: user.id,
                    isActive: true
                },
                include: {
                    product: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (trackedProducts.length === 0) {
                const emptyMessage = `
📭 <b>Nessun prodotto in tracking</b>

Non hai ancora prodotti da monitorare.

💡 <b>Per iniziare:</b>
• Usa <code>/add [link]</code> per aggiungere un prodotto
• Oppure invia direttamente un link Amazon

🎯 <b>Esempio:</b>
<code>/add https://amazon.it/dp/B08N5WRWNW</code>
                `.trim();

                await this.telegramService.sendMessage(chatId, emptyMessage);
                return;
            }

            // Prepara il messaggio con i prodotti
            let message = `📋 <b>I tuoi prodotti tracciati (${trackedProducts.length})</b>\n\n`;

            // Prepara i bottoni per la rimozione
            const keyboard: TelegramInlineKeyboard = {
                inline_keyboard: []
            };

            trackedProducts.forEach((tracking, index) => {
                const product = tracking.product;
                const num = index + 1;

                // Aggiungi al messaggio
                message += `${num}. <b>${product.title}</b>\n`;
                
                if (product.currentPrice !== null) {
                    message += `   💰 ${product.currentPrice.toFixed(2)} ${product.currency}`;
                    
                    if (product.originalPrice !== null && product.originalPrice > product.currentPrice) {
                        const discount = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
                        message += ` (📉 -${discount}%)`;
                    }
                } else {
                    message += `   ⏳ Prezzo in analisi...`;
                }
                
                message += `\n   🔗 <a href="${product.link}">Vai al prodotto</a>\n\n`;

                // Aggiungi bottone per rimuovere (max 1 bottone per riga per i nomi lunghi)
                const productName = product.title && product.title.length > 20 
                    ? product.title.substring(0, 20) + '...' 
                    : product.title || `Prodotto ${num}`;
                
                keyboard.inline_keyboard.push([{
                    text: `❌ ${productName}`,
                    callback_data: `remove_${tracking.id}`
                }]);
            });

            // Aggiungi bottoni di utilità
            keyboard.inline_keyboard.push([
                { text: '🔄 Aggiorna', callback_data: 'refresh_list' },
                { text: '➕ Aggiungi prodotto', callback_data: 'add_product' }
            ]);

            await this.telegramService.sendMessageWithKeyboard(chatId, message, keyboard);

        } catch (error) {
            console.error('Errore nel comando list:', error);
            await this.telegramService.sendMessage(
                chatId,
                '❌ Si è verificato un errore nel recupero dei prodotti. Riprova più tardi.'
            );
        }
    }

    // Metodo per gestire la rimozione tramite callback
    static async handleRemoveCallback(
        telegramService: any,
        chatId: number,
        callbackData: string,
        messageId?: number
    ): Promise<void> {
        try {
            const trackingId = parseInt(callbackData.replace('remove_', ''));
            
            // Trova il tracking
            const tracking = await prisma.userProductTracking.findUnique({
                where: { id: trackingId },
                include: { product: true }
            });

            if (!tracking) {
                await telegramService.sendMessage(chatId, '❌ Prodotto non trovato.');
                return;
            }

            // Rimuovi il tracking
            await prisma.userProductTracking.delete({
                where: { id: trackingId }
            });

            const successMessage = `
✅ <b>Prodotto rimosso dal tracking!</b>

🗑️ <b>${tracking.product.title}</b> non sarà più monitorato.

💡 Usa /add per aggiungere nuovi prodotti al tracking.
            `.trim();

            await telegramService.sendMessage(chatId, successMessage);

            console.log(`Prodotto rimosso dal tracking: ${trackingId}`);

        } catch (error) {
            console.error('Errore nella rimozione del prodotto:', error);
            await telegramService.sendMessage(
                chatId,
                '❌ Si è verificato un errore nella rimozione. Riprova più tardi.'
            );
        }
    }

    // Metodo per gestire il refresh della lista
    static async handleRefreshCallback(
        telegramService: any,
        chatId: number,
        messageId?: number
    ): Promise<void> {
        // Simula un nuovo comando /list
        const fakeMessage: TelegramMessage = {
            message_id: messageId || 0,
            date: Date.now(),
            chat: { id: chatId, type: 'private' },
            from: { id: chatId, is_bot: false, first_name: 'User' }
        };

        const listCommand = new ListCommand(telegramService);
        await listCommand.execute(fakeMessage);
    }

    // Metodo per gestire il callback di aggiunta prodotto
    static async handleAddProductCallback(
        telegramService: any,
        chatId: number
    ): Promise<void> {
        const message = `
➕ <b>Aggiungi nuovo prodotto</b>

💡 <b>Invia un link Amazon in uno di questi modi:</b>

1️⃣ <b>Comando:</b> <code>/add [link]</code>
2️⃣ <b>Diretto:</b> Invia solo il link

📝 <b>Esempio:</b>
<code>/add https://amazon.it/dp/B08N5WRWNW</code>

o semplicemente:
<code>https://amazon.it/dp/B08N5WRWNW</code>
        `.trim();

        await telegramService.sendMessage(chatId, message);
    }
}
