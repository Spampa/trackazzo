import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { TelegramUpdate, TelegramMessage } from './types/telegram';
import { TelegramService } from './services/telegramService';
import { CommandHandler } from './bot/commandHandler';
import { CallbackHandler } from './bot/callbackHandler';
import { PriceMonitoringJob } from './jobs/priceMonitoringJob';

// Configura dotenv
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Inizializza i servizi
const telegramService = new TelegramService();
const commandHandler = new CommandHandler(telegramService);
const callbackHandler = new CallbackHandler(telegramService);

// Inizializza il cron job per il monitoraggio prezzi
const priceMonitoringJob = PriceMonitoringJob.getInstance();

app.use(express.json());

app.post("/webhook", async (req: Request, res: Response) => {
    const update: TelegramUpdate = req.body;
    
    try {
        if (update.message) {
            const message: TelegramMessage = update.message;
            await commandHandler.handleMessage(message);
        } else if (update.callback_query) {
            await callbackHandler.handleCallback(update.callback_query);
        }
    } catch (error) {
        console.error('Errore nella gestione del webhook:', error);
    }
    
    res.status(200).send('OK');
})

// Avvia il cron job per il monitoraggio prezzi
priceMonitoringJob.start();

// Gestione della chiusura graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Ricevuto SIGINT, chiusura in corso...');
    await priceMonitoringJob.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Ricevuto SIGTERM, chiusura in corso...');
    await priceMonitoringJob.cleanup();
    process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`🤖 Bot Telegram per tracciamento prezzi Amazon avviato!`);
});
