const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// ==============================
// ENVIRONMENT VARIABLES
// ==============================

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  PLAYFAB_TITLE_ID,
  PLAYFAB_SECRET_KEY,
  PLAYFAB_CATALOG_VERSION,
  MOD_ROLE_IDS
} = process.env;

// ==============================
// CHECK ENVIRONMENT VARIABLES
// ==============================

if (
  !DISCORD_TOKEN ||
  !CLIENT_ID ||
  !GUILD_ID ||
  !PLAYFAB_TITLE_ID ||
  !PLAYFAB_SECRET_KEY ||
  !PLAYFAB_CATALOG_VERSION ||
  !MOD_ROLE_IDS
) {
  console.error("❌ Missing required environment variables.");

  if (!DISCORD_TOKEN) console.error("Missing: DISCORD_TOKEN");
  if (!CLIENT_ID) console.error("Missing: CLIENT_ID");
  if (!GUILD_ID) console.error("Missing: GUILD_ID");
  if (!PLAYFAB_TITLE_ID) console.error("Missing: PLAYFAB_TITLE_ID");
  if (!PLAYFAB_SECRET_KEY) console.error("Missing: PLAYFAB_SECRET_KEY");
  if (!PLAYFAB_CATALOG_VERSION) {
    console.error("Missing: PLAYFAB_CATALOG_VERSION");
  }
  if (!MOD_ROLE_IDS) console.error("Missing: MOD_ROLE_IDS");

  process.exit(1);
}

// ==============================
// MODERATOR ROLES
// ==============================

const allowedRoles = MOD_ROLE_IDS
  .split(",")
  .map(role => role.trim())
  .filter(Boolean);

// ==============================
// PLAYFAB API
// ==============================

const PLAYFAB_URL =
  `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Server`;

/**
 * Make a PlayFab Server API request.
 */
async function playFabRequest(endpoint, body) {
  const response = await fetch(`${PLAYFAB_URL}/${endpoint}`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "X-SecretKey": PLAYFAB_SECRET_KEY
    },

    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.code !== 200) {
    const message =
      data?.errorMessage ||
      data?.error ||
      "Unknown PlayFab error.";

    throw new Error(message);
  }

  return data;
}

// ==============================
// DISCORD SLASH COMMANDS
// ==============================

const commands = [

  // ==========================
  // /BAN
  // ==========================

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a player from Dream World.")
    .addStringOption(option =>
      option
        .setName("player_id")
        .setDescription("The player's PlayFab ID.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for the ban.")
        .setRequired(true)
        .setMaxLength(140)
    )
    .addIntegerOption(option =>
      option
        .setName("duration")
        .setDescription(
          "Ban duration in hours. Leave empty for permanent."
        )
        .setRequired(false)
        .setMinValue(1)
    ),

  // ==========================
  // /UNBAN
  // ==========================

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a PlayFab player.")
    .addStringOption(option =>
      option
        .setName("player_id")
        .setDescription("The player's PlayFab ID.")
        .setRequired(true)
    ),

  // ==========================
  // /GRANTITEMS
  // ==========================

  new SlashCommandBuilder()
    .setName("grantitems")
    .setDescription("Grant an item to a PlayFab player.")
    .addStringOption(option =>
      option
        .setName("player_id")
        .setDescription("The player's PlayFab ID.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("item_id")
        .setDescription("The PlayFab catalog Item ID.")
        .setRequired(true)
    )

].map(command => command.toJSON());

// ==============================
// REGISTER SLASH COMMANDS
// ==============================

async function registerCommands() {
  const rest = new REST({ version: "10" })
    .setToken(DISCORD_TOKEN);

  console.log("🔄 Registering Dream World commands...");

  await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      GUILD_ID
    ),
    {
      body: commands
    }
  );

  console.log("✅ Slash commands registered.");
}

// ==============================
// DISCORD CLIENT
// ==============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// ==============================
// STAFF CHECK
// ==============================

function isStaff(interaction) {
  if (
    !interaction.member ||
    !interaction.member.roles
  ) {
    return false;
  }

  return allowedRoles.some(roleId =>
    interaction.member.roles.cache.has(roleId)
  );
}

// ==============================
// COMMAND HANDLER
// ==============================

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isChatInputCommand()) {
      return;
    }

    // ==========================
    // SERVER CHECK
    // ==========================

    if (interaction.guildId !== GUILD_ID) {
      return interaction.reply({
        content:
          "❌ This bot can only be used in the Dream World server.",
        ephemeral: true
      });
    }

    // ==========================
    // STAFF CHECK
    // ==========================

    if (!isStaff(interaction)) {
      return interaction.reply({
        content:
          "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    try {

      // ==========================
      // /BAN
      // ==========================

      if (interaction.commandName === "ban") {

        const playerId =
          interaction.options.getString(
            "player_id"
          );

        const reason =
          interaction.options.getString(
            "reason"
          );

        const duration =
          interaction.options.getInteger(
            "duration"
          );

        // ==========================
        // CREATE BAN
        // ==========================

        const ban = {
          PlayFabId: playerId,
          Reason: reason
        };

        // If duration exists,
        // PlayFab expects the duration in hours.
        if (duration !== null) {
          ban.DurationInHours = duration;
        }

        // ==========================
        // SEND BAN TO PLAYFAB
        // ==========================

        await playFabRequest(
          "BanUsers",
          {
            Bans: [ban]
          }
        );

        // ==========================
        // DISPLAY DURATION
        // ==========================

        const durationText =
          duration === null
            ? "Permanent"
            : `${duration} hours`;

        return interaction.reply({
          content:
            `🔨 **Player Banned**\n\n` +
            `**Player ID:** \`${playerId}\`\n` +
            `**Reason:** ${reason}\n` +
            `**Duration:** ${durationText}\n` +
            `**Moderator:** ${interaction.user}`
        });
      }

      // ==========================
      // /UNBAN
      // ==========================

      if (interaction.commandName === "unban") {

        const playerId =
          interaction.options.getString(
            "player_id"
          );

        await playFabRequest(
          "RevokeAllBansForUser",
          {
            PlayFabId: playerId
          }
        );

        return interaction.reply({
          content:
            `🔓 **Player Unbanned**\n\n` +
            `**Player ID:** \`${playerId}\`\n` +
            `**Moderator:** ${interaction.user}`
        });
      }

      // ==========================
      // /GRANTITEMS
      // ==========================

      if (
        interaction.commandName ===
        "grantitems"
      ) {

        const playerId =
          interaction.options.getString(
            "player_id"
          );

        const itemId =
          interaction.options.getString(
            "item_id"
          );

        await playFabRequest(
          "GrantItemsToUser",
          {
            PlayFabId: playerId,
            CatalogVersion:
              PLAYFAB_CATALOG_VERSION,
            ItemIds: [itemId]
          }
        );

        return interaction.reply({
          content:
            `🎁 **Item Granted**\n\n` +
            `**Player ID:** \`${playerId}\`\n` +
            `**Item ID:** \`${itemId}\`\n` +
            `**Catalog:** \`${PLAYFAB_CATALOG_VERSION}\`\n` +
            `**Moderator:** ${interaction.user}`
        });
      }

    } catch (error) {

      console.error(
        "❌ PlayFab/Discord error:",
        error
      );

      // ==========================
      // ERROR AFTER REPLY
      // ==========================

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        return interaction.editReply({
          content:
            `❌ **Command failed:** ${error.message}`
        });
      }

      // ==========================
      // NORMAL ERROR
      // ==========================

      return interaction.reply({
        content:
          `❌ **Command failed:** ${error.message}`,
        ephemeral: true
      });
    }
  }
);

// ==============================
// BOT READY
// ==============================

client.once(
  "ready",
  () => {

    console.log(
      `✅ Logged in as ${client.user.tag}`
    );

    console.log(
      "🌙 Dream World PlayFab Bot is online."
    );
  }
);

// ==============================
// START BOT
// ==============================

(async () => {

  try {

    await registerCommands();

    await client.login(
      DISCORD_TOKEN
    );

  } catch (error) {

    console.error(
      "❌ Startup error:",
      error
    );

    process.exit(1);
  }

})();
