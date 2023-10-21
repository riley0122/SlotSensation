const { default: axios } = require("axios");
const { SlashCommandBuilder } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

/**
 * Returns a string representation of a number
 * @param {Number} input
 * @returns {string}
 */
const getNRstring = (input) => {
  switch (input) {
    case 1:
      return "one";
    case 2:
      return "two";
    case 3:
      return "three";
    case 4:
      return "four";
    case 5:
      return "five";
    case 6:
      return "six";

    default:
      console.log(input);
      return "x";
  }
};

/**
 * Calculates the reward when winning something
 */
const calcReward = (bet) => {
  return bet > 10
    ? Math.floor(bet + 1 / (0.01 * bet) + Math.random * 10 - 5)
    : bet + Math.random * 10 - 1;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Roll a dice and guess the result")
    .addIntegerOption((option) =>
      option
        .setName("guess")
        .setMinValue(1)
        .setMaxValue(6)
        .setDescription("Guess what the outcome will be!")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("bet")
        .setMinValue(10)
        .setDescription("Place your bets!")
        .setRequired(true)
    ),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    await interaction.reply({
      embeds: [{ title: "Dice roll", description: "*rolling*" }],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [{ title: "Dice roll", description: "*rolling.*" }],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [{ title: "Dice roll", description: "*rolling..*" }],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [{ title: "Dice roll", description: "*rolling...*" }],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [{ title: "Dice roll", description: "*rolling....*" }],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [{ title: "Dice roll", description: "*rolling.....*" }],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [{ title: "Dice roll", description: "*rolling......*" }],
    });
    await wait(250);
    const result =
      Math.random() > 0.5
        ? Math.floor(Math.random() * 6)
        : Math.ceil(Math.random() * 6);

    const reward = calcReward(interaction.options.getInteger("bet"));

    await interaction.editReply({
      embeds: [
        {
          title: "Dice roll",
          description: `You rolled a :${getNRstring(result)}:!`,
          color:
            result == interaction.options.getInteger("guess")
              ? 0x00ff00
              : 0xff0000,
          fields: [
            {
              name: "Your guess",
              value: `${interaction.options.getInteger(
                "guess"
              )}  |  ${getNRstring(interaction.options.getInteger("guess"))}`,
            },
          ],
          footer: {
            text:
              result == interaction.options.getInteger("guess")
                ? `You won ${reward} tokens!`
                : `You lost ${interaction.options.getInteger("bet")} tokens :(`,
          },
        },
      ],
    });
    if (result == interaction.options.getInteger("guess")) {
      axios.get(
        `http://localhost:54321/tokens/add/${interaction.user.id}?ammount=${reward}`
      );
    }
  },
};
