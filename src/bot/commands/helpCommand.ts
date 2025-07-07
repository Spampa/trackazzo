import { TelegramMessage } from "../../types/telegram";
import { BaseCommand } from "./baseCommand";

export class HelpCommand extends BaseCommand {
    async execute(message: TelegramMessage): Promise<void> {
        const chatId = this.extractChatId(message);

        const helpMessage = `
🆘 <b>Guida del Bot Amazon Tracker</b>

🚀 <b>Come funziona:</b>
1. Registrati con /start
2. Aggiungi prodotti da tracciare
3. Ricevi notifiche quando il prezzo scende

📋 <b>Comandi disponibili:</b>

🏁 <code>/start</code> - Registrati e inizia
➕ <code>/add [link]</code> - Aggiungi prodotto al tracking
📱 <code>/list</code> - Vedi prodotti tracciati
❓ <code>/help</code> - Mostra questa guida

💡 <b>Modi per aggiungere prodotti:</b>

1️⃣ <b>Con comando:</b>
<code>/add https://amazon.it/dp/B08N5WRWNW</code>

2️⃣ <b>Link diretto:</b>
Invia semplicemente il link Amazon

🔧 <b>Gestione prodotti:</b>
• Usa /list per vedere tutti i prodotti
• Clicca "❌ Rimuovi" per smettere di tracciare
• Il bot monitora automaticamente i prezzi

🌍 <b>Domini Amazon supportati:</b>
• amazon.it, amazon.com, amazon.de
• amazon.fr, amazon.es, amazon.co.uk
• amazon.ca, amazon.com.au
• Link accorciati amzn.to, amzn.eu

⚡ <b>Notifiche automatiche:</b>
Riceverai un messaggio quando:
• Il prezzo di un prodotto scende
• C'è uno sconto significativo

❓ <b>Problemi?</b>
Assicurati che i link Amazon siano completi e validi.

🎯 <b>Inizia subito:</b>
Invia un link Amazon per iniziare il tracking!
        `.trim();

        await this.telegramService.sendMessage(chatId, helpMessage);
    }
}
