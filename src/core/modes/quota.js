// src/core/modes/quota.js
import { Strategy } from "../strategy.js";
import { Storage } from "../storage/index.js";

export class QuotaStrategy extends Strategy {
  async onStart(i, ch, { endsAt, quota }) {
    ch.isOpen = true;
    ch.endsAt = endsAt || null;
    ch.quota = quota || ch.quota || 5;
    await i.reply({
      content: `✅ QUOTA dibuka. Foto bisa dilihat setelah minimal **${ch.quota}** orang submit.`,
      ephemeral: true,
    });
  }

  async onSubmit(i, ch, fileMeta) {
    if (!ch.isOpen)
      return i.reply({ content: "Round sudah ditutup.", ephemeral: true });

    ch.submissions.set(i.user.id, { file: fileMeta, at: new Date() });

    const count = ch.submissions.size;
    if (count < ch.quota) {
      return i.reply({
        content: `✅ PAP diterima. Menunggu ${
          ch.quota - count
        } submit lagi sebelum bisa melihat foto.`,
        ephemeral: true,
      });
    }
    await i.reply({
      content:
        "✅ PAP diterima. Kuota tercapai/terlampaui! Pakai **/pap-view** untuk melihat.",
      ephemeral: true,
    });
  }

  async onView(i, ch, { page = 1 } = {}) {
    const you = ch.submissions.get(i.user.id);
    if (!you)
      return i.reply({
        content: "Kamu belum submit. Kirim dulu via **/pap-submit**.",
        ephemeral: true,
      });

    const count = ch.submissions.size;
    if (count < ch.quota)
      return i.reply({
        content: `Belum bisa melihat: baru ${count}/${ch.quota} submit.`,
        ephemeral: true,
      });

    const others = [];
    for (const [uid, data] of ch.submissions.entries()) {
      if (uid !== i.user.id && data?.file) others.push([uid, data.file]);
    }
    if (!others.length)
      return i.reply({ content: "Belum ada peserta lain.", ephemeral: true });

    const perPage = 4;
    const start = (page - 1) * perPage;
    const items = others.slice(start, start + perPage);

    const files = await Promise.all(
      items.map(async ([uid, f]) => ({
        attachment: await Storage.load(f.key || ""),
        name: f.name,
      }))
    );

    const mentions = items.map(([uid]) => `<@${uid}>`).join(", ");
    await i.reply({
      content: `🔒 Ephemeral: Galeri setelah kuota tercapai (halaman ${page}).\nDari: ${mentions}`,
      files,
      ephemeral: true,
    });
  }
}
