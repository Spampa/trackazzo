import { TelegramMessage } from "../types";
import { TelegramService } from "../services/telegramService";
import { StartCommand } from "./commands/startCommand";
import { AddCommand } from "./commands/addCommand";
import { ListCommand } from "./commands/listCommand";
import { HelpCommand } from "./commands/helpCommand";

export class CommandHandler {
    private telegramService: TelegramService;
    private commands: Map<string, any>;

    constructor(telegramService: TelegramService) {
        this.telegramService = telegramService;
        this.commands = new Map();
        
        // Registra tutti i comandi
        this.registerCommands();
    }

    private registerCommands() {
        const startCommand = new StartCommand(this.telegramService);
        const addCommand = new AddCommand(this.telegramService);
        const listCommand = new ListCommand(this.telegramService);
        const helpCommand = new HelpCommand(this.telegramService);

        this.commands.set('/start', startCommand);
        this.commands.set('/add', addCommand);
        this.commands.set('/list', listCommand);
        this.commands.set('/myproducts', listCommand); // Alias per /list
        this.commands.set('/help', helpCommand);
    }

    async handleMessage(message: TelegramMessage): Promise<void> {
        const text = message.text?.trim() || '';
        const chatId = message.chat.id;
        
        try {
            // Estrai il comando dal testo
            const commandMatch = text.match(/^\/(\w+)(@\w+)?/);
            
            if (commandMatch) {
                const command = `/${commandMatch[1]}`;
                const commandHandler = this.commands.get(command);
                
                if (commandHandler) {
                    await commandHandler.execute(message);
                } else {
                    await this.telegramService.sendMessage(
                        chatId, 
                        '❓ Comando non riconosciuto. Usa /help per vedere i comandi disponibili.'
                    );
                }
            } else {
                // Non è un comando, potrebbe essere un link Amazon
                if (text.includes('amazon.') || text.includes('amzn.')) {
                    const addCommand = this.commands.get('/add');
                    await addCommand.handleDirectLink(message);
                } else {
                    await this.telegramService.sendMessage(
                        chatId,
                        '🛒 Invia un link Amazon per iniziare il tracking o usa /help per vedere i comandi disponibili.'
                    );
                }
            }
        } catch (error) {
            console.error('Errore nella gestione del messaggio:', error);
            await this.telegramService.sendMessage(
                chatId,
                '❌ Si è verificato un errore. Riprova più tardi.'
            );
        }
    }
}