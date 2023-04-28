const { SlashCommandBuilder, EmbedBuilder, Embed } = require("discord.js");
const fs = require("node:fs");
const mapPool = require("../../map_pool.json");

const { mapVotingChannelId } = require("../../config.json");

// const lastTwoMaps = require("../../last_two_maps.json");
let lastTwoMaps = ["cp_process"];
let currentVoteMaps = [];
const currentVotes = {
  "1️⃣": 0,
  "2️⃣": 0,
  "3️⃣": 0,
};
let currentVoteMessage = null;

let interval = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("votemap")
    .setDescription("Call a map vote"),
  async execute(interaction) {
    if (interval !== null) {
      await interaction.reply({
        content:
          "Another vote is already happening, please wait for that one to finish...",
        ephemeral: true,
      });
      await interaction.deleteReply();
      return;
    }
    await interaction.reply({ content: "Starting vote...", ephemeral: true });
    await interaction.deleteReply();

    const defaultMaps = mapPool.filter(
      (m) =>
        ["cp_snakewater", "cp_sunshine", "cp_gullywash"].includes(m.name) &&
        !currentVoteMaps.some((c) => c.name === m.name)
    );
    console.log(lastTwoMaps);
    if (lastTwoMaps.length < 2) {
      while (currentVoteMaps.length < 3) {
        currentVoteMaps.push(defaultMaps.shift());
      }
    } else {
      const seedMaps = [
        ...mapPool.filter(
          (m) => !lastTwoMaps.includes(m.name) && m.randomizable
        ),
      ];
      while (currentVoteMaps.length < 3) {
        const randIndex = Math.floor(Math.random() * seedMaps.length);
        currentVoteMaps.push(...seedMaps.splice(randIndex, 1));
      }
    }

    // Handle the case that more than 3 maps have been nominated
    // Pick 3 of them at random
    while (currentVoteMaps.length > 3) {
      currentVoteMaps.splice(
        Math.floor(Math.random() * currentVoteMaps.length),
        1
      );
    }
    console.log(currentVoteMaps);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Vote for next map`)
      .setDescription(
        `
        1: ${currentVoteMaps[0].name}\n
        2: ${currentVoteMaps[1].name}\n
        3: ${currentVoteMaps[2].name}\n
        `
      );

    const channel = interaction.guild.channels.cache.get(mapVotingChannelId);

    currentVoteMessage = await channel.send({
      embeds: [embed],
    });

    await currentVoteMessage.react("1️⃣");
    await currentVoteMessage.react("2️⃣");
    await currentVoteMessage.react("3️⃣");

    const voteFilter = (reaction, user) =>
      ["1️⃣", "2️⃣", "3️⃣"].includes(reaction.emoji.name);

    const collector = currentVoteMessage.createReactionCollector({
      filter: voteFilter,
    });

    let countdown = 58;

    interval = setInterval(async () => {
      embed.setDescription(`
        1: ${currentVoteMaps[0].name}\n
        2: ${currentVoteMaps[1].name}\n
        3: ${currentVoteMaps[2].name}\n
        ${countdown} seconds remaining.
        `);

      countdown -= 2;
      await currentVoteMessage.edit({
        embeds: [embed],
      });

      if (countdown === 0) {
        collector.stop();
      }
    }, 2000);

    collector.on("end", async (collected) => {
      clearInterval(interval);
      interval = null;
      await currentVoteMessage.delete();

      collected.forEach((value, ky) => {
        currentVotes[ky] = value.count - 1;
      });
      console.log(currentVotes);

      let winningMap;
      let totalVotes = 0;
      let maxVotes = 0;
      Object.keys(currentVotes).forEach((voteKy) => {
        totalVotes += currentVotes[voteKy];
      });
      Object.keys(currentVotes).forEach((voteKy) => {
        if (currentVotes[voteKy] > maxVotes) {
          maxVotes = currentVotes[voteKy];
          winningMap = getWinningMapFromEmoji(voteKy);
        }
      });
      if (!winningMap) {
        return;
      }
      await channel.send(`${winningMap.name} won with ${maxVotes} votes.`);

      const connectEmbed = new EmbedBuilder().setDescription(
        `${winningMap.string}`
      );
      await channel.send({
        embeds: [connectEmbed],
      });

      lastTwoMaps.push(winningMap.name);
      while (lastTwoMaps.length > 2) {
        lastTwoMaps.shift();
      }

      Object.keys(currentVotes).forEach((k) => {
        currentVotes[k] = 0;
      });

      currentVoteMaps = [];

      //   await fs.writeFileSync("last_two_maps.json", JSON.stringify(lastTwoMaps));
    });
  },
  lastTwoMaps,
  currentVoteMaps,
};

function getWinningMapFromEmoji(emoji) {
  switch (emoji) {
    case "1️⃣":
      return currentVoteMaps[0];
    case "2️⃣":
      return currentVoteMaps[1];
    case "3️⃣":
      return currentVoteMaps[2];
  }
}
