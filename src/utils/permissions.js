import { PermissionFlagsBits } from 'discord.js';

export async function ensureAdmin(i) {
  const member = await i.guild.members.fetch(i.user.id);
  if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await i.reply({ content: 'Perintah ini hanya untuk admin (Manage Channels).', ephemeral: true });
    return false;
  }
  return true;
}

export function ensureGuildChannel(i) {
  if (!i.inGuild()) throw new Error('Gunakan perintah ini di server channel.');
}
