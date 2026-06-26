// src/commands/registry.js
// Daftar slash commands untuk PAP Bot

import { SlashCommandBuilder } from "discord.js";

export const commands = [
  // ===================== HELP =====================
  new SlashCommandBuilder()
    .setName("pap-help")
    .setDescription("Tampilkan panduan & penjelasan mode PAP"),

  // ===================== BOOTSTRAP =====================
  new SlashCommandBuilder()
    .setName("pap-bootstrap")
    .setDescription("Buat kategori & channel default untuk PAP (admin)")
    .addStringOption((o) =>
      o.setName("category").setDescription("Nama kategori (default: papbot)")
    )
    .addStringOption((o) =>
      o.setName("commands").setDescription("Nama channel commands (default: commands)")
    )
    .addStringOption((o) =>
      o.setName("share").setDescription("Nama channel PAP default (opsional)")
    ),

  // ===================== PANEL =====================
  new SlashCommandBuilder()
    .setName("pap-panel")
    .setDescription("Tampilkan panel kontrol PAP di channel ini (owner/admin)"),

  // ===================== ROOM MANAGEMENT =====================
  new SlashCommandBuilder()
    .setName("pap-room")
    .setDescription("Kelola PAP Room")
    .addSubcommand((sc) =>
      sc
        .setName("create")
        .setDescription("Buat room baru (jalankan di #create-room)")
        .addIntegerOption((o) =>
          o
            .setName("capacity")
            .setDescription("0 = tidak terbatas; angka lain = batas member")
            .setMinValue(0)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName("close")
        .setDescription("Tutup & hapus room ini (jalankan di dalam room)")
    )
    .addSubcommand((sc) =>
      sc
        .setName("info")
        .setDescription("Lihat informasi room saat ini")
    )
    .addSubcommand((sc) =>
      sc
        .setName("list")
        .setDescription("Lihat daftar semua room di server")
    ),

  // ===================== MEMBERSHIP =====================
  new SlashCommandBuilder()
    .setName("pap-join")
    .setDescription("Gabung ke room ini (jika kapasitas diaktifkan)"),

  new SlashCommandBuilder()
    .setName("pap-leave")
    .setDescription("Keluar dari room ini"),

  new SlashCommandBuilder()
    .setName("pap-members")
    .setDescription("Lihat daftar member room saat ini"),

  // ===================== SETUP =====================
  new SlashCommandBuilder()
    .setName("pap-setup")
    .setDescription("Set mode PAP untuk channel ini (owner/admin)")
    .addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("Pilihan: ROUND | SWAP | CHAIN | QUOTA")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((o) =>
      o
        .setName("min_duration")
        .setDescription("Durasi round (menit), opsional")
        .setMinValue(1)
    )
    .addIntegerOption((o) =>
      o
        .setName("quota")
        .setDescription("Minimal submit (untuk mode QUOTA)")
        .setMinValue(2)
    ),

  // ===================== ROUND CONTROL =====================
  new SlashCommandBuilder()
    .setName("pap-start")
    .setDescription("Mulai round PAP di channel ini (owner/admin)"),

  new SlashCommandBuilder()
    .setName("pap-submit")
    .setDescription("Kirim PAP kamu ke round aktif (tidak dipost publik)")
    .addAttachmentOption((o) =>
      o.setName("photo").setDescription("Foto kamu").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pap-view")
    .setDescription("Lihat PAP sesuai aturan mode")
    .addIntegerOption((o) =>
      o.setName("page").setDescription("Halaman (mulai dari 1)").setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName("pap-close")
    .setDescription("Tutup round PAP di channel ini (owner/admin)"),

  new SlashCommandBuilder()
    .setName("pap-mode")
    .setDescription("Lihat mode & status round channel ini"),

  // ===================== STATISTICS =====================
  new SlashCommandBuilder()
    .setName("pap-stats")
    .setDescription("Lihat statistik PAP di server ini")
    .addStringOption((o) =>
      o
        .setName("type")
        .setDescription("Jenis statistik")
        .addChoices(
          { name: "Server Stats", value: "server" },
          { name: "My Stats", value: "user" },
          { name: "Room Stats", value: "room" }
        )
    ),

  // ===================== ADMIN =====================
  new SlashCommandBuilder()
    .setName("pap-admin")
    .setDescription("Perintah admin untuk PAP Bot")
    .addSubcommand((sc) =>
      sc
        .setName("backup")
        .setDescription("Backup data ke file (admin only)")
    )
    .addSubcommand((sc) =>
      sc
        .setName("restore")
        .setDescription("Restore data dari file (admin only)")
        .addAttachmentOption((o) =>
          o.setName("file").setDescription("File backup JSON").setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName("clear")
        .setDescription("Hapus semua data room (admin only)")
    )
    .addSubcommand((sc) =>
      sc
        .setName("status")
        .setDescription("Lihat status bot & database (admin only)")
    )
    .addSubcommand((sc) =>
      sc
        .setName("export")
        .setDescription("Export logs (admin only)")
        .addStringOption((o) =>
          o
            .setName("format")
            .setDescription("Format export")
            .addChoices(
              { name: "JSON", value: "json" },
              { name: "CSV", value: "csv" }
            )
        )
    ),
].map((c) => c.toJSON());