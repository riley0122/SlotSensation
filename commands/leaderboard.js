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
        element.id == interaction.user.id
          ? top.push(
              i +
                ". " +
                element.tokens +
                `   *[${interaction.user.id
                  .toString()
                  .slice(0, 3)}${interaction.user.id
                  .toString()
                  .slice(5, 7)}]*` +
                " **(you)**"
            )
          : top.push(
              i +
                ". " +
                element.tokens +
                `   *[${element.id.toString().slice(0, 3)}${element.id
                  .toString()
                  .slice(5, 7)}]*`
            );
      }
      let colour;
      let rand = Math.random();
      if (rand < 0.33) {
        colour = 0x590741;
      } else if (rand > 0.66) {
        colour = 0x490759;
      } else {
        colour = 0x7d1c9c;
      }
      interaction.editReply({
        embeds: [
          {
            title: "Leaderboard",
            description: "The top gamblers.",
            fields: [
              {
                name: `Top 5`,
                value: top.join("\n"),
                inline: false,
              },
            ],
            color: colour,
          },
        ],
      });
    });
  },
};
