const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("motivate")
    .setDescription("Get some motivation to continue your hard work!"),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        {
          type: "rich",
          title: `Most gamblers stop right before they win big`,
          description: `Continue gambling!!`,
          color: 0x00ffff,
          image: {
            url: `https://i.kym-cdn.com/photos/images/original/002/242/388/29b.jpeg`,
            height: 0,
            width: 0,
          },
        },
      ],
    });
  },
};
