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
  MOD_ROLE_IDS,
  GRANT_ITEM_ROLE_ID
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
  !MOD_ROLE_IDS ||
  !GRANT_ITEM_ROLE_ID
) {
  console.error("❌ Missing required environment variables.");

  if (!DISCORD_TOKEN) {
    console.error("Missing: DISCORD_TOKEN");
  }

  if (!CLIENT_ID) {
    console.error("Missing: CLIENT_ID");
  }

  if (!GUILD_ID) {
    console.error("Missing: GUILD_ID");
  }

  if (!PLAYFAB_TITLE_ID) {
    console.error("Missing: PLAYFAB_TITLE_ID");
  }

  if (!PLAYFAB_SECRET_KEY) {
    console.error("Missing: PLAYFAB_SECRET_KEY");
  }

  if (!PLAYFAB_CATALOG_VERSION) {
    console.error("Missing: PLAYFAB_CATALOG_VERSION");
  }

  if (!MOD_ROLE_IDS) {
    console.error("Missing: MOD_ROLE_IDS");
  }

  if (!GRANT_ITEM_ROLE_ID) {
    console.error("Missing: GRANT_ITEM_ROLE_ID");
  }

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
    ),

  // ==========================
  // /REMOVEITEM
  // ==========================

  new SlashCommandBuilder()
    .setName("removeitem")
    .setDescription("Remove an item from a PlayFab player.")

    .addStringOption(option =>
      option
        .setName("player_id")
        .setDescription("The player's PlayFab ID.")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("item_instance_id")
        .setDescription("The item's PlayFab Instance ID.")
        .setRequired(true)
    ),

  // ==========================
  // /GIVECURRENCY
  // ==========================

  new SlashCommandBuilder()
    .setName("givecurrency")
    .setDescription("Give virtual currency to a PlayFab player.")

    .addStringOption(option =>
      option
        .setName("player_id")
        .setDescription("The player's PlayFab ID.")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("currency")
        .setDescription("The PlayFab currency code, such as GC.")
        .setRequired(true)
        .setMaxLength(2)
    )

    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount of currency to give.")
        .setRequired(true)
        .setMinValue(1)
    ),

  // ==========================
  // /REMOVECURRENCY
  // ==========================

  new SlashCommandBuilder()
    .setName("removecurrency")
    .setDescription("Remove virtual currency from a PlayFab player.")

    .addStringOption(option =>
      option
        .setName("player_id")
        .setDescription("The player's PlayFab ID.")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("currency")
        .setDescription("The PlayFab currency code, such as GC.")
        .setRequired(true)
        .setMaxLength(2)
    )

    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount of currency to remove.")
        .setRequired(true)
        .setMinValue(1)
    ),

  // ==========================
  // /INVENTORY
  // ==========================

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View a player's PlayFab inventory.")

    .addStringOption(option =>
      option
        .setName("player_id")
        .setDescription("The player's PlayFab ID.")
        .setRequired(true)
    ),

  // ==========================
  // /MESSAGE
  // ==========================

  new SlashCommandBuilder()
    .setName("message")
    .setDescription("Send a private message to a Discord user.")

    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The Discord user to message.")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("The message to send.")
        .setRequired(true)
        .setMaxLength(1900)
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
// GRANT ITEM ROLE CHECK
// ==============================

function canGrantItems(interaction) {
  if (
    !interaction.member ||
    !interaction.member.roles
  ) {
    return false;
  }

  return interaction.member.roles.cache.has(
    GRANT_ITEM_ROLE_ID
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
    // PERMISSION CHECK
    // ==========================

    // These commands use GRANT_ITEM_ROLE_ID
    if (
      interaction.commandName === "grantitems" ||
      interaction.commandName === "removeitem" ||
      interaction.commandName === "givecurrency" ||
      interaction.commandName === "removecurrency" ||
      interaction.commandName === "inventory" ||
      interaction.commandName === "message"
    ) {

      if (!canGrantItems(interaction)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command.",
          ephemeral: true
        });
      }

    } else {

      // /ban and /unban use MOD_ROLE_IDS
      if (!isStaff(interaction)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command.",
          ephemeral: true
        });
      }
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

        const ban = {
          PlayFabId: playerId,
          Reason: reason
        };

        // If duration exists,
        // PlayFab expects the duration in hours.
        if (duration !== null) {
          ban.DurationInHours = duration;
        }

        await playFabRequest(
          "BanUsers",
          {
            Bans: [ban]
          }
        );

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
            `**Granted By:** ${interaction.user}`
        });
      }

      // ==========================
      // /REMOVEITEM
      // ==========================

      if (
        interaction.commandName ===
        "removeitem"
      ) {

        const playerId =
          interaction.options.getString(
            "player_id"
          );

        const itemInstanceId =
          interaction.options.getString(
            "item_instance_id"
          );

        await playFabRequest(
          "RevokeInventoryItem",
          {
            PlayFabId: playerId,
            ItemInstanceId: itemInstanceId
          }
        );

        return interaction.reply({
          content:
            `🗑️ **Item Removed**\n\n` +
            `**Player ID:** \`${playerId}\`\n` +
            `**Item Instance ID:** \`${itemInstanceId}\`\n` +
            `**Removed By:** ${interaction.user}`
        });
      }

      // ==========================
      // /GIVECURRENCY
      // ==========================

      if (
        interaction.commandName ===
        "givecurrency"
      ) {

        const playerId =
          interaction.options.getString(
            "player_id"
          );

        const currency =
          interaction.options.getString(
            "currency"
          ).toUpperCase();

        const amount =
          interaction.options.getInteger(
            "amount"
          );

        const result =
          await playFabRequest(
            "AddUserVirtualCurrency",
            {
              PlayFabId: playerId,
              VirtualCurrency: currency,
              Amount: amount
            }
          );

        return interaction.reply({
          content:
            `💰 **Currency Added**\n\n` +
            `**Player ID:** \`${playerId}\`\n` +
            `**Currency:** \`${currency}\`\n` +
            `**Amount:** \`${amount}\`\n` +
            `**New Balance:** \`${result.data?.Balance ?? "Unknown"}\`\n` +
            `**Given By:** ${interaction.user}`
        });
      }

      // ==========================
      // /REMOVECURRENCY
      // ==========================

      if (
        interaction.commandName ===
        "removecurrency"
      ) {

        const playerId =
          interaction.options.getString(
            "player_id"
          );

        const currency =
          interaction.options.getString(
            "currency"
          ).toUpperCase();

        const amount =
          interaction.options.getInteger(
            "amount"
          );

        const result =
          await playFabRequest(
            "SubtractUserVirtualCurrency",
            {
              PlayFabId: playerId,
              VirtualCurrency: currency,
              Amount: amount
            }
          );

        return interaction.reply({
          content:
            `💸 **Currency Removed**\n\n` +
            `**Player ID:** \`${playerId}\`\n` +
            `**Currency:** \`${currency}\`\n` +
            `**Amount:** \`${amount}\`\n` +
            `**New Balance:** \`${result.data?.Balance ?? "Unknown"}\`\n` +
            `**Removed By:** ${interaction.user}`
        });
      }

      // ==========================
      // /INVENTORY
      // ==========================

      if (
        interaction.commandName ===
        "inventory"
      ) {

        const playerId =
          interaction.options.getString(
            "player_id"
          );

        const result =
          await playFabRequest(
            "GetUserInventory",
            {
              PlayFabId: playerId
            }
          );

        const inventory =
          result.data?.Inventory || [];

        if (inventory.length === 0) {
          return interaction.reply({
            content:
              `🎒 **Player Inventory**\n\n` +
              `**Player ID:** \`${playerId}\`\n\n` +
              `This player has no items in their inventory.`
          });
        }

        let inventoryText =
          `🎒 **Player Inventory**\n\n` +
          `**Player ID:** \`${playerId}\`\n\n`;

        inventory.forEach((item, index) => {

          inventoryText +=
            `**${index + 1}. ${item.DisplayName || item.ItemId}**\n` +
            `Item ID: \`${item.ItemId || "Unknown"}\`\n` +
            `Instance ID: \`${item.ItemInstanceId || "Unknown"}\`\n\n`;
        });

        if (inventoryText.length > 1900) {

          inventoryText =
            inventoryText.substring(0, 1850) +
            `\n\n⚠️ Inventory is too large to display completely.`;
        }

        return interaction.reply({
          content: inventoryText
        });
      }

      // ==========================
      // /MESSAGE
      // ==========================

      if (
        interaction.commandName ===
        "message"
      ) {

        const user =
          interaction.options.getUser(
            "user"
          );

        const message =
          interaction.options.getString(
            "message"
          );

        try {

          await user.send({
            content:
              `📩 **Message from Dream World Staff**\n\n` +
              message
          });

        } catch (error) {

          return interaction.reply({
            content:
              `❌ I couldn't DM **${user.tag}**. They may have DMs disabled or blocked the bot.`,
            ephemeral: true
          });
        }

        return interaction.reply({
          content:
            `✅ **Message Sent**\n\n` +
            `**User:** ${user}\n` +
            `**Message:** ${message}`,
          ephemeral: true
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
