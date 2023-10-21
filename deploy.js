const { REST, Routes } = require("discord.js");
const {
  clientId,
  guildId,
  token,
  commandPath,
  mode,
} = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");

const commands = [];

// Get all commands
const cmdPath = path.join(__dirname, commandPath);
const cmdFolder = fs
  .readdirSync(cmdPath)
  .filter((file) => file.endsWith(".js"));
for (const command in cmdFolder) {
  const f = path.join(cmdPath, cmdFolder[command]);
  const cmd = require(f);

  if ("data" in cmd && "execute" in cmd) {
    commands.push(cmd.data.toJSON());
  } else {
    console.log(`Oi dipshit u forgor to add some property ti ${file}`);
  }
}

// Create rest client
const rest = new REST().setToken(token);

// Remove all old commands
rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
  .then(() => console.log("Successfully deleted all guild commands."))
  .catch(console.error);

// for global commands
rest
  .put(Routes.applicationCommands(clientId), { body: [] })
  .then(() => console.log("Successfully deleted all application commands."))
  .catch(console.error);

// deploy them
(async () => {
  try {
    console.log(`Deploying ${commands.length} commands`);
    let data;
    if (mode == "prod") {
      data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
    } else if (mode == "test") {
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
    } else {
      console.log(
        "I dunno wtf u want me to do here blud (check your mode in config.json should be [test|prod])"
      );
    }
  } catch (e) {
    console.error(e);
  }
})();
