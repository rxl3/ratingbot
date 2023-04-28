const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs");
// const lastTwoMaps = require("../../last_two_maps.json");
const { lastTwoMaps } = require("./votemap");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Reset last played maps"),
  async execute(interaction) {
    await interaction.deferReply();
    lastTwoMaps = ["cp_process"];

    // await fs.writeFileSync("last_two_maps.json", JSON.stringify(lastTwoMaps));

    await interaction.editReply(`Done.\n`);
  },
};
