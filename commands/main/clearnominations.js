const { SlashCommandBuilder } = require("discord.js");
const { currentVoteMaps } = require("./votemap");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearnominations")
    .setDescription("Clear current nominations"),
  async execute(interaction) {
    await interaction.deferReply();

    const defaultMaps = [
      ...mapPool.filter(
        (m) =>
          ["cp_snakewater", "cp_sunshine", "cp_gullywash"].includes(m.name) &&
          !currentVoteMaps.some((c) => c.name === m.name)
      ),
    ];
    currentVoteMaps = [...defaultMaps];

    console.log(currentVoteMaps);

    await interaction.editReply(`Done.`);
  },
};
