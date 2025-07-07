import { TelegramMessage } from "../../types/telegram";
import { BaseCommand } from "./baseCommand";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class StartCommand extends BaseCommand {
    async execute(message: TelegramMessage): Promise<void> {
        const chatId = this.extractChatId(message);
        const username = this.extractUsername(message);
        const firstName = this.extractFirstName(message);

        try {
            // Verifica se l'utente esiste già
            let user = await prisma.telegramUser.findUnique({
                where: { chatId: chatId.toString() }
            });

            if (!user) {
                // Crea nuovo utente
                user = await prisma.telegramUser.create({
                    data: {
                        chatId: chatId.toString(),
                        username: username || null
                    }
                });
                console.log(`👋 Nuovo utente: ${username || chatId}`);
            } else {
                // Aggiorna username se è cambiato
                if (username && user.username !== username) {
                    await prisma.telegramUser.update({
                        where: { id: user.id },
                        data: { username: username }
                    });
                }
            }

            // Invia messaggio di benvenuto
            const welcomeMessage = `
👋 Ciao ${firstName || username || 'utente'}!

Benvenuto nel bot di tracking prezzi Amazon! 🛒

🚀 <b>Come iniziare:</b>
• Usa <code>/add [link]</code> per tracciare un prodotto
• Oppure invia direttamente un link Amazon

📋 <b>Comandi disponibili:</b>
/add - Aggiungi prodotto al tracking
/list - Vedi i tuoi prodotti tracciati  
/help - Guida completa

💡 <b>Esempio:</b>
<code>/add https://amazon.it/dp/B08N5WRWNW</code>

Inizia inviando un link Amazon! 🎯
            `.trim();

            await this.telegramService.sendMessage(chatId, welcomeMessage);

        } catch (error) {
            console.error('Errore nel comando start:', error);
            await this.telegramService.sendMessage(
                chatId,
                '❌ Si è verificato un errore durante la registrazione. Riprova più tardi.'
            );
        }
    }
}
