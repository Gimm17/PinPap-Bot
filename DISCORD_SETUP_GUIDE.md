# 🎮 PANDUAN SETUP DISCORD DEVELOPER PORTAL

Panduan lengkap cara membuat bot Discord dan mendapatkan token untuk PAP Bot.

---

## 📋 DAFTAR ISI

1. [Membuat Akun Discord](#1-membuat-akun-discord)
2. [Akses Developer Portal](#2-akses-developer-portal)
3. [Membuat Aplikasi Baru](#3-membuat-aplikasi-baru)
4. [Membuat Bot User](#4-membuat-bot-user)
5. [Mendapatkan Token](#5-mendapatkan-token)
6. [Mendapatkan Client ID](#6-mendapatkan-client-id)
7. [Setup Permissions](#7-setup-permissions)
8. [Enable Intents](#8-enable-intents)
9. [Invite Bot ke Server](#9-invite-bot-ke-server)
10. [Troubleshooting](#troubleshooting)

---

## 1. MEMBUAT AKUN DISCORD

### Jika Sudah Punya Akun:
```
✅ Skip ke langkah 2
```

### Jika Belum Punya:

1. Buka **https://discord.com/register**
2. Isi form:
   - Email
   - Username
   - Password
   - Tanggal lahir
3. Klik **"Continue"**
4. Verifikasi email

---

## 2. AKSES DEVELOPER PORTAL

### Langkah:

1. Buka **https://discord.com/developers/applications**
2. Login dengan akun Discord Anda
3. Anda akan melihat dashboard Developer Portal

![Developer Portal](https://i.imgur.com/example1.png)

---

## 3. MEMBUAT APLIKASI BARU

### Langkah:

1. Klik tombol **"New Application"** di pojok kanan atas

![New Application Button](https://i.imgur.com/example2.png)

2. Isi form popup:
   - **App Name**: `PAP Bot` (atau nama lain)
   - **Team**: Pilih "Personal" (untuk bot pribadi)

3. Klik **"Create"**

4. Anda akan diarahkan ke halaman **General Information**

### Isi Informasi Bot:

| Field | Isi |
|-------|-----|
| **Name** | PAP Bot |
| **Description** | Discord Photo Sharing Bot dengan 4 mode unik |
| **App Icon** | Upload gambar bot (opsional) |
| **Terms of Service URL** | Kosongkan |
| **Privacy Policy URL** | Kosongkan |

---

## 4. MEMBUAT BOT USER

### Langkah:

1. Di menu kiri, klik **"Bot"**

![Bot Menu](https://i.imgur.com/example3.png)

2. Klik tombol **"Add Bot"**

3. Popup konfirmasi muncul, klik **"Yes, do it!"**

4. Bot user berhasil dibuat!

---

## 5. MENDAPATKAN TOKEN

### Langkah:

1. Di halaman **Bot**, cari section **"Build-A-Bot"**

2. Klik **"Reset Token"** (jika token sudah ada)
   - ⚠️ **PERHATIAN**: Token hanya ditampilkan sekali!
   - Simpan token dengan aman

3. Klik **"Copy"** untuk menyalin token

4. Token akan terlihat seperti:
   ```
   YOUR_BOT_TOKEN_HERE
   ```

### ⚠️ PENTING:

```
🚨 JANGAN PERNAH SHARE TOKEN KE SIAPAPUN!
🚨 JANGAN COMMIT TOKEN KE GITHUB!
🚨 JANGAN POST TOKEN DI FORUM/CHAT!
```

Token = Password bot. Jika bocor, orang bisa mengontrol bot Anda!

### Jika Token Hilang:

1. Klik **"Reset Token"** lagi
2. Token lama akan invalid
3. Token baru akan dibuat

---

## 6. MENDAPATKAN CLIENT ID

### Langkah:

1. Di menu kiri, klik **"General Information"**

2. Cari field **"Application ID"**

3. Klik **"Copy"**

4. Client ID akan terlihat seperti:
   ```
   YOUR_CLIENT_ID_HERE
   ```

### Perbedaan Token vs Client ID:

| Jenis | Fungsi | Contoh |
|------|--------|---------|
| **Token** | Login bot (RAHASIA!) | `MTQyMjQ0NTQ...` |
| **Client ID** | Invite bot (PUBLIC) | `YOUR_CLIENT_ID_HERE` |

---

## 7. SETUP PERMISSIONS

### Langkah:

1. Kembali ke menu **"Bot"**

2. Scroll ke section **"Privileged Gateway Intents"**

3. Enable intents berikut:

   ```
   ✅ PRESENCE INTENT
   ✅ SERVER MEMBERS INTENT
   ✅ MESSAGE CONTENT INTENT
   ```

![Intents](https://i.imgur.com/example4.png)

4. Klik **"Save Changes"**

5. Klik **"Yes, I understand"** di popup

### Mengapa Perlu Intents?

| Intent | Fungsi |
|--------|--------|
| **Presence Intent** | Melihat status member |
| **Server Members Intent** | Melihat member list |
| **Message Content Intent** | Membaca isi pesan |

---

## 8. ENABLE INTENTS

### Langkah:

1. Di menu kiri, klik **"Bot"**

2. Di section **"Privileged Gateway Intents"**, enable:

   ```
   ✅ PRESENCE INTENT
   ✅ SERVER MEMBERS INTENT  
   ✅ MESSAGE CONTENT INTENT
   ```

3. Klik **"Save Changes"**

---

## 9. INVITE BOT KE SERVER

### Cara 1: Via OAuth2 URL Generator

1. Di menu kiri, klik **"OAuth2"** → **"URL Generator"**

2. Di **"Scopes"**, centang:
   ```
   ✅ bot
   ✅ applications.commands
   ```

3. Di **"Bot Permissions"**, centang:
   ```
   ✅ General Permissions:
      - View Channels
   
   ✅ Text Permissions:
      - Send Messages
      - Manage Messages
      - Embed Links
      - Attach Files
      - Read Message History
      - Use Slash Commands
   
   ✅ Voice Permissions:
      - Connect
      - Speak
   
   ✅ Advanced Permissions:
      - Administrator (opsional, untuk testing)
   ```

4. Di bagian bawah, akan muncul **"Generated URL"**:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID_HERE&permissions=8&scope=bot%20applications.commands
   ```

5. Klik **"Copy"**

6. Buka URL di browser

7. Pilih server untuk invite bot

8. Klik **"Continue"**

9. Klik **"Authorize"**

10. Selesai! Bot akan muncul di server Anda

### Cara 2: Invite Link Manual

Buat link manual dengan format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Ganti `YOUR_CLIENT_ID` dengan Client ID Anda.

---

## 📁 SETUP FILE .ENV

### Buat File .env

Di folder project, buat file `.env`:

```env
# Discord Configuration
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
CLIENT_ID=YOUR_CLIENT_ID_HERE

# Storage Configuration
STORAGE=memory

# Bot Settings
MAX_ROOMS=5
DEFAULT_CATEGORY=papbot

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log

# Environment
NODE_ENV=development
```

### ⚠️ PENTING:

```
🚨 PASTIKAN FILE .env ADA DI .gitignore
🚨 JANGAN COMMIT FILE .env KE GITHUB
🚨 JANGAN SHARE FILE .env KE SIAPAPUN
```

---

## 🔒 KEAMANAN TOKEN

### Jika Token Bocor:

1. **SEGERA** pergi ke Developer Portal
2. Klik **Bot** → **Reset Token**
3. Update `.env` dengan token baru
4. Restart bot
5. Revoke access di server jika perlu

### Best Practices:

```
✅ Simpan token di environment variables
✅ Gunakan .gitignore untuk mengecualikan .env
✅ Gunakan token di platform hosting (Railway, dll)
✅ Rotate token secara berkala
```

---

## 📝 CHECKLIST SETUP

- [ ] Akun Discord sudah ada
- [ ] Developer Portal diakses
- [ ] Aplikasi baru dibuat
- [ ] Bot user dibuat
- [ ] Token disalin dan disimpan aman
- [ ] Client ID disalin
- [ ] Intents diaktifkan
- [ ] Permissions diset
- [ ] Bot di-invite ke server
- [ ] File .env dibuat
- [ ] .gitignore mengandung .env

---

## 🎯 LANGKAH SELANJUTNYA

### Setelah Setup Discord:

1. **Deploy Commands**
   ```bash
   npm run deploy
   ```

2. **Start Bot**
   ```bash
   npm start
   ```

3. **Test Bot**
   - Ketik `/pap-help` di Discord
   - Ketik `/pap-bootstrap` untuk setup channel

---

## ❓ FAQ

### Q: Token tidak muncul?
**A:** Token hanya ditampilkan sekali saat dibuat. Klik "Reset Token" untuk buat baru.

### Q: Bot tidak muncul di server?
**A:** Pastikan:
1. Invite link benar
2. Bot sudah di-authorize
3. Bot memiliki permission yang cukup

### Q: Commands tidak muncul?
**A:**
1. Run `npm run deploy`
2. Tunggu beberapa menit
3. Restart Discord client (Ctrl+R)

### Q: Bot offline terus?
**A:**
1. Cek token di .env sudah benar
2. Cek logs untuk error
3. Pastikan intents aktif

### Q: Error "Privileged intent not enabled"?
**A:** Enable intents di Developer Portal → Bot → Privileged Gateway Intents

---

## 📱 TROUBLESHOOTING

### Bot Tidak Online

```bash
# Cek logs
npm start

# Jika error:
# - Token salah → Reset token di Developer Portal
# - Intents tidak aktif → Aktifkan di Developer Portal
# - Permission kurang → Invite ulang dengan permission lebih
```

### Commands Tidak Muncul

```bash
# Re-deploy commands
npm run deploy

# Clear Discord cache (Ctrl+R di Discord)
# Tunggu 5-10 menit
```

### Bot Error di Server

```bash
# Cek permission bot di server
# Bot harus punya role dengan permission:
# - View Channels
# - Send Messages
# - Manage Channels
# - Use Slash Commands
```

---

## 🔗 LINKS

| Resource | URL |
|----------|-----|
| **Developer Portal** | https://discord.com/developers/applications |
| **Discord API Docs** | https://discord.com/developers/docs |
| **Discord.js Guide** | https://discordjs.guide |
| **Permission Calculator** | https://discordapi.com/permissions.html |

---

## 🎮 CONTOH KONFIGURASI LENGKAP

### File .env (Development)
```env
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
CLIENT_ID=YOUR_CLIENT_ID_HERE
STORAGE=memory
NODE_ENV=development
LOG_LEVEL=debug
```

### File .env (Production/Railway)
```env
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
CLIENT_ID=YOUR_CLIENT_ID_HERE
STORAGE=memory
NODE_ENV=production
LOG_LEVEL=info
WEB_PORT=3000
```

---

**🎉 Selamat! Bot Discord Anda sudah siap digunakan!**

Made with ❤️ for PAP Bot Community