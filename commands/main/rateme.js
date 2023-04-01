const { SlashCommandBuilder } = require("discord.js");
const { getPlayerRating } = require("./rating");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rateme")
    .setDescription("Get my current rating"),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.guild.members.fetch();

    const rating = await getPlayerRating(interaction.member);

    console.log("Done!");
    console.log("Result: " + rating);

    await interaction.editReply(`${interaction.member.displayName}: ${rating}`);
  },
};
