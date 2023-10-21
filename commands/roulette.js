const {
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");
const axios = require("axios");
const wait = require("node:timers/promises").setTimeout;

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

/**
 * returns true if a number is considered low
 * @param {Number} number
 * @returns {Boolean}
 */
const isLow = (number) => {
  if (number > 18) {
    return false;
  }
  return true;
};

/**
 * returns true if the square of a number is black
 * @param {Number} number
 * @returns {Boolean}
 */
const isBlack = (number) => {
  if (number == 0) return false;
  if (number <= 10 || (number >= 19 && number <= 28)) {
    return number % 2 == 0;
  }
  return number % 2 != 0;
};

/**
 * Checks if the user has won based of what they bet
 * @param {Number} rolled
 * @param {string} bet
 * @returns {Boolean}
 */
const winCheck = (rolled, bet) => {
  switch (bet) {
    case "outside_high":
      return !isLow(rolled);
    case "outside_low":
      return isLow(rolled);
    case "outside_rouge":
      return !isBlack(rolled);
    case "outside_noir":
      return isBlack(rolled);
    case "outside_pair":
      return rolled % 2 == 0;
    case "outside_impair":
      return !(rolled % 2 == 0);
    default:
      return false;
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("Play a round of roulette!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("outside")
        .setDescription("Bet on a what you think will win")
        .addStringOption((option) =>
          option
            .setName("bet")
            .setDescription("What to bet on")
            .setRequired(true)
            .addChoices(
              { name: "High", value: "outside_high" },
              { name: "Low", value: "outside_low" },
              { name: "Red", value: "outside_rouge" },
              { name: "Black", value: "outside_noir" },
              { name: "Even", value: "outside_pair" },
              { name: "Odd", value: "outside_impair" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("wager")
            .setMinValue(1)
            .setDescription("How many tokens to wager")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Get info on how to play roulette")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("single")
        .setDescription("Bet on a single number")
        .addIntegerOption((option) =>
          option
            .setName("bet")
            .setDescription("What to bet on")
            .setMinValue(0)
            .setMaxValue(36)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("wager")
            .setMinValue(1)
            .setDescription("How many tokens to wager")
            .setRequired(true)
        )
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
      interaction.options.getInteger("wager")
    );
    isBroke = !isBroke;
    if (isBroke) {
      await interaction.reply({
        embeds: [
          {
            title: "You don't have that much tokens!",
            description: `You don't have ${interaction.options.getInteger(
              "wager"
            )} tokens! Try running \`/daily\`.`,
            color: 0xffff00,
          },
        ],
      });
      return;
    }
    const landedOn = Math.floor(Math.random() * 36);
    const reward = calcReward(
      interaction.options.getInteger("wager") *
        (interaction.options.getString("bet").contains("outside_") ? 0.75 : 1.5)
    );
    switch (interaction.options.getSubcommand()) {
      case "info":
        await interaction.reply({
          embeds: [
            {
              type: "rich",
              title: `Roulette info`,
              description: "",
              color: 0x005400,
              fields: [
                {
                  name: `Types of bets`,
                  value: "\u200B",
                },
                {
                  name: `Inside bets`,
                  value: `These Bets have a lower chance of winning but have a higher reward. In this bot the only inside bet is Single and can be accessed with \n\`/roulette single\``,
                  inline: true,
                },
                {
                  name: `Outside bets`,
                  value: `These Bets have a higher chance of winning but have a lower reward. In this bot the available outside bets are: *Higher / Lower*, *Odd / Even*, and *Red / Black* these can all be accessed with \n\`/roulette outside\``,
                  inline: true,
                },
                {
                  name: `For more information`,
                  value: `visit For more information visit https://en.wikipedia.org/wiki/Roulette#Types_of_bets`,
                },
              ],
              thumbnail: {
                url: `https://www.888casino.com/blog/sites/newblog.888casino.com/files/inline-images/the-roulette-wheel.jpg`,
                height: 0,
                width: 0,
              },
              author: {
                name: `From wikipedia`,
                url: `https://en.wikipedia.org/wiki/Roulette`,
              },
            },
          ],
        });
        break;
      case "single":
        axios // So that users cant spam and get more, this will be given back in the end
          .get(
            `http://localhost:54321/tokens/remove/${
              interaction.user.id
            }?ammount=${interaction.options.getInteger("wager")}`
          )
          .then(async (response) => {
            if (response.data.msg == "something went wrong!") {
              await interaction.reply({
                embeds: [
                  {
                    title: "Couldn't take tokens!",
                    description: `Something went wrong taking your ${interaction.options.getInteger(
                      "wager"
                    )} tokens!`,
                    color: 0xff0000,
                  },
                ],
              });
            }
          });
        await interaction.reply({
          embeds: [
            {
              type: "rich",
              title: `Roulette spin`,
              description: `spinning...`,
              color: 0xffd700,
              image: {
                url: `https://i.gifer.com/8C5T.gif`,
                height: 0,
                width: 0,
              },
            },
          ],
        });
        await wait(2500);
        if (landedOn == interaction.options.getInteger("bet")) {
          await interaction.editReply({
            embeds: [
              {
                type: "rich",
                title: `Roulette spin`,
                description: `You guessed ${landedOn} correctly!`,
                color: 0x00ff00,
                footer: {
                  text: `You won ${reward} tokens!`,
                },
              },
            ],
          });
        } else {
          await interaction.editReply({
            embeds: [
              {
                type: "rich",
                title: `Roulette spin`,
                description: `you lost, it was actually ${landedOn}`,
                color: 0xff0000,
                footer: {
                  text: `You lost ${interaction.options.getInteger(
                    "wager"
                  )} tokens :(`,
                },
              },
            ],
          });
        }

        if (landedOn == interaction.options.getInteger("bet")) {
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
              }?ammount=${interaction.options.getInteger("wager")}`
            )
            .then(async (response) => {
              if (response.data.msg == "something went wrong!") {
                await interaction.editReply({
                  embeds: [
                    {
                      title: "Couldn't take tokens!",
                      description: `Something went wrong taking your ${interaction.options.getInteger(
                        "wager"
                      )} tokens!`,
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
            }?ammount=${interaction.options.getInteger("wager")}`
          )
          .then(async (response) => {
            if (response.data.msg == "something went wrong!") {
              await interaction.editReply({
                embeds: [
                  {
                    title: "Couldn't return tokens!",
                    description: `Something went wrong returning your ${interaction.options.getInteger(
                      "wager"
                    )} tokens!`,
                    color: 0xff0000,
                  },
                ],
              });
            }
          });
        break;
      case "outside":
        axios // So that users cant spam and get more, this will be given back in the end
          .get(
            `http://localhost:54321/tokens/remove/${
              interaction.user.id
            }?ammount=${interaction.options.getInteger("wager")}`
          )
          .then(async (response) => {
            if (response.data.msg == "something went wrong!") {
              await interaction.reply({
                embeds: [
                  {
                    title: "Couldn't take tokens!",
                    description: `Something went wrong taking your ${interaction.options.getInteger(
                      "wager"
                    )} tokens!`,
                    color: 0xff0000,
                  },
                ],
              });
            }
          });

        if (winCheck(landedOn, interaction.options.getString("bet"))) {
          await interaction.editReply({
            embeds: [
              {
                type: "rich",
                title: `Roulette spin`,
                description: `You guessed ${interaction.options
                  .getString("bet")
                  .replace("outside_", "")} correctly!`,
                color: 0x00ff00,
                footer: {
                  text: `You won ${reward} tokens!`,
                },
              },
            ],
          });
        } else {
          await interaction.editReply({
            embeds: [
              {
                type: "rich",
                title: `Roulette spin`,
                description: `you lost, it was actually ${landedOn}`,
                color: 0xff0000,
                footer: {
                  text: `You lost ${interaction.options.getInteger(
                    "wager"
                  )} tokens :(`,
                },
              },
            ],
          });
        }

        axios // So that users cant spam and get more, this will be given back in the end: this is the end part
          .get(
            `http://localhost:54321/tokens/add/${
              interaction.user.id
            }?ammount=${interaction.options.getInteger("wager")}`
          )
          .then(async (response) => {
            if (response.data.msg == "something went wrong!") {
              await interaction.editReply({
                embeds: [
                  {
                    title: "Couldn't return tokens!",
                    description: `Something went wrong returning your ${interaction.options.getInteger(
                      "wager"
                    )} tokens!`,
                    color: 0xff0000,
                  },
                ],
              });
            }
          });
        break;
      default:
        await interaction.reply({
          content:
            "Not a valid subcommand, run `/roulette info` for more information",
          ephemeral: true,
        });
        break;
    }
  },
};
