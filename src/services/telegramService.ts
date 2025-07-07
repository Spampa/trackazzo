import { TelegramSendMessageParams, TelegramInlineKeyboard } from '../types/telegram';

export class TelegramService {
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_KEY || '';
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_KEY non trovato nelle variabili d\'ambiente');
    }
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Invia un messaggio di testo a una chat
   */
  async sendMessage(
    chatId: number | string,
    text: string,
    options?: Partial<TelegramSendMessageParams>
  ): Promise<boolean> {
    try {
      const params: TelegramSendMessageParams = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      };

      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Errore nell\'invio del messaggio Telegram:', errorData);
        return false;
      }

      const result = await response.json() as { ok: boolean; result: { message_id: number } };
      return true;
    } catch (error) {
      console.error('Errore nella richiesta a Telegram:', error);
      return false;
    }
  }

  /**
   * Invia un messaggio con tastiera inline
   */
  async sendMessageWithKeyboard(
    chatId: number | string,
    text: string,
    keyboard: TelegramInlineKeyboard,
    options?: Partial<TelegramSendMessageParams>
  ): Promise<boolean> {
    return this.sendMessage(chatId, text, {
      ...options,
      reply_markup: keyboard
    });
  }

  /**
   * Invia una notifica di prezzo di prodotto con scraping automatico
   */
  async sendPriceAlert(
    chatId: number | string,
    productTitle: string,
    currentPrice: number,
    originalPrice: number,
    productLink: string,
    currency: string = 'EUR'
  ): Promise<boolean> {
    const discount = originalPrice > currentPrice ? 
      Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
    
    let message = `🎯 <b>Prezzo in calo!</b>\n\n📦 <b>${productTitle}</b>\n\n`;
    
    message += `💰 Prezzo attuale: <b>${currentPrice.toFixed(2)} ${currency}</b>\n`;
    
    if (originalPrice > currentPrice) {
      message += `💸 Prezzo originale: <s>${originalPrice.toFixed(2)} ${currency}</s>\n`;
      message += `📉 Sconto: <b>-${discount}%</b>\n\n`;
    } else {
      message += '\n';
    }
    
    message += `🛒 <a href="${productLink}">Vai al prodotto</a>`;

    const keyboard: TelegramInlineKeyboard = {
      inline_keyboard: [
        [
          { text: '🛒 Acquista ora', url: productLink },
          { text: '❌ Smetti di tracciare', callback_data: `stop_tracking_${chatId}` }
        ]
      ]
    };

    return this.sendMessageWithKeyboard(chatId, message, keyboard);
  }

  /**
   * Invia messaggio di benvenuto
   */
  async sendWelcomeMessage(chatId: number | string, username?: string): Promise<boolean> {
    const message = `
👋 Ciao ${username ? `@${username}` : 'utente'}!

Benvenuto nel bot di tracking prezzi Amazon! 🛒

Inviami il link di un prodotto Amazon e inizierò a monitorare il prezzo per te.

Comandi disponibili:
/start - Mostra questo messaggio
/help - Guida completa
/myproducts - I tuoi prodotti tracciati
/stop - Ferma il tracking di un prodotto
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Invia messaggio di aiuto
   */
  async sendHelpMessage(chatId: number | string): Promise<boolean> {
    const message = `
🆘 <b>Guida del Bot</b>

📋 <b>Come funziona:</b>
1. Invia il link di un prodotto Amazon
2. Il bot inizierà a monitorare il prezzo
3. Riceverai notifiche quando il prezzo scende

🔧 <b>Comandi:</b>
/start - Avvia il bot
/help - Mostra questa guida
/myproducts - Lista prodotti tracciati
/stop [link] - Ferma tracking prodotto

💡 <b>Suggerimenti:</b>
• Puoi tracciare più prodotti contemporaneamente
• Le notifiche arrivano quando il prezzo scende
• Usa i bottoni per gestire i prodotti
    `.trim();

    return this.sendMessage(chatId, message);
  }

  /**
   * Invia lista prodotti tracciati
   */
  async sendTrackedProductsList(
    chatId: number | string,
    products: Array<{
      title: string;
      currentPrice: number;
      originalPrice: number;
      link: string;
      currency: string;
    }>
  ): Promise<boolean> {
    if (products.length === 0) {
      return this.sendMessage(chatId, '📭 Non hai ancora prodotti in tracking.\n\nInvia un link Amazon per iniziare!');
    }

    let message = '📋 <b>I tuoi prodotti tracciati:</b>\n\n';
    
    products.forEach((product, index) => {
      const discount = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
      message += `${index + 1}. <b>${product.title}</b>\n`;
      message += `   💰 ${product.currentPrice.toFixed(2)} ${product.currency}`;
      if (discount > 0) {
        message += ` (📉 -${discount}%)`;
      }
      message += `\n   🔗 <a href="${product.link}">Vai al prodotto</a>\n\n`;
    });

    return this.sendMessage(chatId, message);
  }

  /**
   * Verifica se il bot token è valido
   */
  async verifyBotToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      return response.ok;
    } catch (error) {
      console.error('Errore nella verifica del bot token:', error);
      return false;
    }
  }
}
