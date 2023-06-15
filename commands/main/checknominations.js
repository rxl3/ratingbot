const { SlashCommandBuilder } = require("discord.js");
const { currentVoteMaps } = require("./votemap");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checknominations")
    .setDescription("Check current nominations"),
  async execute(interaction) {
    if (currentVoteMaps.length > 0) {
      await interaction.reply(
        `${currentVoteMaps.map((c) => c.name).join(", ")}`,
        {
          ephemeral: true,
        }
      );
    } else {
      await interaction.reply(`No maps nominated.`, {
        ephemeral: true,
      });
    }
  },
};
