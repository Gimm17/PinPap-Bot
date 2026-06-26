# 🚀 PANDUAN HOSTING GRATIS - PAP BOT

Panduan lengkap cara hosting PAP Bot secara **GRATIS** di berbagai platform.

---

## 📋 DAFTAR ISI

1. [Persiapan](#persiapan)
2. [Railway (Recommended)](#1-railway-recommended)
3. [Render](#2-render)
4. [Fly.io](#3-flyio)
5. [Oracle Cloud](#4-oracle-cloud)
6. [Perbandingan Platform](#perbandingan-platform)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 PERSIAPAN

### Yang Perlu Disiapkan:

1. **Akun GitHub** - Untuk menyimpan kode
2. **Token Discord Bot** - Dari Discord Developer Portal
3. **Client ID** - Dari Discord Developer Portal
4. **Akun Platform Hosting** - Pilih salah satu

### Langkah Awal:

```bash
# 1. Push ke GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/PinPapBot.git
git push -u origin main

# 2. Pastikan .gitignore benar
# JANGAN commit file .env!
```

### File `.gitignore` yang Benar:

```gitignore
# Environment
.env
.env.*
*.json

# Node
node_modules/

# Data & Logs
data/
logs/
*.db
*.sqlite

# Others
others/
*.zip
```

---

## 1. RAILWAY (RECOMMENDED)

![Railway](https://img.shields.io/badge/Railway-Free%20%245%2Fmo-blue)

### Kenapa Railway?
- ✅ Free $5 credit per bulan
- ✅ Mudah deploy dari GitHub
- ✅ Auto-deploy setiap push
- ✅ Database gratis termasuk
- ✅ Logs real-time

### Langkah-Langkah:

#### 1. Daftar Railway
1. Buka [railway.app](https://railway.app)
2. Login dengan GitHub
3. Authorize Railway

#### 2. Deploy dari GitHub
1. Klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository `PinPapBot`
4. Klik **"Deploy Now"**

#### 3. Konfigurasi Environment
1. Di dashboard Railway, klik project
2. Pilih **"Variables"** tab
3. Tambahkan variables:

```
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
STORAGE=memory
NODE_ENV=production
```

#### 4. Set Port
1. Railway auto-detect port
2. Jika perlu, set `WEB_PORT=3000`

#### 5. Deploy Commands
```bash
# Di Railway terminal
npm run deploy
```

### Via CLI (Alternatif):

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Set environment
railway variables set BOT_TOKEN=your_token
railway variables set CLIENT_ID=your_client_id
railway variables set STORAGE=memory

# Run deploy commands
railway run npm run deploy

# Start
railway up
```

### Monitoring:

```bash
# View logs
railway logs

# Open dashboard
railway open
```

---

## 2. RENDER

![Render](https://img.shields.io/badge/Render-Free-green)

### Kenapa Render?
- ✅ 750 jam gratis per bulan
- ✅ Auto SSL
- ✅ Mudah setup
- ⚠️ Sleep setelah 15 menit idle

### Langkah-Langkah:

#### 1. Daftar Render
1. Buka [render.com](https://render.com)
2. Sign up dengan GitHub

#### 2. Create Web Service
1. Klik **"New"** → **"Web Service"**
2. Connect GitHub repository
3. Pilih `PinPapBot`

#### 3. Konfigurasi

| Field | Value |
|-------|-------|
| Name | `papbot` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | `Free` |

#### 4. Environment Variables

Di **"Advanced"** section, tambahkan:

```
Key: BOT_TOKEN
Value: your_bot_token

Key: CLIENT_ID
Value: your_client_id

Key: STORAGE
Value: memory

Key: NODE_ENV
Value: production
```

#### 5. Deploy
1. Klik **"Create Web Service"**
2. Tunggu build selesai
3. Deploy commands via Shell:

```bash
# Di Render Shell
npm run deploy
```

### Catatan Render:

- **Free tier sleep** setelah 15 menit idle
- **Cold start** ~30 detik saat bangun
- Cocok untuk bot dengan traffic rendah

---

## 3. FLY.IO

![Fly.io](https://img.shields.io/badge/Fly.io-Free%20tier-purple)

### Kenapa Fly.io?
- ✅ 3 VM gratis
- ✅ Good for bots
- ✅ IPv6 support
- ⚠️ Perlu credit card untuk verify

### Langkah-Langkah:

#### 1. Install Fly CLI

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. Login
```bash
fly auth login
```

#### 3. Deploy
```bash
# Di folder project
fly launch

# Pertanyaan:
# ? App name: papbot
# ? Region: nearest
# ? PostgreSQL: No
# ? Redis: No
```

#### 4. Set Environment
```bash
fly secrets set BOT_TOKEN=your_token
fly secrets set CLIENT_ID=your_client_id
fly secrets set STORAGE=memory
```

#### 5. Deploy Commands
```bash
# SSH ke app
fly ssh console

# Run deploy
npm run deploy

# Exit
exit
```

#### 6. Scale
```bash
# Free tier: 1 VM
fly scale count 1

# Set memory
fly scale memory 256
```

### Fly.io.toml (Auto-generated):

```toml
app = "papbot"
primary_region = "sin"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  STORAGE = "memory"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
```

---

## 4. ORACLE CLOUD

![Oracle Cloud](https://img.shields.io/badge/Oracle%20Cloud-Always%20Free-red)

### Kenapa Oracle Cloud?
- ✅ **Always Free** - 4 ARM instances
- ✅ 24 GB RAM gratis
- ✅ 2 TB storage gratis
- ✅ Tidak ada sleep
- ⚠️ Setup lebih kompleks

### Langkah-Langkah:

#### 1. Daftar Oracle Cloud
1. Buka [cloud.oracle.com](https://cloud.oracle.com)
2. Sign up (perlu credit card untuk verifikasi)
3. Pilih **"Always Free"**

#### 2. Create VM Instance
1. Go to **Compute** → **Instances**
2. Klik **"Create Instance"**
3. Konfigurasi:

| Field | Value |
|-------|-------|
| Name | `papbot` |
| Shape | `VM.Standard.A1.Flex` (4 OCPU, 24 GB RAM) |
| OS | Ubuntu 22.04 |
| SSH Key | Upload atau generate |

#### 3. Connect via SSH
```bash
ssh ubuntu@<public-ip>
```

#### 4. Install Node.js
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

#### 5. Clone & Setup
```bash
# Clone dari GitHub
git clone https://github.com/USERNAME/PinPapBot.git
cd PinPapBot

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env
# Isi BOT_TOKEN dan CLIENT_ID

# Deploy commands
npm run deploy
```

#### 6. Start with PM2
```bash
# Start bot
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

#### 7. Firewall Setup
```bash
# Open port 3000 (if needed)
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

---

## 📊 PERBANDINGAN PLATFORM

| Platform | Free Tier | Sleep? | Database | Setup | Recommended |
|---------|-----------|---------|----------|-------|-------------|
| **Railway** | $5/mo credit | ❌ No | ✅ Included | ⭐ Easy | ⭐⭐⭐⭐⭐ |
| **Render** | 750 hrs/mo | ✅ Yes | ❌ Separate | ⭐ Easy | ⭐⭐⭐⭐ |
| **Fly.io** | 3 VMs | ❌ No | ✅ Add-on | ⭐⭐ Medium | ⭐⭐⭐⭐ |
| **Oracle Cloud** | 4 ARM VMs | ❌ No | ✅ Included | ⭐⭐⭐ Hard | ⭐⭐⭐ |

### Rekomendasi:

| Kebutuhan | Platform |
|-----------|----------|
| **Paling Mudah** | Railway |
| **Paling Hemat** | Oracle Cloud |
| **Bot 24/7** | Railway / Oracle |
| **Bot Kadang Aktif** | Render |
| **Banyak Bot** | Oracle Cloud |

---

## 🔧 TROUBLESHOOTING

### Bot Tidak Mau Start

```bash
# Check logs
railway logs  # atau: fly logs, atau: pm2 logs

# Common issues:
# 1. BOT_TOKEN tidak set
# 2. CLIENT_ID salah
# 3. Dependencies error
```

### Commands Tidak Muncul

```bash
# Re-deploy commands
npm run deploy

# Check CLIENT_ID di .env
echo $CLIENT_ID
```

### Bot Sleep (Render)

```bash
# Solusi: Gunakan UptimeRobot
# 1. Daftar uptimerobot.com
# 2. Add Monitor → URL bot
# 3. Ping setiap 5 menit
```

### Memory Limit

```bash
# Railway: Upgrade plan
# Fly.io: fly scale memory 512
# Render: Upgrade plan
```

### Database Error

```bash
# Gunakan memory storage
STORAGE=memory

# Atau setup database eksternal:
# - MongoDB Atlas (free tier)
# - Supabase (free tier)
# - PlanetScale (free tier)
```

---

## 📱 MONITORING & MAINTENANCE

### Health Check

```bash
# Railway
railway logs --follow

# Render
# Dashboard → Logs

# Fly.io
fly logs

# Oracle/PM2
pm2 logs papbot
pm2 monit
```

### Auto-Restart

```bash
# PM2 auto-restart
pm2 start ecosystem.config.js --watch

# Railway/Render/Fly.io: auto-restart built-in
```

### Backup Data

```bash
# Download database (SQLite)
scp user@server:/app/data/papbot.db ./backup/

# Atau backup via admin command
/pap-admin backup
```

---

## 🎯 CHECKLIST DEPLOYMENT

- [ ] Bot token dari Discord Developer Portal
- [ ] Client ID dari Discord Developer Portal
- [ ] Repository GitHub sudah public/private
- [ ] `.env` di `.gitignore` (JANGAN commit)
- [ ] `npm run deploy` dijalankan setelah deploy
- [ ] Bot online di Discord
- [ ] Test `/pap-help` command
- [ ] Test `/pap-bootstrap` command
- [ ] Monitor logs untuk error

---

## 🔗 LINKS

| Resource | URL |
|----------|-----|
| **Railway** | https://railway.app |
| **Render** | https://render.com |
| **Fly.io** | https://fly.io |
| **Oracle Cloud** | https://cloud.oracle.com |
| **UptimeRobot** | https://uptimerobot.com |
| **Discord Dev Portal** | https://discord.com/developers/applications |

---

## ❓ FAQ

### Q: Mana yang paling mudah?
**A: Railway** - Tinggal connect GitHub, set env, deploy!

### Q: Mana yang gratis 100%?
**A: Oracle Cloud** - Always Free tier dengan 4 VM ARM

### Q: Bot saya sleep terus, kenapa?
**A: Render free tier sleep setelah 15 menit idle. Solusi: Railway atau Oracle**

### Q: Bisa pakai database gratis?
**A: Ya, pilih:**
- MongoDB Atlas (512MB free)
- Supabase (500MB free)
- PlanetScale (1GB free)
- SQLite di server (untuk single instance)

### Q: Cara update bot?
**A:**
```bash
# Railway/Fly.io
git push  # Auto-deploy

# Render
git push  # Auto-deploy

# Oracle Cloud
git pull
npm install
pm2 restart papbot
```

---

## 📝 CATATAN PENTING

1. **JANGAN COMMIT `.env`** - Token akan terekspos!
2. **Set `STORAGE=memory`** untuk platform gratis (kecuali ada database)
3. **Gunakan `npm run deploy`** setelah pertama kali deploy
4. **Monitor logs** untuk debugging
5. **Backup database** secara berkala (jika pakai SQLite)

---

**🎉 Selamat! Bot Anda sekarang online 24/7!**

Made with ❤️ for PAP Bot Community