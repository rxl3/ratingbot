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

    if (
      teamChannels
        .filter((c) => ["RED", "BLUE"].includes(c.name))
        .every((c) => c.members.size === 6) ||
      teamChannels
        .filter((c) => ["RED-2", "BLUE-2"].includes(c.name))
        .every((c) => c.members.size === 6)
    ) {
      console.log("Detected full teams, getting ratings...");
      const rating = await getRating(newState, false);

      const botMessageChannel = channels.find((c) => c.name === "bot-test");
      botMessageChannel.send(convertRatingToString(rating));
    }
  },
};
