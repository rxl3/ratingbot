const { SlashCommandBuilder } = require("discord.js");
const { getPlayerRating } = require("./rating");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rateme")
    .setDescription("Get my current rating")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.reply("Fetching rating...");
    await interaction.guild.members.fetch();

    const rating = await getPlayerRating(interaction.member, true);

    console.log("Done!");
    console.log("Result: " + rating);

    await interaction.followUp({
      content: `${interaction.member.displayName}: ${rating}`,
      ephemeral: true,
    });
  },
};
