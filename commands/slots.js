const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const axios = require("axios");
const wait = require("node:timers/promises").setTimeout;

// Skull is sans undertale btw
const options = ["skull", "seven", "gem", "cherries", "lemon", "watermelon", "star", "moneybag"];
const weights = [0.01, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const payouts = {
  "skull": 333,
  "seven": 100,
  "gem": 50,
  "cherries": 40,
  "lemon": 30,
  "watermelon": 10,
  "star": 5,
  "moneybag": 3,
};

/**
 * Get a weighted random item from an array
 * @param {any[]} valuesArray The array to get an item from
 * @param {number[]} weightsArray The array with weights (between 0 and 1)
 * @param {number} weightsPrecision The precision of the weights, 10 means that you can have one after the decimal, 100 means two after the decimal etc.
 * @returns {any} The weighted random value
 */
const getWeightedRandomFromArray = (valuesArray, weightsArray, weightsPrecision=100) => {
  if (valuesArray.length !== weightsArray.length) {
    throw new Error("InvalidArgumentExcpetion: length of values is diffrent to the length of weights.");
  }

  let ajustedValues = [];
  for (let i = 0; i < valuesArray.length; i++) {
    const element = valuesArray[i];
    for (let j = 0; j < Math.round(weightsArray[i]*weightsPrecision); j++) {
      ajustedValues.push(element);
    }
  }

  return ajustedValues[Math.round(Math.random() * ajustedValues.length)];
}

const getRandomIcon = () => `:${getWeightedRandomFromArray(options, weights)}:`;
const getRandomGrid = () => new Array(3).fill(0).map(() => options.indexOf(getWeightedRandomFromArray(options, weights))); // 3 to get 3 items
const getGridWithOffset = (offset) => {
    let central = Math.round(Math.random() * options.length);
    let spread = Math.random() < 1/3 ? "left" : (Math.random() > 2/3 ? "right" : "mix");
    let left = 0;
    let right = 0;
    switch (spread) {
        case "left":
            right = central;
            if (Math.random() > 0.5) {
                left = central - offset;
            } else {
                left = central + offset;
            }
            break;
        case "right":
            left = central;
            if (Math.random() > 0.5) {
                right = central - offset;
            } else {
                right = central + offset;
            }
            break;
        case "mix":
            if (Math.random() > 0.5) {
                left = central - Math.round(offset/2);
                right = central + Math.round(offset/2);
            }else {
                right = central - Math.round(offset/2);
                left = central + Math.round(offset/2);
            }
            break;
        default:
            central = 0;
            left = 1;
            right = 3;
            break;
    }
    return [left, central, right];
}

const getIconForId = (id) => {
    if (id > options.length -1) {
        return getIconForId(options.length - 1 - id);
    } else if (id < 0){
        // Remember id is negative here so adding it is subtracting
        return getIconForId(options.length - 1 + id);
    } else {
        return options[id];
    }
}

const drawGrid = (grid) => `:${getIconForId(grid[0] - 1)}:\t:${getIconForId(grid[1] - 1)}:\t:${getIconForId(grid[2] - 1)}:\n:${getIconForId(grid[0])}:\t:${getIconForId(grid[1])}:\t:${getIconForId(grid[2])}:\n:${getIconForId(grid[0] + 1)}:\t:${getIconForId(grid[1] + 1)}:\t:${getIconForId(grid[2] + 1)}:`;

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
    .setName("slots")
    .setDescription("Try your luck with the slot machine with a max reward of 1000 tokens!"),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  cooldown: 0,
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
        ephemeral: true
      });
      return;
    }
    let isBroke = await hasTokens(
      interaction.user.id,
      20
    );
    isBroke = !isBroke;
    if (isBroke) {
      await interaction.reply({
        embeds: [
          {
            title: "You don't have that much tokens!",
            description: `You don't have 20 tokens! Try running \`/daily\`.`,
            color: 0xffff00,
          },
        ],
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
        embeds: [
          {
            type: "rich",
            title: `Slot machine :slot_machine:`,
            description: `spinning...`,
            color: 0xffd700,
            image: {
              url: `https://c.tenor.com/WUWygJ0Fwz8AAAAC/tenor.gif`,
              height: 0,
              width: 0,
            },
          },
        ],
    });
    await axios.get(`http://localhost:54321/tokens/remove/${interaction.user.id}?ammount=20`);

    const controlValue = Math.random();

    const grid = controlValue <= 0.5 ? getRandomGrid() : getGridWithOffset(controlValue > 0.75 ? 1 : 2);

    let winnings = 0;
    if ((grid[0] === grid[1] && grid[1] === grid[2]) || controlValue > 0.9) {
      winnings += payouts[getIconForId(grid[1])] * 3;
    } else if ((grid[0] - 1 === grid[1] && grid[1] === grid[2] + 1) || (grid[0] + 1 === grid[1] && grid[1] === grid[2] - 1)) {
      // Diagonal
      winnings += payouts[getIconForId(grid[1])];
    }

    const again = new ButtonBuilder()
      .setCustomId("spin_again")
      .setLabel("Spin again!")
      .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder().addComponents(again);

    await wait(2500);

    await axios.get(`http://localhost:54321/tokens/add/${interaction.user.id}?ammount=${winnings}`);

    await interaction.editReply({
      embeds: [
        {
          title: "Slot machine :slot_machine:",
          description: controlValue > 0.9 ? drawGrid(new Array(3).fill(grid[1])) : drawGrid(grid),
          color: winnings > 0 ? 0x00ff00 : 0xff0000, // Green if winning, red if not
          // Debug field: { name: "debug", value: `grid: ${grid}; controlValue: ${Math.round(controlValue * 1000)/1000}; first wincase: ${(grid[0] === grid[1] && grid[1] === grid[2])}; winnings: ${winnings}`}
          fields: winnings > 0 ? [{ name: "You Won!", value: `You won ${winnings} tokens!${grid[1] === 0 ? "\n OMG SANS UNDERTALE!!" : ""}` }] : [],
        },
      ],
      components: [row]
    });
  },
};
