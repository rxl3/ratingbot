const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const userIds = require("../../user_ids.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Set a user's steam ID")
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user's name in server")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("steamid")
        .setDescription("The user's steam profile ID or logs.tf URL")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getString("user");
    let steamId = interaction.options.getString("steamid") + "";

    if (!user) {
      await interaction.editReply("No user provided.");
      return;
    }
    if (!steamId) {
      await interaction.editReply("No Steam ID/logs.tf URL provided.");
      return;
    }

    steamId =
      steamId.indexOf("logs.tf") > -1
        ? steamId.match(/(?<=profile\/)[0-9]+/g).length[0]
        : steamId;

    console.log(`Got request to link ${user} to ${steamId}`);

    const members = await interaction.guild.members.fetch();
    const member = members.find((m) => m.displayName === user);

    if (!member) {
      await interaction.editReply(
        "No member with that name found on server. Check your spelling and try again."
      );
      return;
    }

    setSteamID(member, steamId);

    console.log("Writing user ids: " + JSON.stringify(userIds));

    fs.writeFileSync("user_ids.json", JSON.stringify(userIds));
    await interaction.editReply(`All done!`);
  },
};

function setSteamID(member, steamId) {
  const existingUser = userIds.idPairs.find((p) =>
    p.discordId.length === 1
      ? p.discordId[0] === member.id
      : p.discordId === member.id
  )
    ? userIds.idPairs.find((p) =>
        p.discordId.length === 1
          ? p.discordId[0] === member.id
          : p.discordId === member.id
      )[0]
    : null;
  if (existingUser) {
    console.log("Found existing user " + member.displayName);
    existingUser.steamId = steamId;
    existingUser.name = member.displayName;
  } else {
    console.log("Adding new user " + member.displayName);
    const newUser = {
      steamId: steamId,
      discordId: member.id,
      name: member.displayName,
    };
    userIds.idPairs.push(newUser);
  }
}
