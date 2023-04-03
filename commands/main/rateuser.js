const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getPlayerRating } = require("./rating");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rateuser")
    .setDescription("Get rating for the specified user")
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user's name in server")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getString("user");

    if (!user) {
      await interaction.editReply("No user provided.");
      return;
    }

    const members = await interaction.guild.members.fetch();
    const member = members.find((m) => m.displayName === user);

    if (!member) {
      await interaction.editReply(
        "No member with that name found on server. Check your spelling and try again."
      );
      return;
    }

    const rating = await getPlayerRating(member, true);

    console.log("Done!");
    console.log(`${member.displayName}: ${rating}`);

    await interaction.editReply(`Rating found.`);
    await interaction.followUp(`${member.displayName}: ${rating}`, {
      ephemeral: true,
    });
  },
};
