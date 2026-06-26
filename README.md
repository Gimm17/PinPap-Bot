# 📸 PAP Bot Discord

Discord Photo Sharing Bot dengan 4 mode unik: **ROUND**, **SWAP**, **CHAIN**, **QUOTA**

![Version](https://img.shields.io/badge/version-1.4.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ✨ Fitur

### 🎮 4 Mode Unik

| Mode | Deskripsi |
|------|-----------|
| **ROUND** | Yang submit bisa melihat galeri peserta lain (paginated) |
| **SWAP** | Peserta dipasangkan acak; lihat PAP pasangan |
| **CHAIN** | Lihat PAP orang tepat sebelum kamu (antrian berantai) |
| **QUOTA** | Galeri terbuka setelah kuota minimal tercapai |

### 🔒 Keamanan & Privacy

- **Ephemeral Messages** - Foto hanya terlihat oleh pengirim
- **Rate Limiting** - Cegah spam dengan rate limiter
- **Input Validation** - Validasi file & input ketat
- **Persistent Storage** - SQLite database untuk data permanen

### 📊 Fitur Tambahan

- **Room Management** - Buat room dengan kapasitas
- **Statistics** - Track submissions & aktivitas
- **Admin Commands** - Backup, restore, export
- **Web Dashboard** - Landing page dengan stats

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Copy example env
cp .env.example .env

# Edit .env dengan token Discord Anda
```

### 3. Deploy Commands

```bash
npm run deploy
```

### 4. Start Bot

```bash
npm start
```

---

## 📋 Commands

### User Commands

| Command | Deskripsi |
|---------|-----------|
| `/pap-help` | Tampilkan panduan |
| `/pap-join` | Gabung ke room |
| `/pap-leave` | Keluar dari room |
| `/pap-submit photo:` | Kirim foto |
| `/pap-view page?:` | Lihat foto |
| `/pap-mode` | Lihat status mode |

### Admin Commands

| Command | Deskripsi |
|---------|-----------|
| `/pap-bootstrap` | Setup kategori & channel |
| `/pap-setup mode:` | Set mode (ROUND/SWAP/CHAIN/QUOTA) |
| `/pap-start` | Mulai round |
| `/pap-close` | Tutup round |
| `/pap-room create/close/list/info` | Kelola room |
| `/pap-stats` | Lihat statistik |
| `/pap-admin backup/restore/clear/status/export` | Admin tools |

---

## ⚙️ Konfigurasi

### Environment Variables

```env
# Discord
BOT_TOKEN=your_bot_token
CLIENT_ID=your_client_id

# Storage (memory | sqlite | mongodb)
STORAGE=sqlite
DATABASE_PATH=./data/papbot.db

# Web Server
WEB_PORT=3000

# Rate Limiting
RATE_LIMIT_SUBMIT=5
RATE_LIMIT_VIEW=20
RATE_LIMIT_WINDOW=60000
```

---

## 🗃️ Storage Options

### SQLite (Default)

```env
STORAGE=sqlite
DATABASE_PATH=./data/papbot.db
```

### MongoDB

```env
STORAGE=mongodb
MONGODB_URI=mongodb://localhost:27017/papbot
```

### Memory (Development)

```env
STORAGE=memory
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🐳 Docker

### Build & Run

```bash
# Build image
docker build -t papbot .

# Run container
docker run -d \
  --name papbot \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  papbot
```

### Docker Compose

```bash
docker-compose up -d
```

---

## 📁 Project Structure

```
PinPapBot/
├── src/
│   ├── index.js              # Main entry point
│   ├── web.js                # Web server
│   ├── commands/
│   │   ├── registry.js       # Command definitions
│   │   └── deploy-commands.js
│   ├── config/
│   │   ├── config.js         # Config loader
│   │   └── constants.js      # Constants
│   ├── core/
│   │   ├── strategy.js       # Base strategy
│   │   ├── modes/
│   │   │   ├── round.js
│   │   │   ├── swap.js
│   │   │   ├── chain.js
│   │   │   └── quota.js
│   │   └── storage/
│   │       ├── index.js
│   │       ├── memory.js
│   │       └── sqlite.js
│   ├── db/
│   │   ├── index.js          # Database manager
│   │   └── models/
│   │       ├── channel.js
│   │       └── submission.js
│   └── utils/
│       ├── attachments.js
│       ├── permissions.js
│       ├── validation.js
│       ├── rateLimiter.js
│       └── logger.js
├── tests/
│   ├── test_setup.js
│   ├── test_validation.js
│   ├── test_rate_limiter.js
│   └── test_modes.js
├── data/                     # SQLite database
├── logs/                     # Log files
├── others/                   # Backup files
├── .env                      # Environment (JANGAN COMMIT!)
├── .env.example              # Example env
├── .gitignore
├── package.json
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js       # PM2 config
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## 🚦 Deployment

### PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

```bash
# View logs
pm2 logs papbot

# View error logs
tail -f logs/error.log
```

---

## 📜 Changelog

### v1.4.0 (Current)
- ✅ SQLite database persistence
- ✅ Rate limiting
- ✅ Input validation
- ✅ Logging system
- ✅ Docker support
- ✅ PM2 configuration
- ✅ Unit tests
- ✅ Admin commands
- ✅ Statistics command
- ✅ Web dashboard

### v1.3.0
- 4 game modes
- Room management
- Ephemeral messages
- Pagination

---

Made with ❤️ by PAP Bot Team