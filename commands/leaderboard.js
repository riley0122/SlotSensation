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
    let top = [];
    axios.get("http://localhost:54321/users/top").then((resp) => {
      for (let i = 0; i < resp.data.length; i++) {
        const element = resp.data[i];
        console.log(element.id);
        axios
          .get(`https://canary.discord.com/api/v10/users/${element.id}`, {
            headers: { Authorization: `Bot ${token}` },
          })
          .then((result) => {
            top.push(result.data.global_name);
          });
      }
      interaction.editReply(top);
    });
  },
};
