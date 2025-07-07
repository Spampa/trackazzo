# 🐳 Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker e Docker Compose installati
- Token del bot Telegram
- Dominio con HTTPS per il webhook

### 1. Configurazione

Copia il file di esempio delle variabili d'ambiente:
```bash
cp .env.example .env
```

Modifica `.env` con i tuoi valori:
```bash
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_URL=https://your-domain.com/webhook
DATABASE_URL=file:./data/trackazzo.db
```

### 2. Deploy con Docker Compose

**Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows PowerShell:**
```powershell
.\setup.ps1
```

**Manualmente:**
```bash
# Build dell'immagine
docker-compose build

# Avvio dei servizi
docker-compose up -d

# Verifica stato
docker-compose ps
```

## Gestione del Container

### Comandi Utili

```bash
# Visualizza logs
docker-compose logs -f

# Riavvia il servizio
docker-compose restart

# Aggiorna il codice
docker-compose down
docker-compose build
docker-compose up -d

# Stop completo
docker-compose down

# Pulizia completa (rimuove anche volumi)
docker-compose down -v
```

### Monitoraggio

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Logs in tempo reale:**
```bash
docker-compose logs -f trackazzo-bot
```

## Struttura dei Volumi

```
├── data/           # Database SQLite persistente
└── logs/           # File di log (se configurati)
```

## Configurazione Avanzata

### Variabili d'Ambiente

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `BOT_TOKEN` | Token del bot Telegram | **Required** |
| `WEBHOOK_URL` | URL webhook HTTPS | **Required** |
| `DATABASE_URL` | Path database SQLite | `file:./data/trackazzo.db` |
| `PORT` | Porta del server | `3000` |
| `NODE_ENV` | Environment Node.js | `production` |

### Personalizzazione docker-compose.yml

Per modificare le configurazioni del container, edita `docker-compose.yml`:

```yaml
services:
  trackazzo-bot:
    # Cambia porta
    ports:
      - "8080:3000"
    
    # Aggiungi variabili d'ambiente
    environment:
      - CUSTOM_VAR=value
    
    # Modifica restart policy
    restart: always
```

## Troubleshooting

### Container non parte
```bash
# Verifica logs
docker-compose logs

# Controlla configurazione
docker-compose config
```

### Database problemi
```bash
# Reset database (⚠️ cancella tutti i dati)
docker-compose down -v
docker-compose up -d
```

### Problemi di connessione
- Verifica che il `BOT_TOKEN` sia corretto
- Assicurati che `WEBHOOK_URL` sia HTTPS e raggiungibile
- Controlla che la porta 3000 sia accessibile

## Backup e Restore

### Backup
```bash
# Backup del database
docker cp trackazzo-bot:/app/data/trackazzo.db ./backup-$(date +%Y%m%d).db
```

### Restore
```bash
# Stop container
docker-compose down

# Ripristina database
cp backup-20250707.db ./data/trackazzo.db

# Riavvia
docker-compose up -d
```
