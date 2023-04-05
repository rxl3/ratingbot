const { SlashCommandBuilder } = require("discord.js");
const { request } = require("undici");
const fs = require("node:fs");
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
  getRating,
  convertRatingToString,
  getPlayerRating,
};

function convertRatingToString(rating) {
  return rating && rating.length > 0
    ? rating
        .map((team) => {
          team = team.map((player) => `${player.name}: ${player.rating}`);
          return team.join(", ");
        })
        .join("\n")
    : "No rated users in team channels!";
}

async function getRating(interaction, noCache) {
  await interaction.guild.members.fetch();
  let channels = interaction.guild.channels.cache;
  channels = channels.filter((c) =>
    ["RED", "BLU", "BLUE", "RED-2", "BLUE-2"].includes(c.name)
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

    if (members.size > 0) {
      teamRatings[teamRatings.length - 1][
        teamRatings[teamRatings.length - 1].length - 1
      ].rating = (+teamRatings[teamRatings.length - 1][
        teamRatings[teamRatings.length - 1].length - 1
      ].rating).toFixed(4);
    }
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
    console.log("No user found!");
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

  const data = await request(
    `https://trends.tf/player/${user.steamId}/totals?format=sixes`
  );

  let htmlText = await data.body.text();
  htmlText = htmlText.replace(/\s/g, "");

  if (htmlText.includes("502BadGateway")) {
    return null;
  }

  const playerWinLossStats = htmlText.match(
    /(?<=Wins\-Losses\-Ties<\/td><td>)[0-9\-]+/g
  )
    ? htmlText.match(/(?<=Wins\-Losses\-Ties<\/td><td>)[0-9\-]+/g)[0].split("-")
    : 0.0;

  const playerWinLossRatio = (
    (+playerWinLossStats[0] + 50 + +playerWinLossStats[2] * 0.5) /
    (+playerWinLossStats[0] +
      +playerWinLossStats[1] +
      +playerWinLossStats[2] +
      100)
  ).toFixed(4);

  const playerKillsStats = htmlText.match(
    /(?<=Killsper30minutes<\/td><td>)[0-9\.]+/g
  )[0];
  const playerDeathsStats = htmlText.match(
    /(?<=Deathsper30minutes<\/td><td>)[0-9\.]+/g
  )[0];
  const playerAssistsStats = htmlText.match(
    /(?<=Assistsper30minutes<\/td><td>)[0-9\.]+/g
  )[0];

  const playerKADRatio = (
    (+playerKillsStats + +playerAssistsStats) /
    +playerDeathsStats
  ).toFixed(4);

  const playerDPMStats = htmlText.match(
    /(?<=Damageperminute<\/td><td>)[0-9\.]+/g
  )[0];
  const playerHRPMsStats = htmlText.match(
    /(?<=Healsreceivedperminute<\/td><td>)[0-9\.]+/g
  )[0];

  const playerDPHRatio = +playerDPMStats / +playerHRPMsStats;

  const medicData = await request(
    `https://trends.tf/player/${user.steamId}/totals?format=sixes&class=medic`
  );

  let medicHtmlText = await medicData.body.text();
  medicHtmlText = medicHtmlText.replace(/\s/g, "");

  const playerHPM = medicHtmlText.match(
    /(?<=Healingperminute<\/td><td>)[0-9\.]+/g
  )[0];

  let playerRating = (
    (
      +playerWinLossRatio * 0.4 +
      (+playerKADRatio / 3) * 0.4 +
      (+playerDPHRatio / 2) * 0.1 +
      (+playerHPM / 1200) * 0.1
    ).toFixed(4) * 100
  ).toFixed(2);

  console.log(`Got rating for ${user.name}: ${playerRating}`);

  ratingCache.ratings.push({
    discordId: player.user.id,
    rating: playerRating,
    name: player.displayName,
  });

  fs.writeFileSync("rating_cache.json", JSON.stringify(ratingCache));

  delete require.cache[require.resolve("../../rating_cache.json")];

  return playerRating;
}
