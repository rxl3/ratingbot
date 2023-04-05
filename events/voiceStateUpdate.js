const { Events } = require("discord.js");
const { getRating, convertRatingToString } = require("../commands/main/rating");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    if (oldState.channelId === newState.channelId) {
      return;
    }
    await newState.guild.members.fetch();
    let channels = newState.guild.channels.cache;
    teamChannels = channels.filter((c) =>
      ["RED", "BLU", "BLUE", "RED-2", "BLUE-2"].includes(c.name)
    );

    console.log("Just joined channel: " + newState.channelId);

    const newChannel = channels.get(newState.channelId);

    if (!newChannel) {
      return;
    }

    if (
      (["RED", "BLUE"].includes(newChannel.name) &&
        teamChannels
          .filter((c) => ["RED", "BLUE"].includes(c.name))
          .every((c) => c.members.size === 6)) ||
      (["RED-2", "BLUE-2"].includes(newChannel.name) &&
        teamChannels
          .filter((c) => ["RED-2", "BLUE-2"].includes(c.name))
          .every((c) => c.members.size === 6))
    ) {
      if (offCooldown()) {
        console.log("Detected full teams, getting ratings...");
        const rating = await getRating(newState, false);

        const botMessageChannel = channels.find((c) => c.name === "bot-test");
        botMessageChannel.send(convertRatingToString(rating));

        if (
          rating.length > 1 &&
          Math.abs(
            +rating[0][rating[0].length - 1].rating -
              +rating[1][rating[1].length - 1].rating
          ) > 25
        ) {
          botMessageChannel.send(suggestPlayerSwap(rating));
        }
      }
    }
  },
  suggestPlayerSwap,
};

const COOLDOWN_TIME = 30000;
let lastExecuted = Date.now();

function offCooldown() {
  if (lastExecuted + COOLDOWN_TIME < Date.now()) {
    return true;
  }
  return false;
}

// for each team
// pick a player from the higher team closest to the average plus half the difference between teams
// suggest swap with player from other team with score closest to the average of their team subtract half the difference
function suggestPlayerSwap(rating) {
  const teamA = [...rating[0]];
  const teamB = [...rating[1]];
  const teamAScore = +teamA[teamA.length - 1];
  const teamBScore = +teamB[teamB.length - 1];

  let highTeam, highTeamScore;
  let lowTeam, lowTeamScore;

  if (teamAScore > teamBScore) {
    highTeam = teamA;
    lowTeam = teamB;
  } else {
    highTeam = teamB;
    lowTeam = teamA;
  }
  highTeamScore = +highTeam[highTeam.length - 1];
  lowTeamScore = +lowTeam[lowTeam.length - 1];

  let highTeamTarget = highTeamScore / 6 + (highTeamScore - lowTeamScore) / 2;
  let lowTeamTarget = lowTeamScore / 6 - (highTeamScore - lowTeamScore) / 2;

  let highTeamPlayer = highTeam[0];
  let lowTeamPlayer = lowTeam[0];

  highTeam.forEach((player) => {
    if (
      player.rating > highTeamTarget &&
      Math.abs(player.rating - highTeamTarget) <
        Math.abs(highTeamPlayer - highTeamTarget)
    ) {
      highTeamPlayer = player;
    }
  });
  lowTeam.forEach((player) => {
    if (
      player.rating < lowTeamTarget &&
      Math.abs(player.rating - lowTeamTarge) <
        Math.abs(lowTeamPlayer - lowTeamTarget)
    ) {
      lowTeamPlayer = player;
    }
  });

  return `Teams look a bit imbalanced!\nMaybe swap ${highTeamPlayer.name} and ${lowTeamPlayer.name}?`;
}
