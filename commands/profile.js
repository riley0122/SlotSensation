const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Get your (or other peoples) statistics")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get the profile from (you by default)")
    ),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    if (
      interaction.options.getUser("user") != undefined &&
      interaction.options.getUser("user").id != interaction.user.id
    ) {
      axios
        .get(
          `http://localhost:54321/user/${
            interaction.options.getUser("user").id
          }`
        )
        .then((response) => {
          let embed;
          if (response.data.msg == "User not found!") {
            embed = {
              type: "rich",
              title: `User not found!`,
              description: "they are not in our database!",
              color: 0xff0000,
            };
          } else {
            embed = {
              type: "rich",
              title: `profile of ${
                interaction.options.getUser("user").displayName
              }`,
              description: "",
              color: 0x5900ff,
              fields: [
                {
                  name: `Tokens`,
                  value: `${response.data.tokens}`,
                  inline: true,
                },
                {
                  name: `Daily available`,
                  value: `${
                    response.data.lastDaily ==
                    new Date().toISOString().substring(0, 10)
                      ? "No"
                      : "Yes"
                  }`,
                  inline: true,
                },
              ],
            };
          }

          interaction.editReply({ embeds: [embed] });
        });
    } else {
      axios
        .get(`http://localhost:54321/user/${interaction.user.id}`)
        .then((response) => {
          let embed;
          if (response.data.msg == "User not found!") {
            embed = {
              type: "rich",
              title: `User not found!`,
              description: "You can register with `/me`",
              color: 0xff0000,
            };
          } else {
            embed = {
              type: "rich",
              title: `profile of ${interaction.user.displayName}`,
              description: "",
              color: 0x5900ff,
              fields: [
                {
                  name: `Tokens`,
                  value: `${response.data.tokens}`,
                  inline: true,
                },
                {
                  name: `Daily available`,
                  value: `${
                    response.data.lastDaily ==
                    new Date().toISOString().substring(0, 10)
                      ? "No"
                      : "Yes"
                  }`,
                  inline: true,
                },
              ],
            };
          }

          interaction.editReply({ embeds: [embed], ephemeral: response.data.msg == "User not found!" });
        });
    }
  },
};
