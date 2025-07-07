import { TelegramMessage } from "../../types/telegram";
import { TelegramService } from "../../services/telegramService";

export abstract class BaseCommand {
    protected telegramService: TelegramService;

    constructor(telegramService: TelegramService) {
        this.telegramService = telegramService;
    }

    abstract execute(message: TelegramMessage): Promise<void>;

    protected extractChatId(message: TelegramMessage): number {
        return message.chat.id;
    }

    protected extractUserId(message: TelegramMessage): number | undefined {
        return message.from?.id;
    }

    protected extractUsername(message: TelegramMessage): string | undefined {
        return message.from?.username;
    }

    protected extractFirstName(message: TelegramMessage): string | undefined {
        return message.from?.first_name;
    }
}
