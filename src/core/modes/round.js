// src/core/modes/round.js
import { Strategy } from "../strategy.js";
import { Storage } from "../storage/index.js";

export class RoundStrategy extends Strategy {
  async onStart(i, ch, { endsAt }) {
    ch.isOpen = true;
    ch.endsAt = endsAt || null;
    await i.reply({
      content: `✅ ROUND dibuka.${
        endsAt ? ` Otomatis tutup: ${endsAt.toLocaleString()}` : ""
      }\nKirim **/pap-submit** lalu lihat dengan **/pap-view**.`,
      ephemeral: true,
    });
  }

  async onSubmit(i, ch, fileMeta) {
    if (!ch.isOpen)
      return i.reply({ content: "Round sudah ditutup.", ephemeral: true });
    ch.submissions.set(i.user.id, { file: fileMeta, at: new Date() });
    await i.reply({
      content:
        "✅ PAP kamu tersimpan! Pakai **/pap-view** untuk melihat PAP orang lain.",
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

    const others = [];
    for (const [uid, data] of ch.submissions.entries()) {
      if (uid !== i.user.id && data?.file) others.push([uid, data.file]);
    }
    if (!others.length)
      return i.reply({
        content: "Belum ada peserta lain yang submit.",
        ephemeral: true,
      });

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
    let caption = `🔒 Ephemeral: Menampilkan ${items.length} foto (halaman ${page}).\nDari: ${mentions}`;
    if (others.length > start + perPage)
      caption += ` (+${others.length - (start + perPage)} lagi)`;

    await i.reply({ content: caption, files, ephemeral: true });
  }
}
