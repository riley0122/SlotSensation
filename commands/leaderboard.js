const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const { token } = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Get the users with the most tokens!"),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    axios
      .get(`https://canary.discord.com/api/v10/users/${interaction.user.id}`, {
        headers: { Authorization: `Bot ${token}` },
      })
      .then((result) => {
        console.log(result.data);
      });
  },
};
