const {
  Client,
  Events,
  GatewayIntentBits,
  Collection,
  ActivityType,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const axios = require("axios");
const express = require("express");

const app = express();
const { token, commandPath, mode } = require("./config.json");

let sqlite3;
let db;
if (mode == "test") {
  sqlite3 = require("sqlite3").verbose();
  db = new sqlite3.Database(":memory:");
} else {
  sqlite3 = require("sqlite3");
  db = new sqlite3.Database("database.db");
}

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, tokens INTEGER DEFAULT 0, lastDaily TEXT NOT NULL, streak INTEGER DEFAULT 0)"
  );
});

const client = new Client({ intents: [] });

client.commands = new Collection();

const cmdPath = path.join(__dirname, commandPath);
const cmdFiles = fs.readdirSync(cmdPath).filter((file) => file.endsWith(".js"));
for (const file of cmdFiles) {
  const f = path.join(cmdPath, file);
  const command = require(f);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`Oi dipshit u forgor to add some property ti ${file}`);
  }
}

const refreshActivity = () => {
  switch (Math.floor(Math.random() * 3)) {
    case 0:
      console.log("pokering");
      client.user.setActivity("Poker");
      break;
    case 1:
      console.log("ratteling");
      client.user.setActivity("The rattling of slot machines", {
        type: ActivityType.Listening,
      });
      break;
    case 2:
      console.log("blackjacking");
      client.user.setActivity("Blackjack", { type: ActivityType.Competing });
      break;
    case 3:
      console.log("diceing");
      client.user.setActivity("Dice roll", { type: ActivityType.Watching });
      break;
  }
};

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  refreshActivity();
  app.listen(54321, () => {
    console.log("API running! \n http://localhost:54321");
  });
});

app.get("/user/:id", (req, res) => {
  let sql = `SELECT * 
            FROM users 
            WHERE id = ?`;

  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.json({ msg: "something went wrong!", log: err });
      console.log(err);
      return;
    }
    if (row) {
      res.json(row);
    } else {
      if (req.query.create) {
        db.run(
          "INSERT INTO users (id,lastDaily) VALUES (?,?)",
          [req.params.id, new Date("9/11/2001").toISOString().substring(0, 10)],
          (err) => {
            if (err) {
              console.log(err);
              return res.json({ msg: "something went wrong!", log: err });
            }
            res.json({ msg: "User Created!" });
          }
        );
      } else {
        res.json({ msg: "User not found!" });
      }
    }
  });
});

app.get("/tokens/add/:userid", (req, res) => {
  if (!req.query.ammount || !isFinite(req.query.ammount)) {
    res.json({ msg: "No ammount provided" });
    return;
  }
  db.run(
    "UPDATE users SET tokens = tokens + ? WHERE id = ?",
    [Number(req.query.ammount), req.params.userid],
    (err) => {
      if (err) {
        return res.json({ msg: "something went wrong!", log: err });
      } else {
        res.json({ msg: "Updated user!" });
      }
    }
  );
});

const applyDaily = (streak, id) => {
  return new Promise((resolve) => {
    axios
      .get(
        `http://localhost:54321/tokens/add/${id}?ammount=${
          60 + 5 * Math.floor(Math.sqrt(streak))
        }`
      )
      .then((respons) => {
        if (respons.data.msg == "Updated user!") {
          db.run("UPDATE users SET streak = ?, lastDaily = ? WHERE id = ?", [
            streak + 1,
            new Date().toISOString().substring(0, 10),
            id,
          ]);
          resolve(true);
        } else {
          resolve(false);
        }
      });
  });
};

app.get("/daily/:id", (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      res.json({ msg: "something went wrong!", log: err });
      console.log(err);
      return;
    }
    if (!row) {
      res.json({ msg: "User not found!" });
      return;
    }
    today = new Date(new Date().toISOString().substring(0, 10));
    today.setDate(today.getDate());
    lastStreak = new Date(row.lastDaily);
    if (today - lastStreak == 86400000) {
      db.run(
        "UPDATE users SET streak = streak + 1 WHERE id = ?",
        [req.params.id],
        (err) => {
          if (err) {
            res.json({ msg: `Something went wrong`, log: err });
            return;
          }
          (async () => {
            if (await applyDaily(row.streak, req.params.id)) {
              res.json({ msg: `Streak is now ${row.streak + 1}` });
            } else {
              res.json({ msg: `Something went wrong` });
            }
          })();
        }
      );
    } else if (today - lastStreak == 0) {
      res.json({ msg: "Not available yet" });
    } else {
      db.run(
        "UPDATE users SET streak = 0 WHERE id = ?",
        [req.params.id],
        (err) => {
          if (err) {
            res.json({ msg: `Something went wrong`, log: err });
            return;
          }
          (async () => {
            if (await applyDaily(0, req.params.id)) {
              if (row.streak == 0) {
                res.json({ msg: `Started new streak!` });
              } else {
                res.json({ msg: `Streak lost at ${row.streak}!` });
              }
            } else {
              res.json({ msg: `Something went wrong` });
            }
          })();
        }
      );
    }
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`command ${interaction.commandName} dont exist`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

setInterval(refreshActivity, 600000);

process.on("beforeExit", () => {
  db.close();
});

client.login(token);
