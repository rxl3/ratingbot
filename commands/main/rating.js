const { SlashCommandBuilder } = require("discord.js");
const { request } = require("undici");
const fs = require("fs");
const userIds = require("../../user_ids.json");
const ratingCache = require("../../rating_cache.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rating")
    .setDescription("Get ratings for the current lobby"),
  async execute(interaction) {
    await interaction.deferReply();
    const rating = await getRating(interaction);
    await interaction.editReply(convertRatingToString(rating));
  },
};

function convertRatingToString(rating) {
  return rating
    .map((team) => {
      team = team.map((player) => `${player.name}: ${player.rating}`);
      return team.join(", ");
    })
    .join("\n");
}

async function getRating(interaction) {
  await interaction.guild.members.fetch();
  let channels = interaction.guild.channels.cache;
  channels = channels.filter((c) =>
    ["RED", "BLU", "BLUE", "WAITING"].includes(c.name)
  );

  const teamRatings = [];

  for (let channel of channels.values()) {
    const members = channel.members;

    if (members.size > 0) {
      teamRatings.push([
        {
          rating: 0,
          name: "Team " + channel.name,
        },
      ]);
    }

    for (let member of members.values()) {
      const playerRating = await getPlayerRating(member);
      teamRatings[teamRatings.length - 1].unshift({
        rating: playerRating,
        name: member.displayName,
      });

      teamRatings[teamRatings.length - 1][
        teamRatings[teamRatings.length - 1].length - 1
      ].rating += +playerRating;
    }
  }

  return teamRatings;
}

async function getPlayerRating(player) {
  const existingRating = ratingCache.ratings.find(
    (r) => r.discordId === player.user.id
  );

  if (existingRating) {
    return existingRating.rating;
  }

  const user = userIds.idPairs.find((p) => p.discordId === player.user.id);

  if (!user) {
    return 0;
  }

  const data = await request(`https://trends.tf/player/${user.steamId}/`);

  let htmlText = await data.body.text();
  htmlText = htmlText.replace(/\s/g, "");

  const playerStats = htmlText
    .match(/(?<=Sixes<\/td><td>)[0-9\-]+/g)[0]
    .split("-");

  const playerRating =
    (+playerStats[0] + 50 + +playerStats[2] * 0.5) /
    (+playerStats[0] + +playerStats[1] + +playerStats[2] + 100);

  ratingCache.ratings.push({
    discordId: player.user.id,
    rating: playerRating,
    name: player.displayName,
  });

  fs.writeFileSync("rating_cache.json", JSON.stringify(ratingCache));

  return playerRating;
}
