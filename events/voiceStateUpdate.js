const { Events } = require("discord.js");
const { getRating, convertRatingToString } = require("../commands/main/rating");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    if (oldState.channelId === newState.channelId) {
      return;
    }
    await newState.guild.channels.fetch();
    await newState.guild.members.fetch();
    let channels = newState.guild.channels.cache;
    teamChannels = channels.filter((c) =>
      ["RED", "BLU", "BLUE", "RED-2", "BLUE-2"].includes(c.name)
    );

    const newChannel = channels.find((c) => c.id === newState.channelId);

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
      }
    }
  },
};

const COOLDOWN_TIME = 30000;
let lastExecuted = Date.now();

function offCooldown() {
  if (lastExecuted + COOLDOWN_TIME < Date.now()) {
    return true;
  }
  return false;
}
