const { Events } = require("discord.js");
const { diceRollChannelId } = require("../config.json")

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    console.log(!message.content.startsWith("/droll"), message.channelId);
    if (!message.content.startsWith("/droll") || message.channelId !== diceRollChannelId) return;

    const messageParts = message.content.split(' ');

    console.log(messageParts);

    if (messageParts.length < 2) return;

    const numPlayers = +messageParts[1];
    let numRolls = messageParts.length > 2
      ? +messageParts[2]
      : 1;

    const rolls = [];

    if (numRolls > numPlayers) {
      numRolls = numPlayers;
    }

    const seedRolls = [...Array(numPlayers + 1).keys()].slice(1);

    while (rolls.length < numRolls) {
      let rollIndex = Math.floor(Math.random() * seedRolls.length);
      rolls.push(...seedRolls.splice(rollIndex, 1));
    }

    await message.reply(`${rolls.join(", ")}`);
  },
};
