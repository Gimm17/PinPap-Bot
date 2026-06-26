// src/core/modes/chain.js
import { Strategy } from "../strategy.js";
import { Storage } from "../storage/index.js";

export class ChainStrategy extends Strategy {
  async onStart(i, ch, { endsAt }) {
    ch.isOpen = true;
    ch.endsAt = endsAt || null;
    ch.queue = [];
    await i.reply({
      content: `✅ CHAIN dibuka. Setelah submit, kamu akan melihat PAP orang terakhir sebelum kamu.`,
      ephemeral: true,
    });
  }

  async onSubmit(i, ch, fileMeta) {
    if (!ch.isOpen)
      return i.reply({ content: "Round sudah ditutup.", ephemeral: true });

    const existed = ch.submissions.has(i.user.id);
    ch.submissions.set(i.user.id, { file: fileMeta, at: new Date() });
    if (!existed) ch.queue.push(i.user.id);

    const idx = ch.queue.indexOf(i.user.id);
    if (idx <= 0) {
      return i.reply({
        content:
          "✅ PAP diterima. Kamu adalah pengirim pertama, belum ada PAP sebelumnya.",
        ephemeral: true,
      });
    }
    const prevId = ch.queue[idx - 1];
    const prev = ch.submissions.get(prevId);
    if (!prev?.file) {
      return i.reply({
        content: "✅ PAP diterima. Belum ada PAP sebelumnya yang valid.",
        ephemeral: true,
      });
    }

    await i.reply({
      content: `🔒 Ephemeral: Ini PAP orang sebelum kamu: <@${prevId}>.`,
      files: [
        {
          attachment: await Storage.load(prev.file.key || ""),
          name: prev.file.name,
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

    const idx = ch.queue.indexOf(i.user.id);
    if (idx <= 0)
      return i.reply({
        content: "Kamu adalah pengirim pertama / belum ada yang sebelum kamu.",
        ephemeral: true,
      });

    const prevId = ch.queue[idx - 1];
    const prev = ch.submissions.get(prevId);
    if (!prev?.file)
      return i.reply({
        content: "Belum ada PAP sebelumnya yang valid.",
        ephemeral: true,
      });

    await i.reply({
      content: `🔒 Ephemeral: PAP orang sebelum kamu: <@${prevId}>`,
      files: [
        {
          attachment: await Storage.load(prev.file.key || ""),
          name: prev.file.name,
        },
      ],
      ephemeral: true,
    });
  }
}
