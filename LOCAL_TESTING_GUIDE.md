# 🧪 PANDUAN TESTING LOCAL & HOSTING LOCAL

Panduan lengkap cara testing bot Discord secara lokal dan hosting di komputer sendiri.

---

## 📋 DAFTAR ISI

1. [Persiapan Environment](#1-persiapan-environment)
2. [Testing Bot Secara Lokal](#2-testing-bot-secara-lokal)
3. [Error Logs & Debugging](#3-error-logs--debugging)
4. [Hosting Local (Self-Hosting)](#4-hosting-local-self-hosting)
5. [Tools & Utilities](#5-tools--utilities)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. PERSIAPAN ENVIRONMENT

### A. Install Node.js

```
Download: https://nodejs.org/
Version: 18.x atau 20.x (LTS)
```

### B. Install Code Editor

**Rekomendasi:**
- Visual Studio Code (Gratis) - https://code.visualstudio.com/
- WebStorm (Berbayar)
- Sublime Text

### C. Install Git

```
Download: https://git-scm.com/
```

### D. Clone Repository

```bash
cd "C:\Users\HP\OneDrive\Documents\CODINGAN\BOT-DISCORD\PinPapBot"

# Jika sudah ada, skip ini
# git clone https://github.com/Gimm17/PinPapBot.git
```

### E. Install Dependencies

```bash
npm install
```

---

## 2. TESTING BOT SECARA LOKAL

### A. Setup Environment Variables

Buat file `.env` di root folder:

```env
# Discord Configuration
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here

# Storage
STORAGE=memory

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/bot.log

# Environment
NODE_ENV=development
```

### B. Running Bot Locally

#### Option 1: Direct Run
```bash
npm start
```

#### Option 2: Development Mode (dengan auto-reload)
```bash
# Install nodemon globally
npm install -g nodemon

# Run with nodemon
nodemon src/index.js
```

#### Option 3: With Debug Output
```bash
# Windows PowerShell
$env:DEBUG="*"; npm start

# Windows CMD
set DEBUG=* && npm start

# Linux/Mac
DEBUG=* npm start
```

### C. Testing Slash Commands

#### Deploy Commands ke Test Server

```bash
# Buat file deploy-guild.js jika belum ada
# Deploy ke server tertentu (INSTAN)
npm run deploy:guild
```

**Atau deploy manual:**

```javascript
// deploy-test.js
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { commands } from './src/commands/registry.js';

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Deploying commands to test guild...');
    
    // Ganti dengan Guild ID server test Anda
    const GUILD_ID = '123456789012345678';
    
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    
    console.log('✅ Commands deployed successfully!');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
```

```bash
# Jalankan
node deploy-test.js
```

---

## 3. ERROR LOGS & DEBUGGING

### A. Console Logs

Bot sudah memiliki sistem logging built-in:

```javascript
// Contoh output logs:
[2024-06-27T10:30:00.000Z] [INFO] [main] Starting PAP Bot...
[2024-06-27T10:30:01.000Z] [INFO] [main] Logged in as BotName#1234
[2024-06-27T10:30:02.000Z] [INFO] [slash] Guild commands registered for 123456789
[2024-06-27T10:30:03.000Z] [ERROR] [command] Error executing command: ...
```

### B. Enable Debug Mode

Ubah `.env`:

```env
LOG_LEVEL=debug
NODE_ENV=development
DEBUG=true
```

### C. View Logs in Real-Time

#### Option 1: Console Output
```bash
# Logs akan tampil di console
npm start
```

#### Option 2: Log File
```bash
# Logs disimpan di ./logs/bot.log
# Buka dengan text editor
code logs/bot.log

# Atau tail (Linux/Mac/WSL)
tail -f logs/bot.log
```

#### Option 3: PowerShell Get-Content
```powershell
# PowerShell
Get-Content logs/bot.log -Wait
```

### D. Common Error Patterns

#### Error: Invalid Token
```
[ERROR] [main] Failed to start bot
{
  "error": "An invalid token was provided."
}
```
**Solution:**
- Cek `BOT_TOKEN` di `.env`
- Reset token di Discord Developer Portal
- Pastikan tidak ada spasi/karakter aneh

#### Error: Missing Permissions
```
[ERROR] Missing Permissions
```
**Solution:**
- Bot tidak punya permission yang cukup
- Check bot role di server
- Enable intents di Developer Portal

#### Error: Module Not Found
```
Error: Cannot find module 'xxx'
```
**Solution:**
```bash
npm install xxx
# atau
npm install
```

---

## 4. HOSTING LOCAL (SELF-HOSTING)

### A. Hosting dengan PM2 (Recommended)

PM2 adalah process manager untuk Node.js yang:
- Auto-restart saat crash
- Keep-alive
- Logs management
- Startup script

#### Install PM2
```bash
npm install -g pm2
```

#### Start Bot dengan PM2
```bash
# Start
pm2 start ecosystem.config.js

# Atau start langsung
pm2 start src/index.js --name papbot

# View logs
pm2 logs papbot

# Monitor
pm2 monit

# Stop
pm2 stop papbot

# Restart
pm2 restart papbot
```

#### Auto-start on Boot (Windows)

```bash
# Install pm2-windows-startup
npm install -g pm2-windows-startup

# Setup startup
pm2-startup install

# Save PM2 config
pm2 save
```

### B. Hosting dengan Windows Service (NSSM)

#### Install NSSM
```
Download: https://nssm.cc/download
Extract to: C:\nssm\
```

#### Create Service
```bash
# Buka CMD as Administrator
cd C:\nssm\win64

# Install service
nssm install PAPBot

# GUI akan muncul, set:
# Path: C:\Program Files\nodejs\node.exe
# Arguments: C:\path\to\PinPapBot\src\index.js
# Working directory: C:\path\to\PinPapBot

# Start service
nssm start PAPBot
```

### C. Hosting dengan Docker

#### Build Docker Image
```bash
# Build
docker build -t papbot:local .

# Run
docker run -d \
  --name papbot \
  --env-file .env \
  -p 3000:3000 \
  papbot:local
```

#### View Docker Logs
```bash
# View logs
docker logs -f papbot

# View last 100 lines
docker logs --tail 100 papbot
```

---

## 5. TOOLS & UTILITIES

### A. VS Code Extensions (Recommended)

```
1. Discord.js Tools
2. ESLint
3. Prettier
4. Error Lens
5. Better Comments
6. GitLens
```

### B. Debug Configuration di VS Code

Buat file `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Bot",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/index.js",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Deploy Commands",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/commands/deploy-commands.js",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

**Cara Pakai:**
1. Buka VS Code
2. Tekan F5 atau klik "Run and Debug"
3. Pilih "Launch Bot"
4. Debugger akan attach ke proses

### C. Logging Utilities

#### Quick Log Viewer Script

Buat file `view-logs.js`:

```javascript
// view-logs.js
const fs = require('fs');
const readline = require('readline');

const logFile = './logs/bot.log';

if (!fs.existsSync(logFile)) {
  console.log('Log file not found. Run the bot first.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  terminal: true
});

console.log('--- Bot Logs (Last 50 Lines) ---\n');

let lines = [];
rl.on('line', (line) => {
  lines.push(line);
  if (lines.length > 50) lines.shift();
});

rl.on('close', () => {
  lines.forEach(line => console.log(line));
});
```

```bash
# Run
node view-logs.js
```

#### Real-time Log Monitor

```javascript
// monitor-logs.js
const fs = require('fs');

const logFile = './logs/bot.log';

console.log('Monitoring logs... Press Ctrl+C to stop.\n');

fs.watchFile(logFile, (curr, prev) => {
  if (curr.size > prev.size) {
    const stream = fs.createReadStream(logFile, {
      start: prev.size,
      end: curr.size
    });
    stream.on('data', (data) => {
      process.stdout.write(data);
    });
  }
});
```

```bash
# Run
node monitor-logs.js
```

### D. Error Tracking Script

```javascript
// errors-only.js
const fs = require('fs');
const readline = require('readline');

const logFile = './logs/bot.log';

if (!fs.existsSync(logFile)) {
  console.log('No log file found.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(logFile)
});

console.log('--- ERRORS ONLY ---\n');

rl.on('line', (line) => {
  if (line.includes('[ERROR]') || 
      line.includes('Error:') || 
      line.includes('Failed') ||
      line.includes('Exception')) {
    console.log(line);
  }
});
```

```bash
# Run
node errors-only.js
```

---

## 6. TROUBLESHOOTING

### A. Bot Tidak Mau Start

**Gejala:**
```
Bot langsung exit tanpa error
```

**Solution:**
```bash
# Check syntax error
node --check src/index.js

# Run dengan debug
DEBUG=* node src/index.js
```

### B. Commands Tidak Muncul

**Gejala:**
- Bot online
- Commands tidak muncul di Discord

**Solution:**
```bash
# 1. Deploy ulang commands
npm run deploy

# 2. Cek CLIENT_ID benar
echo $CLIENT_ID

# 3. Cek BOT_TOKEN benar
# Pastikan tidak ada spasi

# 4. Invite bot ulang dengan scope yang benar
# scope=bot%20applications.commands
```

### C. Memory Leak

**Gejala:**
- Memory naik terus
- Bot lambat setelah beberapa jam

**Solution:**
```bash
# Monitor memory
pm2 monit

# Atau dengan Node.js
node --inspect src/index.js
# Buka chrome://inspect
```

### D. Connection Lost

**Gejala:**
```
WebSocket connection closed
```

**Solution:**
- Cek koneksi internet
- Restart bot
- Gunakan keep-alive di code

```javascript
// Di src/index.js, tambahkan:
client.on('disconnect', () => {
  console.log('[warn] WebSocket disconnected');
});

client.on('error', (error) => {
  console.error('[error] WebSocket error:', error);
});
```

---

## 📊 QUICK REFERENCE

### Start Commands

| Task | Command |
|------|---------|
| Start bot | `npm start` |
| Start dengan nodemon | `nodemon src/index.js` |
| Start dengan PM2 | `pm2 start ecosystem.config.js` |
| Start dengan debug | `DEBUG=* npm start` |
| View PM2 logs | `pm2 logs papbot` |
| View PM2 monit | `pm2 monit` |

### Deploy Commands

| Task | Command |
|------|---------|
| Deploy global | `npm run deploy` |
| Deploy guild | `npm run deploy:guild` |
| Check logs | `pm2 logs` |

### Debug Commands

| Task | Command |
|------|---------|
| Check Node version | `node -v` |
| Check npm version | `npm -v` |
| Update packages | `npm update` |
| Clear cache | `npm cache clean --force` |
| Reinstall | `rm -rf node_modules && npm install` |

---

## 🔗 USEFUL LINKS

| Resource | URL |
|----------|-----|
| Discord.js Docs | https://discord.js.org/ |
| Discord Dev Portal | https://discord.com/developers/applications |
| PM2 Docs | https://pm2.keymetrics.io/ |
| Node.js Docs | https://nodejs.org/docs/ |
| VS Code Download | https://code.visualstudio.com/ |

---

## ✅ CHECKLIST LOCAL TESTING

- [ ] Node.js terinstall
- [ ] Dependencies terinstall (`npm install`)
- [ ] File `.env` dikonfigurasi
- [ ] BOT_TOKEN sudah benar
- [ ] CLIENT_ID sudah benar
- [ ] Bot bisa start (`npm start`)
- [ ] Commands terdeploy (`npm run deploy:guild`)
- [ ] Logs bisa dilihat
- [ ] PM2 terinstall (optional)

---

## 📝 NOTES

- **Development**: Gunakan `NODE_ENV=development` untuk logs lebih detail
- **Production**: Gunakan `NODE_ENV=production` untuk performance
- **Logs**: Simpan di `./logs/bot.log` dengan rotasi harian
- **PM2**: Auto-restart saat crash, keep-alive
- **Docker**: Untuk environment terisolasi

---

**Happy Testing!** 🚀