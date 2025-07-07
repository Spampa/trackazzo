import { TelegramCallbackQuery } from "../types/telegram";
import { TelegramService } from "../services/telegramService";
import { ListCommand } from "./commands/listCommand";

export class CallbackHandler {
    private telegramService: TelegramService;

    constructor(telegramService: TelegramService) {
        this.telegramService = telegramService;
    }

    async handleCallback(callbackQuery: TelegramCallbackQuery): Promise<void> {
        const chatId = callbackQuery.message?.chat.id;
        const messageId = callbackQuery.message?.message_id;
        const callbackData = callbackQuery.data;

        if (!chatId || !callbackData) {
            return;
        }

        try {
            // Risposta immediata al callback per rimuovere il loading
            await this.answerCallbackQuery(callbackQuery.id);

            if (callbackData.startsWith('remove_')) {
                await ListCommand.handleRemoveCallback(
                    this.telegramService,
                    chatId,
                    callbackData,
                    messageId
                );
            } else if (callbackData === 'refresh_list') {
                await ListCommand.handleRefreshCallback(
                    this.telegramService,
                    chatId,
                    messageId
                );
            } else if (callbackData === 'add_product') {
                await ListCommand.handleAddProductCallback(
                    this.telegramService,
                    chatId
                );
            } else {
                console.log(`Callback non gestito: ${callbackData}`);
            }

        } catch (error) {
            console.error('Errore nella gestione del callback:', error);
            await this.telegramService.sendMessage(
                chatId,
                '❌ Si è verificato un errore. Riprova più tardi.'
            );
        }
    }

    private async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
        try {
            const botToken = process.env.TELEGRAM_BOT_KEY;
            const apiUrl = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;

            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    callback_query_id: callbackQueryId,
                    text: text || ''
                }),
            });
        } catch (error) {
            console.error('Errore nella risposta al callback query:', error);
        }
    }
}
