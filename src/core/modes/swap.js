// src/core/modes/swap.js
import { Strategy } from "../strategy.js";
import { Storage } from "../storage/index.js";

export class SwapStrategy extends Strategy {
  async onStart(i, ch, { endsAt }) {
    ch.isOpen = true;
    ch.endsAt = endsAt || null;
    ch.pairs = new Map();
    await i.reply({
      content: `✅ SWAP dibuka. Sistem akan memasangkan peserta secara acak.\nKirim **/pap-submit**, setelah pasanganmu juga submit, gunakan **/pap-view**.`,
      ephemeral: true,
    });
  }

  async onSubmit(i, ch, fileMeta) {
    if (!ch.isOpen)
      return i.reply({ content: "Round sudah ditutup.", ephemeral: true });

    ch.submissions.set(i.user.id, { file: fileMeta, at: new Date() });

    if (!ch.pairs.has(i.user.id)) {
      const candidates = [...ch.submissions.keys()].filter(
        (uid) => uid !== i.user.id && !ch.pairs.has(uid)
      );
      if (candidates.length) {
        const partnerId =
          candidates[Math.floor(Math.random() * candidates.length)];
        ch.pairs.set(i.user.id, partnerId);
        ch.pairs.set(partnerId, i.user.id);
      }
    }

    const partnerId = ch.pairs.get(i.user.id);
    if (!partnerId)
      return i.reply({
        content: "✅ PAP diterima. Menunggu pasangan ditentukan/submit.",
        ephemeral: true,
      });

    const partner = ch.submissions.get(partnerId);
    if (!partner?.file)
      return i.reply({
        content: "✅ PAP diterima. Menunggu pasangan kamu ikut submit.",
        ephemeral: true,
      });

    await i.reply({
      content: `🔒 PAP pasanganmu: <@${partnerId}>`,
      files: [
        {
          attachment: await Storage.load(partner.file.key || ""),
          name: partner.file.name,
        },
      ],
      ephemeral: true,
    });
  }

  async onView(i, ch) {
    const you = ch.submissions.get(i.user.id);
    if (!you)
      return i.reply({
        content: "Kamu belum submit. Kirim dulu via **/pap-submit**.",
        ephemeral: true,
      });

    const partnerId = ch.pairs.get(i.user.id);
    if (!partnerId)
      return i.reply({
        content: "Pasangan belum ditentukan/submit.",
        ephemeral: true,
      });

    const partner = ch.submissions.get(partnerId);
    if (!partner?.file)
      return i.reply({ content: "Pasanganmu belum submit.", ephemeral: true });

    await i.reply({
      content: `🔒 Ephemeral: PAP pasanganmu: <@${partnerId}>`,
      files: [
        {
          attachment: await Storage.load(partner.file.key || ""),
          name: partner.file.name,
        },
      ],
      ephemeral: true,
    });
  }
}
