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
 * @returns {Number}
 * @param {Number} bet
 */
const calcReward = (bet) => {
  return bet; // TODO make it actually return some kind of curve
};

/**
 * @returns {Boolean}
 * @param {import("discord.js").Snowflake} id
 */
const IsUser = (id) => {
  return new Promise(async (resolve) => {
    const resp = await axios.get(`http://localhost:54321/user/${id}`);
    if (resp.data.msg == "User not found!") {
      resolve(false);
    } else {
      resolve(true);
    }
  });
};

/**
 * @returns {Boolean}
 * @param {import("discord.js").Snowflake} id
 * @param {Number} tokens
 */
const hasTokens = (id, tokens) => {
  return new Promise(async (resolve) => {
    const resp = await axios.get(`http://localhost:54321/user/${id}`);
    if (resp.data.msg == "User not found!") {
      resolve(false);
    } else {
      resolve(resp.data.tokens >= tokens);
    }
  });
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
    let user = await IsUser(interaction.user.id);
    if (!user) {
      await interaction.reply({
        embeds: [
          {
            title: "You're not registered!",
            description:
              "You're not registered yet you silly goose, register with `/me`!",
            color: 0xffff00,
          },
        ],
      });
      return;
    }
    let isBroke = await hasTokens(
      interaction.user.id,
      interaction.options.getInteger("bet")
    );
    isBroke = !isBroke;
    if (isBroke) {
      await interaction.reply({
        embeds: [
          {
            title: "You don't have that much tokens!",
            description: `You don't have ${interaction.options.getInteger(
              "bet"
            )} tokens! Try running \`/daily\`.`,
            color: 0xffff00,
          },
        ],
      });
      return;
    }
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
    let result =
      Math.random() > 0.5
        ? Math.floor(Math.random() * 6)
        : Math.ceil(Math.random() * 6);
    if (result == 0) result = 1;
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
      axios
        .get(
          `http://localhost:54321/tokens/add/${interaction.user.id}?ammount=${reward}`
        )
        .then((response) => {
          console.log(response.data);
        });
    }
  },
};
