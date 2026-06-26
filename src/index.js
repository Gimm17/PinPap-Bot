// HARUS PALING ATAS agar process.env terisi sebelum modul lain membaca:
import "dotenv/config";

// Discord.js & REST (untuk register guild commands instan)
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  REST,
  Routes,
} from "discord.js";

import { startWeb } from "./web.js";
import { commands } from "./commands/registry.js";

import { DEFAULTS, MODES } from "./config/constants.js";
import { ensureGuildChannel } from "./utils/permissions.js";
import { downloadAttachment } from "./utils/attachments.js";
import { initLogger, getLogger } from "./utils/logger.js";

// Import storage
import { Storage } from "./core/storage/index.js";
import {
  getChannelState,
  resetRound,
  closeRound,
} from "./core/storage/memory.js";

import { RoundStrategy } from "./core/modes/round.js";
import { SwapStrategy } from "./core/modes/swap.js";
import { ChainStrategy } from "./core/modes/chain.js";
import { QuotaStrategy } from "./core/modes/quota.js";

// Initialize logger
initLogger({ level: process.env.LOG_LEVEL || 'info' });
const log = getLogger();

/* ===================== Konfigurasi ===================== */
const MAX_ROOMS = 5;
const CATEGORY_NAME = "papbot";
const LOBBY_NAME = "create-room";
const DEFAULT_SHARE_PREFIX = "pap-share-";

const strategies = {
  [MODES.ROUND]: new RoundStrategy(),
  [MODES.SWAP]: new SwapStrategy(),
  [MODES.CHAIN]: new ChainStrategy(),
  [MODES.QUOTA]: new QuotaStrategy(),
};

const MODE_INFO = {
  ROUND: {
    title: "ROUND",
    brief: "Yang submit bisa melihat galeri peserta lain (paginated).",
    details: "Alur: /pap-start → /pap-submit → /pap-view (4 foto/halaman).",
  },
  SWAP: {
    title: "SWAP",
    brief: "Peserta dipasangkan acak; lihat PAP pasangan.",
    details: "Butuh kamu & pasangan sama-sama submit.",
  },
  CHAIN: {
    title: "CHAIN",
    brief: "Lihat PAP orang tepat sebelum kamu.",
    details: "Antrian berantai; pengirim pertama belum melihat apa pun.",
  },
  QUOTA: {
    title: "QUOTA",
    brief: "Galeri terbuka setelah kuota minimal.",
    details:
      "Set kuota via /pap-setup quota:N; /pap-view aktif setelah tercapai.",
  },
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function resolveStrategy(ch) {
  return strategies[ch.mode] || strategies[MODES.ROUND];
}

/* ===================== Permission Helpers ===================== */
async function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.ManageChannels);
}
async function isOwnerOrAdmin(i, chState) {
  const mem = await i.guild.members.fetch(i.user.id);
  if (await isAdmin(mem)) return true;
  return !!chState?.ownerId && chState.ownerId === i.user.id;
}

/* ===================== Membership Helpers ===================== */
function ensureMembersSet(st) {
  if (!st.members) st.members = new Set();
}
function capText(st) {
  if (st.memberCap == null) return "unlimited";
  ensureMembersSet(st);
  return `${st.members.size}/${st.memberCap}`;
}
function requireMemberOrOwner(i, st) {
  if (st.memberCap == null) return true; // unlimited
  ensureMembersSet(st);
  if (st.members.has(i.user.id)) return true;
  if (st.ownerId === i.user.id) return true;
  return false;
}

/* ===================== Panel & Lobby Builders ===================== */
function buildRoomPanelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pap_p_setup")
        .setLabel("Setup")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("pap_p_start")
        .setLabel("Start")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("pap_p_submit")
        .setLabel("Cara Submit")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pap_p_view")
        .setLabel("View")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pap_p_close")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pap_p_mode")
        .setLabel("Mode/Status")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("pap_p_join")
        .setLabel("Join")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("pap_p_leave")
        .setLabel("Leave")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("pap_p_help")
        .setLabel("Help")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("pap_room_close")
        .setLabel("Close Room")
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

async function sendRoomPanel(channel, ownerId, st) {
  const embed = new EmbedBuilder()
    .setTitle("PAP Panel")
    .setDescription(
      `Owner: <@${ownerId}>\n` +
        `Kapasitas: **${capText(st)}**\n` +
        `Semua preview dikirim **ephemeral** (hanya kamu yg melihat).`
    )
    .addFields(
      {
        name: "ROUND",
        value: "Yang submit bisa melihat galeri peserta lain (paginated).",
        inline: false,
      },
      {
        name: "SWAP",
        value: "Dipasanngkan acak, hanya lihat PAP pasangan.",
        inline: false,
      },
      {
        name: "CHAIN",
        value: "Lihat PAP orang tepat sebelum kamu.",
        inline: false,
      },
      {
        name: "QUOTA",
        value: "Galeri terbuka setelah mencapai kuota minimal.",
        inline: false,
      }
    );

  const msg = await channel.send({
    embeds: [embed],
    components: buildRoomPanelComponents(),
  });
  try {
    await msg.pin();
  } catch {}
  return msg;
}

function buildLobbyComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pap_cr_new")
        .setLabel("Buat Room")
        .setStyle(ButtonStyle.Success)
    ),
  ];
}
async function sendLobbyPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("Create PAP Room")
    .setDescription(
      `Klik **Buat Room** untuk membuat channel ${DEFAULT_SHARE_PREFIX}1..${MAX_ROOMS}.\n` +
        `Kamu akan menjadi **owner** room tsb dan dapat mengisi **kapasitas** (0 = unlimited).`
    );
  const msg = await channel.send({
    embeds: [embed],
    components: buildLobbyComponents(),
  });
  try {
    await msg.pin();
  } catch {}
  return msg;
}

/* ===================== Ensure Structures ===================== */
async function ensureCategory(guild) {
  await guild.channels.fetch();
  let cat = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildCategory &&
      c.name.toLowerCase() === CATEGORY_NAME
  );
  if (!cat)
    cat = await guild.channels.create({
      name: CATEGORY_NAME,
      type: ChannelType.GuildCategory,
    });
  return cat;
}

async function ensureLobby(guild, category) {
  await guild.channels.fetch();
  const name = LOBBY_NAME.toLowerCase();

  let lobby = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.parentId === category.id &&
      c.name.toLowerCase() === name
  );

  if (!lobby) {
    lobby = await guild.channels.create({
      name: LOBBY_NAME,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: "Buat PAP Room di sini.",
    });
  }

  // --- ambil pinned messages dengan fallback & normalisasi ke array ---
  let pinsColl = null;
  try {
    if (typeof lobby.messages.fetchPins === "function") {
      pinsColl = await lobby.messages.fetchPins();
    } else if (typeof lobby.messages.fetchPinned === "function") {
      pinsColl = await lobby.messages.fetchPinned(); // fallback versi lama
    }
  } catch {
    pinsColl = null;
  }

  const pinnedMsgs = pinsColl
    ? Array.isArray(pinsColl)
      ? pinsColl
      : typeof pinsColl.values === "function"
      ? [...pinsColl.values()]
      : []
    : [];

  const already = pinnedMsgs.some(
    (m) => m?.author?.id === lobby.client.user.id
  );
  if (!already) await sendLobbyPanel(lobby);

  return lobby;
}

function nextRoomIndex(guild, category) {
  const used = new Set(
    guild.channels.cache
      .filter(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.parentId === category.id &&
          c.name.startsWith(DEFAULT_SHARE_PREFIX)
      )
      .map((c) => parseInt(c.name.replace(DEFAULT_SHARE_PREFIX, ""), 10))
      .filter((n) => !Number.isNaN(n))
  );
  for (let i = 1; i <= MAX_ROOMS; i++) if (!used.has(i)) return i;
  return null;
}

async function createPapRoom(i, category, capacity = 0) {
  const idx = nextRoomIndex(i.guild, category);
  if (idx == null) {
    const msg = {
      content: `Kapasitas room penuh (maks ${MAX_ROOMS}). Tutup salah satu dulu.`,
      ephemeral: true,
    };
    return i.followUp ? i.followUp(msg) : i.reply(msg);
  }

  const name = `${DEFAULT_SHARE_PREFIX}${idx}`;
  const room = await i.guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `PAP Room #${idx} — owner: ${i.user.tag}`,
  });

  const st = getChannelState(i.guildId, room.id, true);
  st.ownerId = i.user.id;
  st.memberCap = capacity > 0 ? capacity : null;
  ensureMembersSet(st);
  st.members.add(i.user.id); // owner auto join

  await sendRoomPanel(room, i.user.id, st);
  const msg = {
    content: `✅ Room dibuat: <#${room.id}> (owner: <@${
      i.user.id
    }>, kapasitas: ${capText(st)})`,
    ephemeral: true,
  };
  return i.followUp ? i.followUp(msg) : i.reply(msg);
}

/* ===================== Register guild commands instan ===================== */
async function registerGuildCommands(guildId) {
  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
    {
      body: commands,
    }
  );
  console.log(`[slash] Guild commands registered for ${guildId}`);
}

/* ===================== Register commands globally ===================== */
async function registerGlobalCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    log.info('slash', `✅ Successfully registered ${commands.length} global commands`);
    return true;
  } catch (error) {
    log.error('slash', '❌ Failed to register commands:', error);
    return false;
  }
}

/* ===================== Ready & guild join ===================== */
client.once("ready", async () => {
  log.info('main', `Logged in as ${client.user.tag}`);

  // Auto-deploy commands on startup
  log.info('main', 'Deploying slash commands...');
  await registerGlobalCommands();

  // Setup categories and lobbies
  for (const [, g] of client.guilds.cache) {
    const cat = await ensureCategory(g).catch(() => null);
    if (cat) await ensureLobby(g, cat).catch(() => {});
  }
});

// Saat bot di-invite ke server baru → daftar slash ke guild tsb (instant)
client.on("guildCreate", async (guild) => {
  try {
    await registerGuildCommands(guild.id);
    const ch =
      guild.systemChannel ||
      guild.channels.cache.find((c) => c.type === ChannelType.GuildText);
    if (ch)
      ch.send(
        "Halo! Jalankan **/pap-bootstrap** untuk setup kategori & channel `papbot`."
      );
  } catch (e) {
    console.error("[slash] register for new guild failed:", e?.message || e);
  }
});

/* ===================== Cleanup saat channel dihapus manual ===================== */
client.on("channelDelete", async (ch) => {
  try {
    if (!ch.guild || ch.type !== ChannelType.GuildText) return;
    await Storage.purgeChannel(ch.guild.id, ch.id);
  } catch {}
});

/* ===================== Autocomplete (mode) ===================== */
client.on("interactionCreate", async (i) => {
  if (!i.isAutocomplete()) return;
  try {
    if (
      i.commandName === "pap-setup" &&
      i.options.getFocused(true).name === "mode"
    ) {
      const entries = Object.entries(MODE_INFO).map(([value, info]) => ({
        name: `${info.title.toLowerCase()} • ${info.brief}`.slice(0, 100),
        value,
      }));
      await i.respond(entries.slice(0, 25));
    }
  } catch {}
});

/* ===================== Interactions (slash, tombol, modal) ===================== */
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand() && !i.isButton() && !i.isModalSubmit()) return;

  try {
    /* ----- /pap-help ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-help") {
      const embed = new EmbedBuilder()
        .setTitle("PAP Bot — Panduan Cepat")
        .setDescription(
          "Owner room mengontrol via panel. Jika kapasitas diaktifkan, peserta wajib **Join** dulu sebelum bisa **/pap-submit** & **/pap-view**.\n\n**Commands penting:**\n" +
            "• `/pap-room create capacity:10` — buat room dengan batas 10 (0 = unlimited)\n" +
            "• `/pap-join` / `/pap-leave` — gabung/keluar room\n" +
            "• `/pap-setup` — set mode (owner/admin)\n" +
            "• `/pap-start` — mulai round (owner/admin)\n" +
            "• `/pap-submit` — kirim foto (peserta)\n" +
            "• `/pap-view` — lihat (peserta)\n" +
            "• `/pap-close` — tutup round (owner/admin)\n" +
            "• `/pap-room close` — hapus room (owner/admin)"
        )
        .addFields(
          ...Object.values(MODE_INFO).map((m) => ({
            name: `• ${m.title}`,
            value: `_${m.brief}_\n${m.details}`,
          }))
        );
      await i.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    /* ----- /pap-bootstrap ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-bootstrap") {
      ensureGuildChannel(i);
      const mem = await i.guild.members.fetch(i.user.id);
      if (!(await isAdmin(mem)))
        return i.reply({ content: "Hanya admin.", ephemeral: true });

      const cat = await ensureCategory(i.guild);
      await ensureLobby(i.guild, cat);
      return i.reply({
        content: `✅ Struktur siap di kategori **${cat.name}**. Gunakan **#${LOBBY_NAME}** untuk membuat room.`,
        ephemeral: true,
      });
    }

    /* ----- LOBBY: tombol Buat Room → MODAL ----- */
    if (i.isButton() && i.customId === "pap_cr_new") {
      const cat = await ensureCategory(i.guild);
      if (i.channel.parentId !== cat.id || i.channel.name !== LOBBY_NAME) {
        return i.reply({
          content: `Gunakan tombol ini di **#${LOBBY_NAME}** saja.`,
          ephemeral: true,
        });
      }
      const modal = new ModalBuilder()
        .setCustomId("pap_cr_modal")
        .setTitle("Buat PAP Room");

      const capInput = new TextInputBuilder()
        .setCustomId("capacity")
        .setLabel("Batas member (0 = tidak terbatas)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("contoh: 0 atau 10")
        .setRequired(true)
        .setValue("0");

      modal.addComponents(new ActionRowBuilder().addComponents(capInput));
      return i.showModal(modal);
    }

    // Modal submit → create room
    if (i.isModalSubmit() && i.customId === "pap_cr_modal") {
      const raw = (i.fields.getTextInputValue("capacity") || "0").trim();
      const num = parseInt(raw.replace(/[^\d-]/g, ""), 10);
      let cap = Number.isFinite(num) ? num : 0;
      if (cap < 0) cap = 0;
      if (cap > 5000) cap = 5000;

      await i.deferReply({ ephemeral: true });
      const cat = await ensureCategory(i.guild);
      await createPapRoom(i, cat, cap);
      return;
    }

    /* ----- /pap-room close (hapus channel + purge memori) ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-room") {
      const sub = i.options.getSubcommand();
      if (sub === "close") {
        const st = getChannelState(i.guildId, i.channelId, false);
        if (!st?.ownerId)
          return i.reply({
            content: "Perintah ini hanya untuk room (channel pap-share-*).",
            ephemeral: true,
          });
        if (!(await isOwnerOrAdmin(i, st)))
          return i.reply({
            content: "Hanya owner/admin yang bisa menutup room ini.",
            ephemeral: true,
          });

        await i.reply({ content: "🔒 Room akan dihapus…", ephemeral: true });
        await Storage.purgeChannel(i.guildId, i.channelId).catch(() => {});
        await i.channel.delete("pap-room close");
        return;
      }
    }

    /* ----- Tombol Close Room (panel) ----- */
    if (i.isButton() && i.customId === "pap_room_close") {
      const st = getChannelState(i.guildId, i.channelId, false);
      if (!st?.ownerId)
        return i.reply({ content: "Ini bukan room PAP.", ephemeral: true });
      if (!(await isOwnerOrAdmin(i, st)))
        return i.reply({ content: "Hanya owner/admin.", ephemeral: true });

      await i.reply({ content: "🔒 Room akan dihapus…", ephemeral: true });
      await Storage.purgeChannel(i.guildId, i.channelId).catch(() => {});
      await i.channel.delete("owner closed the room");
      return;
    }

    /* ----- /pap-setup ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-setup") {
      ensureGuildChannel(i);
      const st = getChannelState(i.guildId, i.channelId, true);
      if (!(await isOwnerOrAdmin(i, st)))
        return i.reply({ content: "Hanya owner/admin.", ephemeral: true });

      const VALID = ["ROUND", "SWAP", "CHAIN", "QUOTA"];
      let mode = (i.options.getString("mode") || "").toUpperCase();
      if (!VALID.includes(mode))
        return i.reply({
          content: "Mode tidak valid. Pilih: ROUND / SWAP / CHAIN / QUOTA.",
          ephemeral: true,
        });

      const minDur =
        i.options.getInteger("min_duration") ?? DEFAULTS.durationMin;
      const quota = i.options.getInteger("quota") ?? st.quota ?? DEFAULTS.quota;

      st.mode = mode;
      st.endsAt = null;
      st.quota = quota;
      st.isOpen = false;
      if (!st.ownerId) st.ownerId = i.user.id;

      await i.reply({
        content: `✅ Mode channel diset ke **${mode}**.${
          minDur ? ` Default durasi: ${minDur} menit.` : ""
        }${
          mode === "QUOTA" ? ` Quota: ${quota}.` : ""
        }\nJalankan **/pap-start** untuk memulai round.`,
        ephemeral: true,
      });
      if (minDur) st._defaultDurationMin = minDur;
      return;
    }

    /* ----- /pap-start ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-start") {
      ensureGuildChannel(i);
      const st = getChannelState(i.guildId, i.channelId, true);
      if (!(await isOwnerOrAdmin(i, st)))
        return i.reply({ content: "Hanya owner/admin.", ephemeral: true });

      resetRound(st);
      let endsAt = null;
      const defaultMin = st._defaultDurationMin ?? null;
      if (defaultMin) endsAt = new Date(Date.now() + defaultMin * 60_000);
      if (endsAt) {
        setTimeout(() => {
          if (st.isOpen && st.endsAt && st.endsAt <= new Date()) closeRound(st);
        }, defaultMin * 60_000 + 1000);
      }
      await resolveStrategy(st).onStart(i, st, { endsAt, quota: st.quota });
      return;
    }

    /* ----- /pap-submit ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-submit") {
      ensureGuildChannel(i);
      const st = getChannelState(i.guildId, i.channelId, false);
      if (!st?.isOpen)
        return i.reply({
          content:
            "Belum ada round aktif. Minta owner jalankan **/pap-start**.",
          ephemeral: true,
        });
      if (!requireMemberOrOwner(i, st)) {
        return i.reply({
          content: `Room ini membatasi peserta. Klik **Join** atau gunakan **/pap-join** (${capText(
            st
          )}).`,
          ephemeral: true,
        });
      }
      if (st.endsAt && st.endsAt <= new Date()) {
        closeRound(st);
        return i.reply({ content: "Round sudah ditutup.", ephemeral: true });
      }

      const attach = i.options.getAttachment("photo", true);
      let fileMeta;
      try {
        fileMeta = await downloadAttachment(attach);
      } catch (err) {
        return i.reply({
          content: err.message || "Lampiran tidak valid.",
          ephemeral: true,
        });
      }

      const saved = await Storage.save(
        i.guildId,
        i.channelId,
        i.user.id,
        fileMeta
      );
      const savedMeta = {
        name: saved.name,
        contentType: saved.contentType,
        key: saved.key,
      };

      await resolveStrategy(st).onSubmit(i, st, savedMeta);

      const count = st.submissions?.size ?? 0;
      const extra =
        st.mode === "QUOTA" ? ` (${count}/${st.quota})` : ` (${count} submit)`;
      await i.channel.send({
        content: `✅ <@${i.user.id}> sudah submit PAP${extra}.`,
      });
      return;
    }

    /* ----- /pap-view ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-view") {
      ensureGuildChannel(i);
      const st = getChannelState(i.guildId, i.channelId, false);
      if (!st)
        return i.reply({
          content: "Belum ada konfigurasi di channel ini.",
          ephemeral: true,
        });
      if (!requireMemberOrOwner(i, st)) {
        return i.reply({
          content: `Room ini membatasi peserta. Klik **Join** atau gunakan **/pap-join** (${capText(
            st
          )}).`,
          ephemeral: true,
        });
      }
      const page = i.options.getInteger("page") ?? 1;
      await resolveStrategy(st).onView(i, st, { page });
      return;
    }

    /* ----- /pap-close ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-close") {
      ensureGuildChannel(i);
      const st = getChannelState(i.guildId, i.channelId, false);
      if (!(await isOwnerOrAdmin(i, st)))
        return i.reply({ content: "Hanya owner/admin.", ephemeral: true });
      if (!st?.isOpen)
        return i.reply({ content: "Tidak ada round aktif.", ephemeral: true });
      closeRound(st);
      await i.reply({
        content:
          "✅ Round ditutup. Peserta yang sudah submit tetap bisa /pap-view sesuai mode.",
        ephemeral: true,
      });
      return;
    }

    /* ----- /pap-mode ----- */
    if (i.isChatInputCommand() && i.commandName === "pap-mode") {
      ensureGuildChannel(i);
      const st = getChannelState(i.guildId, i.channelId, false);
      if (!st)
        return i.reply({
          content: "Channel belum disetup. Owner jalankan **/pap-setup**.",
          ephemeral: true,
        });
      const status = st.isOpen ? "OPEN" : "CLOSED";
      await i.reply({
        content: `Mode: **${
          st.mode
        }** | Status: **${status}** | Kapasitas: **${capText(st)}**`,
        ephemeral: true,
      });
      return;
    }

    /* ----- Panel tombol ringkas ----- */
    if (i.isButton() && i.customId.startsWith("pap_p_")) {
      const st = getChannelState(i.guildId, i.channelId, true);
      const ownerOnly = ["pap_p_setup", "pap_p_start", "pap_p_close"];
      if (ownerOnly.includes(i.customId) && !(await isOwnerOrAdmin(i, st))) {
        return i.reply({
          content: "Hanya owner/admin yang bisa mengakses tombol ini.",
          ephemeral: true,
        });
      }

      if (i.customId === "pap_p_help")
        return i.reply({
          content: "Gunakan /pap-help untuk panduan.",
          ephemeral: true,
        });
      if (i.customId === "pap_p_mode")
        return i.reply({
          content: `Mode: **${st.mode}** | Status: **${
            st.isOpen ? "OPEN" : "CLOSED"
          }** | Kapasitas: **${capText(st)}**`,
          ephemeral: true,
        });
      if (i.customId === "pap_p_join") {
        ensureMembersSet(st);
        if (st.members.has(i.user.id))
          return i.reply({
            content: "Kamu sudah menjadi member room ini.",
            ephemeral: true,
          });
        if (st.memberCap != null && st.members.size >= st.memberCap)
          return i.reply({
            content: `Room penuh (${capText(st)}).`,
            ephemeral: true,
          });
        st.members.add(i.user.id);
        await i.reply({
          content: `✅ Kamu bergabung. Kapasitas: ${capText(st)}`,
          ephemeral: true,
        });
        await i.channel.send({
          content: `✅ <@${i.user.id}> bergabung ke room (${capText(st)}).`,
        });
        return;
      }
      if (i.customId === "pap_p_leave") {
        ensureMembersSet(st);
        if (st.ownerId === i.user.id)
          return i.reply({
            content: "Owner tidak bisa leave. Gunakan Close Room.",
            ephemeral: true,
          });
        if (!st.members.delete(i.user.id))
          return i.reply({
            content: "Kamu belum menjadi member.",
            ephemeral: true,
          });
        await i.reply({
          content: `Kamu keluar dari room. (${capText(st)})`,
          ephemeral: true,
        });
        await i.channel.send({
          content: `↩️ <@${i.user.id}> keluar dari room (${capText(st)}).`,
        });
        return;
      }
      if (i.customId === "pap_p_setup")
        return i.reply({
          content: "Jalankan `/pap-setup` lalu pilih mode.",
          ephemeral: true,
        });
      if (i.customId === "pap_p_start") {
        resetRound(st);
        return resolveStrategy(st).onStart(i, st, {
          endsAt: null,
          quota: st.quota,
        });
      }
      if (i.customId === "pap_p_submit")
        return i.reply({
          content: "Kirim fotomu dengan `/pap-submit` dan lampirkan gambar.",
          ephemeral: true,
        });
      if (i.customId === "pap_p_view")
        return resolveStrategy(st).onView(i, st, { page: 1 });
      if (i.customId === "pap_p_close") {
        closeRound(st);
        return i.reply({ content: "✅ Round ditutup.", ephemeral: true });
      }
    }
  } catch (err) {
    console.error(err);
    if (i.deferred || i.replied)
      i.followUp({ content: "Terjadi error. Coba lagi.", ephemeral: true });
    else i.reply({ content: "Terjadi error. Coba lagi.", ephemeral: true });
  }
});

/* ===================== Start ===================== */
async function main() {
  try {
    log.info('main', 'Starting PAP Bot...');

    // Login to Discord
    await client.login(process.env.BOT_TOKEN);
    log.info('main', `Logged in as ${client.user.tag}`);

    // Start web server
    startWeb(client);
    log.info('main', 'Bot started successfully');
  } catch (err) {
    log.stack('main', 'Failed to start bot', err);
    process.exit(1);
  }
}

main();
