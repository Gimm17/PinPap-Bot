import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  // Panduan GUI
  new SlashCommandBuilder()
    .setName("pap-help")
    .setDescription("Tampilkan panduan & penjelasan mode PAP"),

  // Bootstrap kategori & channels (+ create-room + panel lobby)
  new SlashCommandBuilder()
    .setName("pap-bootstrap")
    .setDescription("Buat kategori & channel default untuk PAP (admin)")
    .addStringOption((o) =>
      o.setName("category").setDescription("Nama kategori (default: papbot)")
    )
    .addStringOption((o) =>
      o
        .setName("commands")
        .setDescription("Nama channel commands (default: commands)")
    )
    .addStringOption((o) =>
      o.setName("share").setDescription("Nama channel PAP default (opsional)")
    ),

  // (Opsional) kirim panel manual di channel aktif
  new SlashCommandBuilder()
    .setName("pap-panel")
    .setDescription("Tampilkan panel kontrol PAP di channel ini (owner/admin)"),

  // Kelola PAP Room (dengan kapasitas)
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
    ),

  // Membership
  new SlashCommandBuilder()
    .setName("pap-join")
    .setDescription("Gabung ke room ini (jika kapasitas diaktifkan)"),
  new SlashCommandBuilder()
    .setName("pap-leave")
    .setDescription("Keluar dari room ini"),

  // Setup mode (pakai AUTOCOMPLETE)
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
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

try {
  console.log("Registering slash commands...");
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: commands,
  });
  console.log("Done.");
} catch (e) {
  console.error(e);
}
