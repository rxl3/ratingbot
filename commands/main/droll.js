const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("droll")
    .setDescription("Roll captains")
    .addIntegerOption((option) =>
      option
        .setName("players")
        .setDescription("Number of players")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("rolls").setDescription("Number of rolls")
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const numPlayers = interaction.options.getInteger("players");
    const numRolls = interaction.options.getInteger("rolls")
      ? interaction.options.getInteger("rolls")
      : 1;

    const rolls = [];

    if (numRolls > numPlayers) {
      await interaction.editReply("No");
      return;
    }

    while (rolls.length < numRolls) {
      let maybeRoll = Math.ceil(Math.random() * numPlayers);
      if (!rolls.includes(maybeRoll)) {
        rolls.push(maybeRoll);
      }
    }

    await interaction.editReply(`${rolls.join(", ")}`);
  },
};
