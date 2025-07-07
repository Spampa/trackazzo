// Tipi per l'API di Telegram Bot

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  entities?: TelegramMessageEntity[];
}

export interface TelegramMessageEntity {
  type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'pre' | 'text_link' | 'text_mention';
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
}

export interface TelegramInlineKeyboard {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: TelegramWebApp;
  login_url?: TelegramLoginUrl;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  pay?: boolean;
}

export interface TelegramWebApp {
  url: string;
}

export interface TelegramLoginUrl {
  url: string;
  forward_text?: string;
  bot_username?: string;
  request_write_access?: boolean;
}

// Tipi per le risposte dell'API
export interface TelegramSendMessageParams {
  chat_id: number | string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  entities?: TelegramMessageEntity[];
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  protect_content?: boolean;
  reply_to_message_id?: number;
  allow_sending_without_reply?: boolean;
  reply_markup?: TelegramInlineKeyboard;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections?: number;
  allowed_updates?: string[];
}

// Tipi per comandi bot
export interface TelegramBotCommand {
  command: string;
  description: string;
}

// Enum per tipi di chat
export enum TelegramChatType {
  PRIVATE = 'private',
  GROUP = 'group',
  SUPERGROUP = 'supergroup',
  CHANNEL = 'channel'
}

// Enum per tipi di entità del messaggio
export enum TelegramEntityType {
  MENTION = 'mention',
  HASHTAG = 'hashtag',
  CASHTAG = 'cashtag',
  BOT_COMMAND = 'bot_command',
  URL = 'url',
  EMAIL = 'email',
  PHONE_NUMBER = 'phone_number',
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  STRIKETHROUGH = 'strikethrough',
  CODE = 'code',
  PRE = 'pre',
  TEXT_LINK = 'text_link',
  TEXT_MENTION = 'text_mention'
}
