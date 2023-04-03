const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { suggestPlayerSwap } = require("../../events/voiceStateUpdate");
const { getRating } = require("./rating");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggestswap")
    .setDescription("Suggest a swap")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply();

    const rating = await getRating(interaction);

    console.log("Done!");
    console.log(`${suggestPlayerSwap(rating)}`);

    await interaction.editReply(`${suggestPlayerSwap(rating)}`);
  },
};
