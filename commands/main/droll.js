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
      numRolls = numPlayers;
    }

    const seedRolls = [...Array(numPlayers + 1).keys()].slice(1);

    while (rolls.length < numRolls) {
      let rollIndex = Math.floor(Math.random() * seedRolls.length);
      rolls.push(...seedRolls.splice(rollIndex, 1));
    }

    await interaction.editReply(`${rolls.join(", ")}`);
  },
};
