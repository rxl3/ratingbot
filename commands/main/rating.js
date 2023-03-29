const { SlashCommandBuilder } = require("discord.js");
const { request } = require("undici");
const fs = require("fs");
const userIds = require("../../user_ids.json");
const ratingCache = require("../../rating_cache.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rating")
    .setDescription("Get ratings for the current lobby")
    .addBooleanOption((option) =>
      option
        .setName("nocache")
        .setDescription("Fetch new rating data for each user")
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const noCache = interaction.options.getBoolean("nocache");
    const rating = await getRating(interaction, noCache);

    console.log("Done!");
    console.log("Result: " + convertRatingToString(rating));

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

async function getRating(interaction, noCache) {
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
      const playerRating = await getPlayerRating(member, noCache);
      teamRatings[teamRatings.length - 1].unshift({
        rating: playerRating,
        name: member.displayName,
      });

      teamRatings[teamRatings.length - 1][
        teamRatings[teamRatings.length - 1].length - 1
      ].rating += +playerRating;
    }

    teamRatings[teamRatings.length - 1][
      teamRatings[teamRatings.length - 1].length - 1
    ].rating = (+teamRatings[teamRatings.length - 1][
      teamRatings[teamRatings.length - 1].length - 1
    ].rating).toFixed(4);
  }

  return teamRatings;
}

async function getPlayerRating(player, noCache) {
  console.log(`Looking for user: ${player.displayName}`);
  const userIndex = userIds.idPairs.findIndex(
    (p) => p.discordId === player.user.id
  );
  const user = userIndex > -1 ? userIds.idPairs[userIndex] : null;

  if (!user) {
    return 0;
  }

  console.log(`Found user ${player.displayName}!`);

  const existingRatingIndex = ratingCache.ratings.findIndex(
    (r) => r.discordId === player.user.id
  );

  if (!noCache) {
    const existingRating =
      existingRatingIndex > -1
        ? ratingCache.ratings[existingRatingIndex]
        : null;

    if (existingRating) {
      console.log(
        `Found existing rating for ${user.name}: ${existingRating.rating}`
      );
      return existingRating.rating;
    }
  } else {
    console.log("Not using cache, fetching new data...");
  }

  console.log(`Requesting rating for ${user.name}...`);

  const data = await request(`https://trends.tf/player/${user.steamId}/`);

  let htmlText = await data.body.text();
  htmlText = htmlText.replace(/\s/g, "");

  const playerStats = htmlText
    .match(/(?<=Sixes<\/td><td>)[0-9\-]+/g)[0]
    .split("-");

  const playerRating = (
    (+playerStats[0] + 50 + +playerStats[2] * 0.5) /
    (+playerStats[0] + +playerStats[1] + +playerStats[2] + 100)
  ).toFixed(4);

  console.log(`Got rating for ${user.name}: ${playerRating}`);

  ratingCache.ratings.push({
    discordId: player.user.id,
    rating: playerRating,
    name: player.displayName,
  });

  fs.writeFileSync("rating_cache.json", JSON.stringify(ratingCache));

  return playerRating;
}
