# 🤖 Trackazzo - Bot Telegram per Tracciamento Prezzi Amazon

Bot Telegram avanzato per il tracciamento automatico dei prezzi Amazon con notifiche in tempo reale, sistema di unificazione prodotti e monitoraggio multi-utente.

## 🚀 Caratteristiche Principali

- **🔍 Tracciamento Multi-Prodotto** - Aggiungi prodotti Amazon tramite link
- **⏰ Monitoraggio Automatico** - Controllo prezzi ogni 60 secondi 
- **🔔 Notifiche Intelligenti** - Avvisi solo quando i prezzi calano
- **👥 Multi-Utente** - Più utenti tracciano gli stessi prodotti
- **🔗 Unificazione Automatica** - Evita duplicati e ottimizza performance
- **🕷️ Scraping Robusto** - Playwright con selettori ottimizzati
- **🗄️ Database Completo** - Storico prezzi e gestione utenti

## 🛠️ Stack Tecnologico

**Backend**: TypeScript, Express.js, Prisma ORM  
**Database**: MySQL  
**Scraping**: Playwright  
**Automation**: node-cron  
**Bot**: Telegram Bot API

## ⚡ Quick Start

```bash
# 1. Clone e setup
git clone <repository-url>
cd trackazzo
npm install

# 2. Configura ambiente
cp .env.example .env
# Modifica .env con i tuoi token

# 3. Setup database
npm run db:generate
npm run db:push

# 4. Avvia
npm run dev
```

### 📋 Configurazione .env

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_URL="mysql://user:pass@localhost:3306/trackazzo"
PORT=3000
```

## 🎮 Comandi Bot

| Comando | Descrizione |
|---------|-------------|
| `/start` | Registra utente |
| `/add <link>` | Aggiungi prodotto Amazon |
| `/list` | Visualizza prodotti tracciati |
| `/help` | Mostra aiuto |

**💡 Puoi anche incollare direttamente il link Amazon!**

## 🔧 Architettura

```
src/
├── bot/commands/          # Comandi bot
├── services/              # Scraping e monitoraggio  
├── jobs/                  # Cron job automatici
└── index.ts              # Server Express
```

### 🗄️ Database Schema

- **TelegramUser** - Utenti registrati
- **AmazonProduct** - Prodotti tracciati (URL normalizzati)
- **UserProductTracking** - Relazioni N:N utenti-prodotti
- **PriceHistory** - Storico prezzi per grafici

## � Sistema Unificazione

**Problema**: Amazon ha URL diversi per lo stesso prodotto  
**Soluzione**: Normalizzazione ASIN e unificazione automatica

```
Input:  https://www.amazon.it/Product-Title/dp/B08N5WRWNW?ref=test
Output: https://amazon.it/dp/B08N5WRWNW
```

**Benefici**:
- 🚀 Performance: 1 scraping per prodotto invece di N
- 👥 Collaborativo: Più utenti = stesso tracking
- 🔔 Notifiche: Tutti ricevono avvisi per lo stesso prodotto

## ⏰ Monitoraggio Automatico

**Cron Job**: Ogni 60 secondi  
**Processo**: Scraping → Confronto prezzi → Notifiche  
**Ottimizzazioni**: Browser riutilizzabile, pause intelligenti  
**Cleanup**: Rimozione storico vecchio (30+ giorni)

```typescript
if (nuovoPrezzo < prezzoVecchio) {
    notifyAllUsers(product, oldPrice, newPrice);
}
```

## 🧪 Testing

```bash
# Test monitoraggio prezzi
npm run test:monitoring

# Test notifiche simulate  
npm run test:notification

# Test unificazione prodotti
npm run test:unification

# Setup test calo prezzo
npm run setup:price-test
```

## 🚀 Deploy Produzione

### Webhook Telegram
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

### PM2
```bash
npm run build
pm2 start dist/index.js --name trackazzo
```

## 📊 Features Avanzate

### 🎯 Selettori Amazon Ottimizzati
- **Titolo**: `#productTitle` (normalizzato alla prima virgola)
- **Prezzo**: `.a-price-whole` + `.a-price-fraction` 
- **Prezzo originale**: `.a-price.a-text-price .a-offscreen`
- **Valuta**: Auto-rilevata dal contenuto pagina

### 🛡️ Gestione Errori
- Rate limiting Amazon con pause intelligenti
- Retry automatico su errori temporanei
- Timeout robusti e cleanup risorse
- Log strutturati (solo errori e cali prezzo)

### ⚡ Performance
- Browser headless riutilizzabile
- Scraping parallelo ottimizzato
- Database query efficienti
- Unificazione prodotti duplicati

## 🔮 Roadmap

- [ ] **Multi-siti**: eBay, AliExpress
- [ ] **Grafici prezzi**: Visualizzazione storico
- [ ] **Alert personalizzati**: % sconto, prezzo target
- [ ] **Dashboard web**: Interfaccia gestione
- [ ] **API pubblica**: Integrazione terze parti

## 🤝 Contributi

1. Fork repository
2. Crea feature branch
3. Commit modifiche  
4. Push e apri Pull Request

## 📝 Licenza

MIT License

---

**🚀 Production Ready** | **⚡ High Performance** | **👥 Multi-User** | **🔒 Secure**

*Sviluppato con ❤️ per automatizzare il tracking prezzi Amazon*
   PORT=3000
   ```

4. **Configura il database**
   ```bash
   # Genera il client Prisma
   npm run db:generate
   
   # Sincronizza lo schema con il database
   npm run db:push
   ```

5. **Compila il progetto**
   ```bash
   npm run build
   ```

## 🏃‍♂️ Utilizzo

### Avvio in Sviluppo
```bash
npm run dev
```

### Avvio in Produzione
```bash
npm start
```

### Comandi Bot Telegram

- `/start` - Registra l'utente e avvia il bot
- `/add <link_amazon>` - Aggiungi un prodotto da tracciare
- `/list` - Visualizza i tuoi prodotti tracciati
- `/help` - Mostra l'aiuto

**Puoi anche incollare direttamente un link Amazon nel chat!**

### Test del Sistema di Monitoraggio
```bash
npm run test:monitoring
```

## 🔧 Struttura del Progetto

```
src/
├── bot/
│   ├── commands/          # Comandi del bot
│   ├── commandHandler.ts  # Gestione comandi
│   └── callbackHandler.ts # Gestione callback
├── services/
│   ├── amazonScrapingService.ts     # Scraping Amazon
│   ├── priceMonitoringService.ts    # Monitoraggio prezzi
│   └── telegramService.ts           # Servizio Telegram
├── jobs/
│   └── priceMonitoringJob.ts        # Cron job
├── types/
│   └── telegram.ts                  # Tipi Telegram
└── index.ts                         # Entry point
```

## 📊 Database Schema

Il progetto utilizza 4 tabelle principali:

- **TelegramUser** - Utenti registrati
- **AmazonProduct** - Prodotti tracciati
- **UserProductTracking** - Relazione utenti-prodotti
- **PriceHistory** - Storico prezzi

## ⚙️ Configurazione Cron Job

Il sistema esegue automaticamente:

- **Monitoraggio prezzi**: ogni 60 secondi
- **Pulizia storico**: ogni giorno alle 3:00 (mantiene 30 giorni)

## 🐛 Debug e Troubleshooting

### Visualizza Database
```bash
npm run db:studio
```

### Log del Monitoraggio
Il sistema logga dettagliatamente:
- Prodotti monitorati
- Prezzi rilevati
- Notifiche inviate
- Errori di scraping

### Problemi Comuni

1. **Bot non risponde**: Verifica il token e il webhook
2. **Scraping fallisce**: Amazon potrebbe bloccare le richieste
3. **Database errors**: Controlla la connessione MySQL

## 🚀 Deploy

### Configurazione Webhook
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

### Variabili d'Ambiente Produzione
- `DATABASE_URL` - URL database produzione
- `TELEGRAM_BOT_TOKEN` - Token del bot
- `PORT` - Porta del server

## 🤝 Contributi

Le pull request sono benvenute! Per modifiche importanti, apri prima un issue.

## 📝 Licenza

MIT License

## 🔮 Roadmap

- [ ] Supporto per più siti e-commerce
- [ ] Grafici storici prezzi
- [ ] Alert personalizzabili (% sconto minimo)
- [ ] Integrazione con altri messenger
- [ ] Dashboard web

---

Sviluppato con ❤️ per automatizzare il tracking dei prezzi Amazon
