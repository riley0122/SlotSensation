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
 * @author @NoahStoessel
 */
const calcReward = (bet) => {
  // Set values for a and b
  var a = 10; // Adjust to control extra reward for low bets
  var b = 0.1; // Adjust to control the rate of increase

  // Generate a random factor between 0.8 and 1.2
  var randomFactor = 0.8 + Math.random() * (1.2 - 0.8);

  // Calculate the reward
  var reward = bet + a * (1 - (1 - randomFactor) * Math.exp(-b * bet));

  // Gradually decrease the additional reward for higher bets
  var maxAdditionalReward = 10; // Maximum additional reward
  var additionalReward = maxAdditionalReward * (1 - (bet - 10) / 90);
  reward += additionalReward;

  // Introduce a random factor for variability
  reward *= 0.9 + Math.random() * (1.1 - 0.9);

  return Math.floor(reward);
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
    axios // So that users cant spam and get more, this will be given back in the end
      .get(
        `http://localhost:54321/tokens/remove/${
          interaction.user.id
        }?ammount=${interaction.options.getInteger("bet")}`
      )
      .then(async (response) => {
        if (response.data.msg == "something went wrong!") {
          await interaction.reply({
            embeds: [
              {
                title: "Couldn't take tokens!",
                description: `Something went wrong taking your ${interaction.options.getInteger(
                  "bet"
                )} tokens!`,
                color: 0xff0000,
              },
            ],
          });
        }
      });
    await interaction.reply({
      embeds: [
        { title: "Dice roll", description: "*rolling*", color: 0x26224d },
      ],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [
        { title: "Dice roll", description: "*rolling.*", color: 0x352a6b },
      ],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [
        { title: "Dice roll", description: "*rolling..*", color: 0x483189 },
      ],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [
        { title: "Dice roll", description: "*rolling...*", color: 0x6036a7 },
      ],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [
        { title: "Dice roll", description: "*rolling....*", color: 0x7b39c4 },
      ],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [
        { title: "Dice roll", description: "*rolling.....*", color: 0x9938e0 },
      ],
    });
    await wait(250);
    await interaction.editReply({
      embeds: [
        { title: "Dice roll", description: "*rolling......*", color: 0xbb31fb },
      ],
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
        .then(async (response) => {
          if (response.data.msg == "something went wrong!") {
            await interaction.editReply({
              embeds: [
                {
                  title: "Couldn't reward tokens!",
                  description: `Something went wrong rewarding your ${reward} tokens!`,
                  color: 0xff0000,
                },
              ],
            });
          }
        });
    } else {
      axios
        .get(
          `http://localhost:54321/tokens/remove/${
            interaction.user.id
          }?ammount=${interaction.options.getInteger("bet")}`
        )
        .then(async (response) => {
          if (response.data.msg == "something went wrong!") {
            await interaction.editReply({
              embeds: [
                {
                  title: "Couldn't take tokens!",
                  description: `Something went wrong taking your ${reward} tokens!`,
                  color: 0xff0000,
                },
              ],
            });
          }
        });
    }
    axios // So that users cant spam and get more, this will be given back in the end: this is the end part
      .get(
        `http://localhost:54321/tokens/add/${
          interaction.user.id
        }?ammount=${interaction.options.getInteger("bet")}`
      )
      .then(async (response) => {
        if (response.data.msg == "something went wrong!") {
          await interaction.editReply({
            embeds: [
              {
                title: "Couldn't return tokens!",
                description: `Something went wrong returning your ${interaction.options.getInteger(
                  "bet"
                )} tokens!`,
                color: 0xff0000,
              },
            ],
          });
        }
      });
  },
};
