/**
 * @description The daily reward command. Gives a daily reward based on the formula: reward = 60 + 5 * floor(sqrt(streak))
 */

const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward!"),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    axios
      .get(`http://localhost:54321/daily/${interaction.user.id}`)
      .then((response) => {
        let embed;
        if (response.data.msg == "Something went wrong") {
          embed = {
            type: "rich",
            title: `Failed to get daily reward`,
            description: "Try again later",
            color: 0xff0000,
          };
        } else if (response.data.msg == "User not found!") {
          embed = {
            type: "rich",
            title: `Not registered!`,
            description: `Register with \`/me\``,
            color: 0xffff00,
          };
        } else if (response.data.msg == "Not available yet") {
          embed = {
            type: "rich",
            title: `Not ready!`,
            description: `Daily reward has already been claimed today!`,
            color: 0xffff00,
          };
        } else {
          embed = {
            type: "rich",
            title: `Claimed daily reward!`,
            description: response.data.msg,
            color: 0x0000ff,
          };
        }

        interaction.editReply({ embeds: [embed], ephemeral: response.data.msg == "User not found!" });
      });
  },
};
