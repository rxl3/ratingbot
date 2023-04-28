const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mapPool = require("../../map_pool.json");
const { currentVoteMaps } = require("./votemap");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nominate")
    .setDescription("Nominate a map")
    .addStringOption((option) =>
      option
        .setName("map")
        .setDescription("Map to nominate")
        .setRequired(true)
        .addChoices(
          ...mapPool.map((m) => ({
            name: m.name,
            value: m.name,
          }))
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const mapName = interaction.options.getString("map");
    if (!currentVoteMaps.some((m) => m.name === mapName)) {
      //   while (currentVoteMaps.length >= 3) {
      //     currentVoteMaps.shift();
      //   }
      currentVoteMaps.push(mapPool.find((m) => m.name === mapName));
    }
    await interaction.editReply(`Added ${mapName}.\n`);
  },
};
