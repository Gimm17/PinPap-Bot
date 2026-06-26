# 📋 IMPLEMENTATION PLAN - PAP Bot Discord

**Tanggal:** 2026-06-26
**Status:** 📝 Planning Phase
**Versi Target:** 1.4.0

---

## 🚨 PRIORITAS 1: FIX KRITIS (HARUS DILAKUKAN SEBELUM BOT JALAN)

### 1.1 File yang Harus Dibuat

| File | Status | Deskripsi |
|------|--------|-----------|
| `src/web.js` | ❌ MISSING | Web server untuk OAuth landing page |
| `src/commands/registry.js` | ❌ MISSING | Daftar slash commands untuk index.js |

### 1.2 Kode yang Harus Dibuat

#### `src/commands/registry.js`
```javascript
// src/commands/registry.js
import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("pap-help")
    .setDescription("Tampilkan panduan & penjelasan mode PAP"),

  new SlashCommandBuilder()
    .setName("pap-bootstrap")
    .setDescription("Buat kategori & channel default untuk PAP (admin)")
    .addStringOption(o => o.setName("category").setDescription("Nama kategori (default: papbot)"))
    .addStringOption(o => o.setName("commands").setDescription("Nama channel commands (default: commands)"))
    .addStringOption(o => o.setName("share").setDescription("Nama channel PAP default (opsional)")),

  new SlashCommandBuilder()
    .setName("pap-panel")
    .setDescription("Tampilkan panel kontrol PAP di channel ini (owner/admin)"),

  new SlashCommandBuilder()
    .setName("pap-room")
    .setDescription("Kelola PAP Room")
    .addSubcommand(sc => sc.setName("create").setDescription("Buat room baru")
      .addIntegerOption(o => o.setName("capacity").setDescription("0 = tidak terbatas").setMinValue(0)))
    .addSubcommand(sc => sc.setName("close").setDescription("Tutup & hapus room ini")),

  new SlashCommandBuilder().setName("pap-join").setDescription("Gabung ke room ini"),
  new SlashCommandBuilder().setName("pap-leave").setDescription("Keluar dari room ini"),

  new SlashCommandBuilder()
    .setName("pap-setup")
    .setDescription("Set mode PAP untuk channel ini (owner/admin)")
    .addStringOption(o => o.setName("mode").setDescription("ROUND | SWAP | CHAIN | QUOTA").setRequired(true).setAutocomplete(true))
    .addIntegerOption(o => o.setName("min_duration").setDescription("Durasi round (menit)").setMinValue(1))
    .addIntegerOption(o => o.setName("quota").setDescription("Minimal submit (mode QUOTA)").setMinValue(2)),

  new SlashCommandBuilder().setName("pap-start").setDescription("Mulai round PAP (owner/admin)"),
  
  new SlashCommandBuilder()
    .setName("pap-submit")
    .setDescription("Kirim PAP kamu")
    .addAttachmentOption(o => o.setName("photo").setDescription("Foto kamu").setRequired(true)),

  new SlashCommandBuilder()
    .setName("pap-view")
    .setDescription("Lihat PAP sesuai mode")
    .addIntegerOption(o => o.setName("page").setDescription("Halaman (mulai 1)").setMinValue(1)),

  new SlashCommandBuilder().setName("pap-close").setDescription("Tutup round PAP (owner/admin)"),
  new SlashCommandBuilder().setName("pap-mode").setDescription("Lihat mode & status round"),
].map(c => c.toJSON());
```

#### `src/web.js`
```javascript
// src/web.js
import http from 'http';

export function startWeb(client) {
  const PORT = process.env.WEB_PORT || 3000;
  
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>PAP Bot</title></head>
        <body style="font-family:Arial;text-align:center;padding:50px;">
          <h1>📸 PAP Bot Discord</h1>
          <p>Bot aktif dengan ${client.guilds.cache.size} server.</p>
          <p><a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot%20applications.commands">Invite Bot</a></p>
        </body>
      </html>
    `);
  });

  server.listen(PORT, () => {
    console.log(`[web] Server jalan di port ${PORT}`);
  });
}
```

---

## 🔧 PRIORITAS 2: ENHANCEMENT FITUR

### 2.1 Fitur yang Perlu Ditambahkan

| Fitur | Prioritas | Status | Deskripsi |
|-------|-----------|--------|-----------|
| **Database Persistence** | 🔴 Tinggi | ❌ | State bot hilang saat restart. Perlu database. |
| **Rate Limiting** | 🔴 Tinggi | ❌ | Cegah spam submit/view |
| **Image Validation** | 🔴 Tinggi | ⚠️ | Validasi gambar lebih ketat |
| **Error Logging** | 🟡 Sedang | ❌ | Logging ke file atau service |
| **Backup System** | 🟡 Sedang | ❌ | Backup state ke file/json |
| **Statistics** | 🟡 Sedang | ❌ | Stats: jumlah submit, active users |
| **Multi-language** | 🟢 Rendah | ❌ | Support bahasa Indonesia/Inggris |
| **Admin Dashboard** | 🟢 Rendah | ❌ | Web dashboard untuk admin |

### 2.2 Database Implementation

**Opsi Database:**
1. **SQLite** (paling mudah, file-based)
2. **MongoDB** (cloud dengan MongoDB Atlas free tier)
3. **PostgreSQL** (jika ada hosting)

**Rekomendasi:** SQLite untuk development, MongoDB untuk production.

**File yang Perlu Dibuat:**
```
src/
├── db/
│   ├── index.js           # Database connection
│   ├── models/
│   │   ├── channel.js     # Channel state model
│   │   ├── submission.js  # Submission model
│   │   └── room.js        # Room model
│   └── migrations/
│       └── 001-init.sql   # SQLite migrations
```

### 2.3 Rate Limiting

**File Baru:**
```
src/
├── middleware/
│   └── rateLimiter.js     # Rate limiter untuk interactions
```

---

## 🔒 PRIORITAS 3: KEAMANAN

### 3.1 Masalah Keamanan Saat Ini

| Issue | Severity | Deskripsi |
|-------|----------|-----------|
| **Token di .env** | 🔴 Kritis | BOT_TOKEN terekspos di repo |
| **No Input Validation** | 🔴 Tinggi | Tidak ada validasi input user |
| **Memory Storage** | 🟡 Sedang | Data bisa hilang saat restart |
| **No Rate Limit** | 🟡 Sedang | Rentan spam |
| **Ephemeral Messages** | 🟢 OK | Sudah benar - pakai ephemeral |

### 3.2 Tindakan Keamanan

#### A. Environment Variables
```
# .gitignore - PASTIKAN ADA:
.env
*.json
node_modules/

# Jangan pernah commit:
- BOT_TOKEN
- CLIENT_ID
- Database credentials
- API keys
```

#### B. Input Validation
```javascript
// src/utils/validation.js (BUAT BARU)
export function validateImage(attachment) {
  const MAX_SIZE = 8 * 1024 * 1024; // 8MB
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  
  if (!attachment) throw new Error('File tidak ditemukan.');
  if (!ALLOWED_TYPES.includes(attachment.contentType)) {
    throw new Error('Hanya file gambar (PNG, JPG, WEBP, GIF) yang diperbolehkan.');
  }
  if (attachment.size > MAX_SIZE) {
    throw new Error('Ukuran file maksimal 8MB.');
  }
  return true;
}

export function sanitizeInput(str, maxLength = 100) {
  if (!str) return '';
  return str.toString().trim().slice(0, maxLength).replace(/[<>@#]/g, '');
}
```

#### C. Rate Limiter
```javascript
// src/utils/rateLimiter.js (BUAT BARU)
const submissions = new Map(); // userId -> [{ timestamp }]
const LIMITS = {
  submit: { max: 5, window: 60000 }, // 5 submit per menit
  view: { max: 20, window: 60000 },  // 20 view per menit
};

export function checkRateLimit(userId, action) {
  const limit = LIMITS[action];
  if (!limit) return true;
  
  const now = Date.now();
  const userActions = submissions.get(userId) || [];
  const recent = userActions.filter(t => now - t < limit.window);
  
  if (recent.length >= limit.max) {
    return false; // Rate limited
  }
  
  recent.push(now);
  submissions.set(userId, recent);
  return true;
}
```

---

## 📁 FILE STRUCTURE FINAL

```
PinPapBot/
├── src/
│   ├── index.js                    # ✅ Main entry point
│   ├── web.js                      # ❌ BUAT - Web server
│   │
│   ├── commands/
│   │   ├── registry.js             # ❌ BUAT - Command definitions
│   │   └── deploy-commands.js      # ✅ Deploy commands
│   │
│   ├── config/
│   │   ├── constants.js            # ✅ Constants
│   │   └── config.js               # ❌ BUAT - Config loader
│   │
│   ├── core/
│   │   ├── strategy.js             # ✅ Base strategy
│   │   │
│   │   ├── modes/
│   │   │   ├── round.js            # ✅ Mode ROUND
│   │   │   ├── swap.js             # ✅ Mode SWAP
│   │   │   ├── chain.js            # ✅ Mode CHAIN
│   │   │   └── quota.js            # ✅ Mode QUOTA
│   │   │
│   │   └── storage/
│   │       ├── index.js            # ✅ Storage adapter
│   │       ├── memory.js            # ✅ Memory storage
│   │       ├── sqlite.js            # ❌ BUAT - SQLite storage
│   │       └── mongodb.js           # ❌ BUAT - MongoDB storage
│   │
│   ├── utils/
│   │   ├── attachments.js          # ✅ Download attachments
│   │   ├── permissions.js          # ✅ Permission helpers
│   │   ├── validation.js           # ❌ BUAT - Input validation
│   │   ├── rateLimiter.js          # ❌ BUAT - Rate limiting
│   │   └── logger.js               # ❌ BUAT - Logging utility
│   │
│   ├── db/
│   │   ├── index.js                # ❌ BUAT - Database connection
│   │   └── models/
│   │       ├── channel.js          # ❌ BUAT
│   │       ├── submission.js       # ❌ BUAT
│   │       └── room.js             # ❌ BUAT
│   │
│   └── middleware/
│       └── rateLimiter.js          # ❌ BUAT - Rate limit middleware
│
├── data/                           # ❌ BUAT - Data directory
│   └── papbot.db                   # SQLite database (auto-create)
│
├── logs/                           # ❌ BUAT - Logs directory
│   └── bot.log
│
├── tests/                          # ❌ BUAT - Test directory
│   ├── test_round.js
│   ├── test_swap.js
│   └── test_quota.js
│
├── .env                            # ✅ Environment (JANGAN COMMIT!)
├── .env.example                    # ❌ BUAT - Example env
├── .gitignore                      # ❌ BUAT - Git ignore
├── package.json                    # ✅ Package config
├── ecosystem.config.js             # ❌ BUAT - PM2 config
├── Dockerfile                      # ❌ BUAT - Docker support
└── README.md                       # ✅ Documentation
```

---

## 📝 CHECKLIST IMPLEMENTASI

### Phase 1: Fix Kritis (Hari 1)
- [ ] Buat `src/commands/registry.js`
- [ ] Buat `src/web.js`
- [ ] Test bot bisa start tanpa error
- [ ] Test semua slash commands ter-register

### Phase 2: Keamanan (Hari 2-3)
- [ ] Buat `.gitignore` yang benar
- [ ] Buat `.env.example`
- [ ] Buat `src/utils/validation.js`
- [ ] Buat `src/utils/rateLimiter.js`
- [ ] Implementasi rate limiting di interactions

### Phase 3: Database (Hari 4-5)
- [ ] Setup SQLite database
- [ ] Buat `src/db/index.js`
- [ ] Buat models (channel, submission, room)
- [ ] Migrate dari memory ke SQLite
- [ ] Test persistence restart

### Phase 4: Enhancement (Hari 6-7)
- [ ] Buat `src/utils/logger.js`
- [ ] Implementasi logging
- [ ] Buat statistics command
- [ ] Buat backup system
- [ ] Buat admin commands

### Phase 5: Testing & Deployment (Hari 8-10)
- [ ] Buat unit tests
- [ ] Buat Dockerfile
- [ ] Setup PM2 / systemd
- [ ] Monitoring & logging
- [ ] Documentation update

---

## 🚀 LANGKAH SELANJUTNYA

### Sekarang (Hari Ini)
1. **BUAT 2 FILE KRITIS:**
   ```bash
   # File: src/commands/registry.js
   # File: src/web.js
   ```
   Saya bisa langsung buatkan kode lengkapnya.

2. **BUAT .gitignore:**
   ```gitignore
   # Dependencies
   node_modules/
   
   # Environment
   .env
   .env.*
   *.json
   
   # Data
   data/
   *.db
   *.sqlite
   
   # Logs
   logs/
   *.log
   
   # IDE
   .vscode/
   .idea/
   
   # OS
   .DS_Store
   Thumbs.db
   
   # Backup
   others/
   *.zip
   ```

3. **TEST BOT:**
   ```bash
   npm install
   npm run deploy  # Register commands
   npm start       # Start bot
   ```

---

## 📊 ESTIMASI WAKTU

| Phase | Waktu | Prioritas |
|-------|-------|-----------|
| Fix Kritis | 1 hari | 🔴 Blocking |
| Keamanan | 2 hari | 🔴 Tinggi |
| Database | 2 hari | 🟡 Sedang |
| Enhancement | 2 hari | 🟡 Sedang |
| Testing | 2 hari | 🟢 Rendah |

**Total: ~9 hari kerja**

---

## ❓ PERTANYAAN UNTUK USER

1. **Storage:** Mau pakai storage apa?
   - [ ] Memory only (saat ini - data hilang saat restart)
   - [ ] SQLite (file-based, mudah)
   - [ ] MongoDB (cloud, production)
   - [ ] File storage (JSON)

2. **Deployment:** Di mana bot akan dihosting?
   - [ ] VPS (Virtual Private Server)
   - [ ] Heroku / Railway
   - [ ] Docker container
   - [ ] Raspberry Pi / Local server

3. **Fitur Prioritas:** Fitur mana yang paling penting?
   - [ ] Database persistence
   - [ ] Rate limiting
   - [ ] Statistics
   - [ ] Multi-language

4. **Testing:** Perlu test automation?
   - [ ] Ya, unit tests
   - [ ] Ya, integration tests
   - [ ] Tidak, testing manual saja

---

**TANDA TANGAN:**
- Dibuat oleh: Claude AI Assistant
- Tanggal: 2026-06-26
- Versi Dokumen: 1.0