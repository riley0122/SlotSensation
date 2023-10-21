const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("Get your statistics"),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    axios
      .get(`http://localhost:54321/user/${interaction.user.id}?create=true`)
      .then((response) => {
        let embed;
        if (response.data.msg == "User Created!") {
          embed = {
            type: "rich",
            title: `User Created!`,
            description: "Added you to the database!",
            color: 0x00ff00,
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

        interaction.editReply({ embeds: [embed] });
      });
  },
};
