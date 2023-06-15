const { SlashCommandBuilder } = require("discord.js");
const { currentVoteMaps } = require("./votemap");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checknominations")
    .setDescription("Check current nominations"),
  async execute(interaction) {
    await interaction.reply(`${currentVoteMaps.join(", ")}`, {
      ephemeral: true,
    });
  },
};
