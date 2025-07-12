// discord bot slash pro
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const token = "You Bottoken";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.MessageContent
    ]
});

// Bot start time for uptime calculation
const startTime = Date.now();

// Store bot statistics
let commandsUsed = 0;

// AFK System Storage
const afkUsers = new Map(); // userId -> { reason, timestamp, mentions: [] }

// Sticky Message System Storage
const stickyMessages = new Map(); // channelId -> { message, active, lastMessageId }

client.once('ready', async () => {
    console.log(`${client.user.tag} is online!`);

    // Register slash commands
    const commands = [
        // Server commands
        new SlashCommandBuilder()
            .setName('server')
            .setDescription('Server management commands')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('info')
                    .setDescription('Display server information')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('membercount')
                    .setDescription('Show member count breakdown')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('banlist')
                    .setDescription('View server ban list')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('emojis')
                    .setDescription('Display all server emojis')
            ),

        // Channel commands
        new SlashCommandBuilder()
            .setName('channel')
            .setDescription('Channel management commands')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('info')
                    .setDescription('Get information about a specific channel')
                    .addChannelOption(option =>
                        option
                            .setName('channel')
                            .setDescription('The channel to get info about')
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('delete')
                    .setDescription('Delete a channel')
                    .addChannelOption(option =>
                        option
                            .setName('channel')
                            .setDescription('The channel to delete')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('clone')
                    .setDescription('Clone a channel with all its settings')
                    .addChannelOption(option =>
                        option
                            .setName('channel')
                            .setDescription('The channel to clone')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option
                            .setName('name')
                            .setDescription('Name for the cloned channel (optional)')
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('lockall')
                    .setDescription('Lock all channels in the server')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('unlockall')
                    .setDescription('Unlock all channels in the server')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('hideall')
                    .setDescription('Hide all channels from the server')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('unhideall')
                    .setDescription('Unhide all channels from the server')
            ),

        // Emoji commands
        new SlashCommandBuilder()
            .setName('emoji')
            .setDescription('Emoji management commands')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('steal')
                    .setDescription('Steal an emoji from another server')
                    .addStringOption(option =>
                        option
                            .setName('emoji')
                            .setDescription('The emoji to steal (custom emoji)')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option
                            .setName('name')
                            .setDescription('Name for the stolen emoji')
                            .setRequired(false)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('info')
                    .setDescription('Get information about a custom emoji')
                    .addStringOption(option =>
                        option
                            .setName('emoji')
                            .setDescription('The emoji to get info about')
                            .setRequired(true)
                    )
            ),

        // Bot commands
        new SlashCommandBuilder()
            .setName('bot')
            .setDescription('Bot information commands')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('invite')
                    .setDescription('Get bot\'s invite link')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('stats')
                    .setDescription('View bot statistics')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('uptime')
                    .setDescription('Check bot uptime')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('ping')
                    .setDescription('Check bot ping and latency')
            ),

        // AFK command
        new SlashCommandBuilder()
            .setName('afk')
            .setDescription('Set yourself as AFK')
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Reason for being AFK')
                    .setRequired(false)
            ),

        // Sticky message commands
        new SlashCommandBuilder()
            .setName('stick')
            .setDescription('Stick a message to this channel')
            .addStringOption(option =>
                option
                    .setName('message')
                    .setDescription('The message to stick')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('stickstop')
            .setDescription('Stop the stickied message in this channel'),

        new SlashCommandBuilder()
            .setName('stickstart')
            .setDescription('Restart a stopped sticky message using the previous message'),

        new SlashCommandBuilder()
            .setName('stickremove')
            .setDescription('Stop and completely delete the stickied message in this channel'),

        new SlashCommandBuilder()
            .setName('getstickies')
            .setDescription('Show all active and stopped stickies in your server'),

        // List command
        new SlashCommandBuilder()
            .setName('list')
            .setDescription('List various server information')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('bots')
                    .setDescription('List all bots in the server')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('activedeveloper')
                    .setDescription('List users with Active Developer badge')
            ),

        // Role command
        new SlashCommandBuilder()
            .setName('role')
            .setDescription('Role management commands')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('all')
                    .setDescription('Add a role to all members in the server')
                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription('The role to assign to all members')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('removeall')
                    .setDescription('Remove a role from all members in the server')
                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription('The role to remove from all members')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('Add a role to a specific user')
                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription('The role to assign to the user')
                            .setRequired(true)
                    )
                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription('The user to assign the role to')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('remove')
                    .setDescription('Remove a role from a specific user')
                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription('The role to remove from the user')
                            .setRequired(true)
                    )
                    .addUserOption(option =>
                        option
                            .setName('user')
                            .setDescription('The user to remove the role from')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('info')
                    .setDescription('Get detailed information about a role')
                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription('The role to get information about')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('name')
                    .setDescription('Rename a role')
                    .addRoleOption(option =>
                        option
                            .setName('role')
                            .setDescription('The role to rename')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option
                            .setName('name')
                            .setDescription('The new name for the role')
                            .setRequired(true)
                    )
            ),

        // Avatar command
        new SlashCommandBuilder()
            .setName('avatar')
            .setDescription('Display user\'s avatar')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user whose avatar to display')
                    .setRequired(false)
            ),

        // Help command
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Get help with bot commands')
            .addStringOption(option =>
                option
                    .setName('category')
                    .setDescription('Choose a command category')
                    .setRequired(false)
                    .addChoices(
                        { name: 'Server Commands', value: 'server' },
                        { name: 'Channel Commands', value: 'channel' },
                        { name: 'Emoji Commands', value: 'emoji' },
                        { name: 'Bot Commands', value: 'bot' },
                        { name: 'AFK System', value: 'afk' },
                        { name: 'Sticky Messages', value: 'sticky' },
                        { name: 'List Commands', value: 'list' },
                        { name: 'Role Commands', value: 'role' },
                        { name: 'Avatar Commands', value: 'avatar' }
                    )
            )
    ];

    try {
        console.log('Started refreshing application (/) commands.');
        await client.application.commands.set(commands);
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    commandsUsed++;
    const { commandName, options } = interaction;

    try {
        if (commandName === 'server') {
            const subcommand = options.getSubcommand();

            if (subcommand === 'info') {
                const guild = interaction.guild;
                const embed = new EmbedBuilder()
                    .setTitle(`${guild.name} Server Information`)
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: 'Server Name', value: guild.name, inline: true },
                        { name: 'Server ID', value: guild.id, inline: true },
                        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: 'Members', value: guild.memberCount.toString(), inline: true },
                        { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true },
                        { name: 'Boost Count', value: guild.premiumSubscriptionCount?.toString() || '0', inline: true },
                        { name: 'Verification Level', value: guild.verificationLevel.toString(), inline: true }
                    )
                    .setColor('#0099ff')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'membercount') {
                const guild = interaction.guild;
                const members = await guild.members.fetch();
                const humans = members.filter(member => !member.user.bot).size;
                const bots = members.filter(member => member.user.bot).size;

                const embed = new EmbedBuilder()
                    .setTitle(`${guild.name} Member Count`)
                    .addFields(
                        { name: 'Total Members', value: guild.memberCount.toString(), inline: true },
                        { name: 'Humans', value: humans.toString(), inline: true },
                        { name: 'Bots', value: bots.toString(), inline: true }
                    )
                    .setColor('#00ff00')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'banlist') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                    return await interaction.reply({ content: 'You need the "Ban Members" permission to use this command.', ephemeral: true });
                }

                const bans = await interaction.guild.bans.fetch();

                if (bans.size === 0) {
                    return await interaction.reply({ content: 'No banned users found.', ephemeral: true });
                }

                const banList = bans.map((ban, index) => `${index + 1}. ${ban.user.tag} (${ban.user.id})`).slice(0, 10);

                const embed = new EmbedBuilder()
                    .setTitle(`Ban List (${bans.size} total)`)
                    .setDescription(banList.join('\n') + (bans.size > 10 ? `\n... and ${bans.size - 10} more` : ''))
                    .setColor('#ff0000')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (subcommand === 'emojis') {
                const guild = interaction.guild;
                const emojis = guild.emojis.cache;

                if (emojis.size === 0) {
                    return await interaction.reply({ content: 'This server has no custom emojis.', ephemeral: true });
                }

                const emojiArray = Array.from(emojis.values());
                const itemsPerPage = 20;
                const totalPages = Math.ceil(emojiArray.length / itemsPerPage);
                let currentPage = 0;

                const generateEmbed = (page) => {
                    const start = page * itemsPerPage;
                    const end = start + itemsPerPage;
                    const emojiList = emojiArray.slice(start, end).map(emoji => `${emoji} \`:${emoji.name}:\``);

                    return new EmbedBuilder()
                        .setTitle(`Server Emojis (${emojis.size} total) - Page ${page + 1}/${totalPages}`)
                        .setDescription(emojiList.join('\n'))
                        .setColor('#ffff00')
                        .setTimestamp();
                };

                const generateButtons = (page) => {
                    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const row = new ActionRowBuilder();

                    if (page > 0) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('emoji_prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                        );
                    }

                    if (page < totalPages - 1) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('emoji_next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                        );
                    }

                    return row.components.length > 0 ? [row] : [];
                };

                const embed = generateEmbed(currentPage);
                const buttons = generateButtons(currentPage);

                const response = await interaction.reply({ 
                    embeds: [embed], 
                    components: buttons 
                });

                if (totalPages > 1) {
                    const collector = response.createMessageComponentCollector({ time: 60000 });

                    collector.on('collect', async i => {
                        if (i.user.id !== interaction.user.id) {
                            return await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
                        }

                        if (i.customId === 'emoji_next') {
                            currentPage++;
                        } else if (i.customId === 'emoji_prev') {
                            currentPage--;
                        }

                        const newEmbed = generateEmbed(currentPage);
                        const newButtons = generateButtons(currentPage);

                        await i.update({ embeds: [newEmbed], components: newButtons });
                    });

                    collector.on('end', async () => {
                        try {
                            await interaction.editReply({ components: [] });
                        } catch (error) {
                            console.log('Could not remove buttons:', error);
                        }
                    });
                }
            }
        }

        if (commandName === 'channel') {
            const subcommand = options.getSubcommand();

            if (subcommand === 'info') {
                const channel = options.getChannel('channel') || interaction.channel;

                const embed = new EmbedBuilder()
                    .setTitle(`Channel Information`)
                    .addFields(
                        { name: 'Name', value: channel.name, inline: true },
                        { name: 'ID', value: channel.id, inline: true },
                        { name: 'Type', value: channel.type.toString(), inline: true },
                        { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`, inline: true }
                    )
                    .setColor('#9932cc')
                    .setTimestamp();

                if (channel.topic) {
                    embed.addFields({ name: 'Topic', value: channel.topic });
                }

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'delete') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'You need the "Manage Channels" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'I need the "Manage Channels" permission to delete channels.', ephemeral: true });
                }

                const channelToDelete = options.getChannel('channel');

                if (!channelToDelete) {
                    return await interaction.reply({ content: 'Channel not found.', ephemeral: true });
                }

                // Prevent deleting the current channel if it's the same as interaction channel
                if (channelToDelete.id === interaction.channelId) {
                    return await interaction.reply({ content: 'I cannot delete the channel we are currently in. Please use this command from a different channel.', ephemeral: true });
                }

                try {
                    const channelName = channelToDelete.name;
                    await channelToDelete.delete('Deleted via bot command');

                    const embed = new EmbedBuilder()
                        .setTitle('Channel Deleted')
                        .setDescription(`Successfully deleted channel **#${channelName}**`)
                        .setColor('#ff0000')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error deleting channel:', error);
                    await interaction.reply({ content: 'Failed to delete the channel. Please check my permissions.', ephemeral: true });
                }
            }

            if (subcommand === 'clone') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'You need the "Manage Channels" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'I need the "Manage Channels" permission to clone channels.', ephemeral: true });
                }

                const channelToClone = options.getChannel('channel');
                const customName = options.getString('name');

                if (!channelToClone) {
                    return await interaction.reply({ content: 'Channel not found.', ephemeral: true });
                }

                await interaction.deferReply();

                try {
                    const cloneName = customName || `${channelToClone.name}-clone`;

                    // Clone the channel
                    const clonedChannel = await channelToClone.clone({
                        name: cloneName,
                        reason: 'Channel cloned via bot command'
                    });

                    const embed = new EmbedBuilder()
                        .setTitle('Channel Cloned')
                        .setDescription(`Successfully cloned **#${channelToClone.name}** to <#${clonedChannel.id}>`)
                        .addFields(
                            { name: 'Original Channel', value: `<#${channelToClone.id}>`, inline: true },
                            { name: 'Cloned Channel', value: `<#${clonedChannel.id}>`, inline: true }
                        )
                        .setColor('#00ff00')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error cloning channel:', error);
                    await interaction.editReply({ content: 'Failed to clone the channel. Please check my permissions and ensure the channel name is valid.', ephemeral: true });
                }
            }

            if (subcommand === 'lockall') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'You need the "Manage Channels" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'I need the "Manage Channels" permission to lock channels.', ephemeral: true });
                }

                await interaction.deferReply();

                try {
                    const channels = interaction.guild.channels.cache.filter(channel => 
                        channel.type === 0 || channel.type === 2 // Text or Voice channels
                    );

                    let lockedCount = 0;
                    let failedChannels = [];

                    for (const [channelId, channel] of channels) {
                        try {
                            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                                SendMessages: false,
                                Speak: false,
                                Connect: false
                            });
                            lockedCount++;
                        } catch (error) {
                            failedChannels.push(channel.name);
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Channels Locked')
                        .setDescription(`Successfully locked ${lockedCount} channels.`)
                        .setColor('#ff0000')
                        .setTimestamp();

                    if (failedChannels.length > 0) {
                        embed.addFields({
                            name: 'Failed to Lock',
                            value: failedChannels.slice(0, 10).join(', ') + (failedChannels.length > 10 ? `... and ${failedChannels.length - 10} more` : ''),
                            inline: false
                        });
                    }

                    await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error locking channels:', error);
                    await interaction.editReply({ content: 'Failed to lock channels. Please check my permissions.', ephemeral: true });
                }
            }

            if (subcommand === 'unlockall') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'You need the "Manage Channels" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'I need the "Manage Channels" permission to unlock channels.', ephemeral: true });
                }

                await interaction.deferReply();

                try {
                    const channels = interaction.guild.channels.cache.filter(channel => 
                        channel.type === 0 || channel.type === 2 // Text or Voice channels
                    );

                    let unlockedCount = 0;
                    let failedChannels = [];

                    for (const [channelId, channel] of channels) {
                        try {
                            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                                SendMessages: null,
                                Speak: null,
                                Connect: null
                            });
                            unlockedCount++;
                        } catch (error) {
                            failedChannels.push(channel.name);
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Channels Unlocked')
                        .setDescription(`Successfully unlocked ${unlockedCount} channels.`)
                        .setColor('#00ff00')
                        .setTimestamp();

                    if (failedChannels.length > 0) {
                        embed.addFields({
                            name: 'Failed to Unlock',
                            value: failedChannels.slice(0, 10).join(', ') + (failedChannels.length > 10 ? `... and ${failedChannels.length - 10} more` : ''),
                            inline: false
                        });
                    }

                    await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error unlocking channels:', error);
                    await interaction.editReply({ content: 'Failed to unlock channels. Please check my permissions.', ephemeral: true });
                }
            }

            if (subcommand === 'hideall') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'You need the "Manage Channels" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'I need the "Manage Channels" permission to hide channels.', ephemeral: true });
                }

                await interaction.deferReply();

                try {
                    const channels = interaction.guild.channels.cache.filter(channel => 
                        channel.type === 0 || channel.type === 2 // Text or Voice channels
                    );

                    let hiddenCount = 0;
                    let failedChannels = [];

                    for (const [channelId, channel] of channels) {
                        try {
                            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                                ViewChannel: false
                            });
                            hiddenCount++;
                        } catch (error) {
                            failedChannels.push(channel.name);
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Channels Hidden')
                        .setDescription(`Successfully hidden ${hiddenCount} channels from @everyone.`)
                        .setColor('#ff0000')
                        .setTimestamp();

                    if (failedChannels.length > 0) {
                        embed.addFields({
                            name: 'Failed to Hide',
                            value: failedChannels.slice(0, 10).join(', ') + (failedChannels.length > 10 ? `... and ${failedChannels.length - 10} more` : ''),
                            inline: false
                        });
                    }

                    await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error hiding channels:', error);
                    await interaction.editReply({ content: 'Failed to hide channels. Please check my permissions.', ephemeral: true });
                }
            }

            if (subcommand === 'unhideall') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'You need the "Manage Channels" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return await interaction.reply({ content: 'I need the "Manage Channels" permission to unhide channels.', ephemeral: true });
                }

                await interaction.deferReply();

                try {
                    const channels = interaction.guild.channels.cache.filter(channel => 
                        channel.type === 0 || channel.type === 2 // Text or Voice channels
                    );

                    let unhiddenCount = 0;
                    let failedChannels = [];

                    for (const [channelId, channel] of channels) {
                        try {
                            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                                ViewChannel: null
                            });
                            unhiddenCount++;
                        } catch (error) {
                            failedChannels.push(channel.name);
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Channels Unhidden')
                        .setDescription(`Successfully unhidden ${unhiddenCount} channels for @everyone.`)
                        .setColor('#00ff00')
                        .setTimestamp();

                    if (failedChannels.length > 0) {
                        embed.addFields({
                            name: 'Failed to Unhide',
                            value: failedChannels.slice(0, 10).join(', ') + (failedChannels.length > 10 ? `... and ${failedChannels.length - 10} more` : ''),
                            inline: false
                        });
                    }

                    await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error unhiding channels:', error);
                    await interaction.editReply({ content: 'Failed to unhide channels. Please check my permissions.', ephemeral: true });
                }
            }
        }

        if (commandName === 'emoji') {
            const subcommand = options.getSubcommand();

            if (subcommand === 'steal') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
                    return await interaction.reply({ content: 'You need the "Manage Emojis" permission to use this command.', ephemeral: true });
                }

                const emojiInput = options.getString('emoji');
                const customName = options.getString('name');

                // Extract emoji ID from custom emoji format
                const emojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);

                if (!emojiMatch) {
                    return await interaction.reply({ content: 'Please provide a valid custom emoji.', ephemeral: true });
                }

                const emojiName = customName || emojiMatch[1];
                const emojiId = emojiMatch[2];
                const emojiAnimated = emojiInput.startsWith('<a:');
                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${emojiAnimated ? 'gif' : 'png'}`;

                try {
                    const newEmoji = await interaction.guild.emojis.create({
                        attachment: emojiURL,
                        name: emojiName
                    });

                    await interaction.reply({ content: `Successfully added emoji ${newEmoji} as \`:${emojiName}:\`` });
                } catch (error) {
                    await interaction.reply({ content: `Failed to steal emoji: ${error.message}`, ephemeral: true });
                }
            }

            if (subcommand === 'info') {
                const emojiInput = options.getString('emoji');

                // Extract emoji ID from custom emoji format
                const emojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);

                if (!emojiMatch) {
                    return await interaction.reply({ content: 'Please provide a valid custom emoji.', ephemeral: true });
                }

                const emojiName = emojiMatch[1];
                const emojiId = emojiMatch[2];
                const emojiAnimated = emojiInput.startsWith('<a:');
                const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${emojiAnimated ? 'gif' : 'png'}`;

                // Check if emoji exists in this server
                const guildEmoji = interaction.guild.emojis.cache.get(emojiId);

                const embed = new EmbedBuilder()
                    .setTitle('Emoji Information')
                    .setThumbnail(emojiURL)
                    .addFields(
                        { name: 'Name', value: emojiName, inline: true },
                        { name: 'ID', value: emojiId, inline: true },
                        { name: 'Animated', value: emojiAnimated ? 'Yes' : 'No', inline: true },
                        { name: 'URL', value: `[View Full Size](${emojiURL})`, inline: true }
                    )
                    .setColor('#ffff00')
                    .setTimestamp();

                if (guildEmoji) {
                    embed.addFields(
                        { name: 'In This Server', value: 'Yes', inline: true },
                        { name: 'Created', value: `<t:${Math.floor(guildEmoji.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: 'Created By', value: guildEmoji.author ? guildEmoji.author.tag : 'Unknown', inline: true }
                    );
                } else {
                    embed.addFields(
                        { name: 'In This Server', value: 'No', inline: true }
                    );
                }

                await interaction.reply({ embeds: [embed] });
            }
        }

        if (commandName === 'bot') {
            const subcommand = options.getSubcommand();

            if (subcommand === 'invite') {
                const inviteURL = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

                const embed = new EmbedBuilder()
                    .setTitle('Invite Me!')
                    .setDescription(`[Click here to invite me to your server](${inviteURL})`)
                    .setColor('#00ff00')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'stats') {
                const embed = new EmbedBuilder()
                    .setTitle('Bot Statistics')
                    .addFields(
                        { name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
                        { name: 'Users', value: client.users.cache.size.toString(), inline: true },
                        { name: 'Commands Used', value: commandsUsed.toString(), inline: true },
                        { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
                        { name: 'Node.js Version', value: process.version, inline: true },
                        { name: 'Discord.js Version', value: require('discord.js').version, inline: true }
                    )
                    .setColor('#0099ff')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'uptime') {
                const uptime = Date.now() - startTime;
                const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
                const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

                const embed = new EmbedBuilder()
                    .setTitle('Bot Uptime')
                    .setDescription(`${days}d ${hours}h ${minutes}m ${seconds}s`)
                    .setColor('#00ff00')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'ping') {
                const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
                const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;

                const embed = new EmbedBuilder()
                    .setTitle('🏓 Pong!')
                    .addFields(
                        { name: 'Bot Latency', value: `${timeDiff}ms`, inline: true },
                        { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
                    )
                    .setColor('#00ff00')
                    .setTimestamp();

                await interaction.editReply({ content: '', embeds: [embed] });
            }
        }

        if (commandName === 'afk') {
            const reason = options.getString('reason') || 'No reason provided';
            const userId = interaction.user.id;

            afkUsers.set(userId, {
                reason: reason,
                timestamp: Date.now(),
                mentions: []
            });

            const embed = new EmbedBuilder()
                .setTitle('AFK Status Set')
                .setDescription(`You are now AFK: ${reason}`)
                .setColor('#ffaa00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'stick') {
            const message = options.getString('message');
            const channelId = interaction.channelId;

            // Check if user has manage messages permission
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({ content: 'You need the "Manage Messages" permission to use this command.', ephemeral: true });
            }

            // Send the sticky message
            const stickyMsg = await interaction.channel.send(message);

            // Store the sticky message data
            stickyMessages.set(channelId, {
                message: message,
                active: true,
                lastMessageId: stickyMsg.id
            });

            const embed = new EmbedBuilder()
                .setTitle('Sticky Message Set')
                .setDescription(`Message has been stickied to this channel.`)
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'stickstop') {
            const channelId = interaction.channelId;

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({ content: 'You need the "Manage Messages" permission to use this command.', ephemeral: true });
            }

            if (!stickyMessages.has(channelId)) {
                return await interaction.reply({ content: 'No sticky message found in this channel.', ephemeral: true });
            }

            const stickyData = stickyMessages.get(channelId);
            stickyData.active = false;

            // Delete the current sticky message
            try {
                const msg = await interaction.channel.messages.fetch(stickyData.lastMessageId);
                await msg.delete();
            } catch (error) {
                console.log('Could not delete sticky message:', error);
            }

            const embed = new EmbedBuilder()
                .setTitle('Sticky Message Stopped')
                .setDescription('The sticky message has been stopped.')
                .setColor('#ff6b6b')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'stickstart') {
            const channelId = interaction.channelId;

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({ content: 'You need the "Manage Messages" permission to use this command.', ephemeral: true });
            }

            if (!stickyMessages.has(channelId)) {
                return await interaction.reply({ content: 'No sticky message found in this channel.', ephemeral: true });
            }

            const stickyData = stickyMessages.get(channelId);

            if (stickyData.active) {
                return await interaction.reply({ content: 'Sticky message is already active.', ephemeral: true });
            }

            // Restart the sticky message
            const stickyMsg = await interaction.channel.send(stickyData.message);
            stickyData.active = true;
            stickyData.lastMessageId = stickyMsg.id;

            const embed = new EmbedBuilder()
                .setTitle('Sticky Message Restarted')
                .setDescription('The sticky message has been restarted.')
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'stickremove') {
            const channelId = interaction.channelId;

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({ content: 'You need the "Manage Messages" permission to use this command.', ephemeral: true });
            }

            if (!stickyMessages.has(channelId)) {
                return await interaction.reply({ content: 'No sticky message found in this channel.', ephemeral: true });
            }

            const stickyData = stickyMessages.get(channelId);

            // Delete the current sticky message
            try {
                const msg = await interaction.channel.messages.fetch(stickyData.lastMessageId);
                await msg.delete();
            } catch (error) {
                console.log('Could not delete sticky message:', error);
            }

            // Remove from storage
            stickyMessages.delete(channelId);

            const embed = new EmbedBuilder()
                .setTitle('Sticky Message Removed')
                .setDescription('The sticky message has been completely removed.')
                .setColor('#ff0000')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'getstickies') {
            const guild = interaction.guild;
            const guildStickies = [];

            for (const [channelId, stickyData] of stickyMessages) {
                const channel = guild.channels.cache.get(channelId);
                if (channel) {
                    guildStickies.push({
                        channel: channel.name,
                        message: stickyData.message.substring(0, 50) + (stickyData.message.length > 50 ? '...' : ''),
                        status: stickyData.active ? '🟢 Active' : '🔴 Stopped'
                    });
                }
            }

            if (guildStickies.length === 0) {
                return await interaction.reply({ content: 'No sticky messages found in this server.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`Sticky Messages in ${guild.name}`)
                .setDescription(guildStickies.map(sticky => 
                    `**#${sticky.channel}** - ${sticky.status}\n\`${sticky.message}\``
                ).join('\n\n'))
                .setColor('#0099ff')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (commandName === 'list') {
            const subcommand = options.getSubcommand();

            if (subcommand === 'bots') {
                const guild = interaction.guild;
                const members = await guild.members.fetch();
                const bots = members.filter(member => member.user.bot);

                if (bots.size === 0) {
                    return await interaction.reply({ content: 'No bots found in this server.', ephemeral: true });
                }

                const botsArray = Array.from(bots.values());
                const itemsPerPage = 10;
                const totalPages = Math.ceil(botsArray.length / itemsPerPage);
                let currentPage = 0;

                const generateEmbed = (page) => {
                    const start = page * itemsPerPage;
                    const end = start + itemsPerPage;
                    const botList = botsArray.slice(start, end).map((bot, index) => {
                        const globalIndex = start + index + 1;
                        return `\`#${globalIndex}.\` [${bot.user.username}#${bot.user.discriminator}](https://discord.com/users/${bot.user.id}) [<@${bot.user.id}>]`;
                    }).join('\n');

                    return new EmbedBuilder()
                        .setTitle(`Bots in ${guild.name} - Page ${page + 1}/${totalPages}`)
                        .setDescription(botList)
                        .addFields(
                            { name: 'Total Bots', value: bots.size.toString(), inline: true }
                        )
                        .setColor('#0099ff')
                        .setTimestamp();
                };

                const generateButtons = (page) => {
                    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const row = new ActionRowBuilder();

                    if (page > 0) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('bots_prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                        );
                    }

                    if (page < totalPages - 1) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('bots_next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                        );
                    }

                    return row.components.length > 0 ? [row] : [];
                };

                const embed = generateEmbed(currentPage);
                const buttons = generateButtons(currentPage);

                const response = await interaction.reply({ 
                    embeds: [embed], 
                    components: buttons 
                });

                if (totalPages > 1) {
                    const collector = response.createMessageComponentCollector({ time: 60000 });

                    collector.on('collect', async i => {
                        if (i.user.id !== interaction.user.id) {
                            return await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
                        }

                        if (i.customId === 'bots_next') {
                            currentPage++;
                        } else if (i.customId === 'bots_prev') {
                            currentPage--;
                        }

                        const newEmbed = generateEmbed(currentPage);
                        const newButtons = generateButtons(currentPage);

                        await i.update({ embeds: [newEmbed], components: newButtons });
                    });

                    collector.on('end', async () => {
                        try {
                            await interaction.editReply({ components: [] });
                        } catch (error) {
                            console.log('Could not remove buttons:', error);
                        }
                    });
                }
            }

            if (subcommand === 'activedeveloper') {
                const guild = interaction.guild;
                const members = await guild.members.fetch();

                // Filter members with Active Developer badge (badge ID 22)
                const activeDevelopers = members.filter(member => 
                    member.user.flags && member.user.flags.has('ActiveDeveloper')
                );

                if (activeDevelopers.size === 0) {
                    return await interaction.reply({ content: 'No Active Developers found in this server.', ephemeral: true });
                }

                // Sort by join date (oldest first)
                const sortedDevelopers = activeDevelopers.sort((a, b) => 
                    a.user.createdTimestamp - b.user.createdTimestamp
                );

                const developersArray = Array.from(sortedDevelopers.values());
                const itemsPerPage = 10;
                const totalPages = Math.ceil(developersArray.length / itemsPerPage);
                let currentPage = 0;

                const generateEmbed = (page) => {
                    const start = page * itemsPerPage;
                    const end = start + itemsPerPage;
                    const developerList = developersArray.slice(start, end).map((member, index) => {
                        const joinTimestamp = Math.floor(member.user.createdTimestamp / 1000);
                        const globalIndex = start + index + 1;
                        return `\`#${globalIndex}.\` [${member.user.username}](https://discord.com/users/${member.user.id}) [<@${member.user.id}>] - <t:${joinTimestamp}:D>`;
                    }).join('\n');

                    return new EmbedBuilder()
                        .setTitle(`Active Developers in ${guild.name} - Page ${page + 1}/${totalPages}`)
                        .setDescription(developerList)
                        .addFields(
                            { name: 'Total Active Developers', value: activeDevelopers.size.toString(), inline: true }
                        )
                        .setColor('#5865f2')
                        .setTimestamp();
                };

                const generateButtons = (page) => {
                    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                    const row = new ActionRowBuilder();

                    if (page > 0) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('activedeveloper_prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                        );
                    }

                    if (page < totalPages - 1) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('activedeveloper_next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                        );
                    }

                    return row.components.length > 0 ? [row] : [];
                };

                const embed = generateEmbed(currentPage);
                const buttons = generateButtons(currentPage);

                const response = await interaction.reply({ 
                    embeds: [embed], 
                    components: buttons 
                });

                if (totalPages > 1) {
                    const collector = response.createMessageComponentCollector({ time: 60000 });

                    collector.on('collect', async i => {
                        if (i.user.id !== interaction.user.id) {
                            return await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
                        }

                        if (i.customId === 'activedeveloper_next') {
                            currentPage++;
                        } else if (i.customId === 'activedeveloper_prev') {
                            currentPage--;
                        }

                        const newEmbed = generateEmbed(currentPage);
                        const newButtons = generateButtons(currentPage);

                        await i.update({ embeds: [newEmbed], components: newButtons });
                    });

                    collector.on('end', async () => {
                        try {
                            await interaction.editReply({ components: [] });
                        } catch (error) {
                            console.log('Could not remove buttons:', error);
                        }
                    });
                }
            }
        }

        if (commandName === 'role') {
            const subcommand = options.getSubcommand();

            if (subcommand === 'all') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'You need the "Manage Roles" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'I need the "Manage Roles" permission to assign roles.', ephemeral: true });
                }

                const role = options.getRole('role');

                if (!role) {
                    return await interaction.reply({ content: 'Role not found.', ephemeral: true });
                }

                // Check if the role is higher than the bot's highest role
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.reply({ content: 'I cannot assign a role that is higher than or equal to my highest role.', ephemeral: true });
                }

                // Check if the role is higher than the user's highest role (unless they're the owner)
                if (interaction.guild.ownerId !== interaction.user.id && role.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({ content: 'You cannot assign a role that is higher than or equal to your highest role.', ephemeral: true });
                }

                await interaction.deferReply();

                try {
                    const members = await interaction.guild.members.fetch();
                    let successCount = 0;
                    let failedCount = 0;
                    let alreadyHasRole = 0;

                    for (const [memberId, member] of members) {
                        // Skip bots if desired (uncomment the next line to skip bots)
                        // if (member.user.bot) continue;

                        if (member.roles.cache.has(role.id)) {
                            alreadyHasRole++;
                            continue;
                        }

                        try {
                            await member.roles.add(role, `Role Add to all members by ${interaction.user.tag}`);
                            successCount++;
                        } catch (error) {
                            failedCount++;
                            console.log(`Failed to Add role to ${member.user.tag}:`, error);
                        }

                        // Add a small delay to prevent rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Successfully')
                        .setDescription(`Successfully Add ${role} to all members.`)
                        .addFields(
                            { name: 'Success Count', value: successCount.toString(), inline: true },
                            { name: 'Already Had Role', value: alreadyHasRole.toString(), inline: true },
                            { name: 'Failed', value: failedCount.toString(), inline: true },
                            { name: 'Total Members', value: members.size.toString(), inline: true }
                        )
                        .setColor('#00ff00')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error Add roles:', error);
                    await interaction.editReply({ content: 'Failed to Add roles. Please check my permissions and try again.', ephemeral: true });
                }
            }

            if (subcommand === 'removeall') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'You need the "Manage Roles" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'I need the "Manage Roles" permission to remove roles.', ephemeral: true });
                }

                const role = options.getRole('role');

                if (!role) {
                    return await interaction.reply({ content: 'Role not found.', ephemeral: true });
                }

                // Check if the role is higher than the bot's highest role
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.reply({ content: 'I cannot remove a role that is higher than or equal to my highest role.', ephemeral: true });
                }

                // Check if the role is higher than the user's highest role (unless they're the owner)
                if (interaction.guild.ownerId !== interaction.user.id && role.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({ content: 'You cannot remove a role that is higher than or equal to your highest role.', ephemeral: true });
                }

                await interaction.deferReply();

                try {
                    const members = await interaction.guild.members.fetch();
                    let successCount = 0;
                    let failedCount = 0;
                    let didNotHaveRole = 0;

                    for (const [memberId, member] of members) {
                        if (!member.roles.cache.has(role.id)) {
                            didNotHaveRole++;
                            continue;
                        }

                        try {
                            await member.roles.remove(role, `Role removed from all members by ${interaction.user.tag}`);
                            successCount++;
                        } catch (error) {
                            failedCount++;
                            console.log(`Failed to remove role from ${member.user.tag}:`, error);
                        }

                        // Add a small delay to prevent rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Successfully')
                        .setDescription(`Successfully removed ${role} from all members.`)
                        .addFields(
                            { name: 'Success Count', value: successCount.toString(), inline: true },
                            { name: 'Did Not Have Role', value: didNotHaveRole.toString(), inline: true },
                            { name: 'Failed', value: failedCount.toString(), inline: true },
                            { name: 'Total Members', value: members.size.toString(), inline: true }
                        )
                        .setColor('#ff6b6b')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error removing roles:', error);
                    await interaction.editReply({ content: 'Failed to remove roles. Please check my permissions and try again.', ephemeral: true });
                }
            }

            if (subcommand === 'add') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'You need the "Manage Roles" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'I need the "Manage Roles" permission to assign roles.', ephemeral: true });
                }

                const role = options.getRole('role');
                const targetUser = options.getUser('user');

                if (!role) {
                    return await interaction.reply({ content: 'Role not found.', ephemeral: true });
                }

                if (!targetUser) {
                    return await interaction.reply({ content: 'User not found.', ephemeral: true });
                }

                // Check if the role is higher than the bot's highest role
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.reply({ content: 'I cannot assign a role that is higher than or equal to my highest role.', ephemeral: true });
                }

                // Check if the role is higher than the user's highest role (unless they're the owner)
                if (interaction.guild.ownerId !== interaction.user.id && role.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({ content: 'You cannot assign a role that is higher than or equal to your highest role.', ephemeral: true });
                }

                try {
                    const member = await interaction.guild.members.fetch(targetUser.id);

                    if (!member) {
                        return await interaction.reply({ content: 'User is not a member of this server.', ephemeral: true });
                    }

                    if (member.roles.cache.has(role.id)) {
                        return await interaction.reply({ content: `${targetUser.username} already has the ${role} role.`, ephemeral: true });
                    }

                    await member.roles.add(role, `Role assigned by ${interaction.user.tag}`);

                    const embed = new EmbedBuilder()
                        .setTitle('Role Added')
                        .setDescription(`Successfully added ${role} to ${targetUser}`)
                        .setColor('#00ff00')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error adding role:', error);
                    await interaction.reply({ content: 'Failed to assign role. Please check my permissions and try again.', ephemeral: true });
                }
            }

            if (subcommand === 'remove') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'You need the "Manage Roles" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'I need the "Manage Roles" permission to remove roles.', ephemeral: true });
                }

                const role = options.getRole('role');
                const targetUser = options.getUser('user');

                if (!role) {
                    return await interaction.reply({ content: 'Role not found.', ephemeral: true });
                }

                if (!targetUser) {
                    return await interaction.reply({ content: 'User not found.', ephemeral: true });
                }

                // Check if the role is higher than the bot's highest role
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.reply({ content: 'I cannot remove a role that is higher than or equal to my highest role.', ephemeral: true });
                }

                // Check if the role is higher than the user's highest role (unless they're the owner)
                if (interaction.guild.ownerId !== interaction.user.id && role.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({ content: 'You cannot remove a role that is higher than or equal to your highest role.', ephemeral: true });
                }

                try {
                    const member = await interaction.guild.members.fetch(targetUser.id);

                    if (!member) {
                        return await interaction.reply({ content: 'User is not a member of this server.', ephemeral: true });
                    }

                    if (!member.roles.cache.has(role.id)) {
                        return await interaction.reply({ content: `${targetUser.username} does not have the ${role} role.`, ephemeral: true });
                    }

                    await member.roles.remove(role, `Role removed by ${interaction.user.tag}`);

                    const embed = new EmbedBuilder()
                        .setTitle('Role Removed')
                        .setDescription(`Successfully removed ${role} from ${targetUser}`)
                        .setColor('#ff6b6b')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error removing role:', error);
                    await interaction.reply({ content: 'Failed to remove role. Please check my permissions and try again.', ephemeral: true });
                }
            }

            if (subcommand === 'info') {
                const role = options.getRole('role');

                if (!role) {
                    return await interaction.reply({ content: 'Role not found.', ephemeral: true });
                }

                // Get members with this role
                const membersWithRole = role.members.size;

                // Role permissions
                const permissions = role.permissions.toArray();
                const permissionsList = permissions.length > 0 ? permissions.slice(0, 10).join(', ') + (permissions.length > 10 ? `... and ${permissions.length - 10} more` : '') : 'None';

                const embed = new EmbedBuilder()
                    .setTitle(`Role Information: ${role.name}`)
                    .addFields(
                        { name: 'Role Name', value: role.name, inline: true },
                        { name: 'Role ID', value: role.id, inline: true },
                        { name: 'Color', value: role.hexColor || '#000000', inline: true },
                        { name: 'Position', value: role.position.toString(), inline: true },
                        { name: 'Members', value: membersWithRole.toString(), inline: true },
                        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
                        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
                        { name: 'Managed', value: role.managed ? 'Yes (Bot/Integration)' : 'No', inline: true },
                        { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: 'Permissions', value: permissionsList, inline: false }
                    )
                    .setColor(role.color || '#0099ff')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'name') {
                // Check user permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'You need the "Manage Roles" permission to use this command.', ephemeral: true });
                }

                // Check bot permissions
                if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return await interaction.reply({ content: 'I need the "Manage Roles" permission to rename roles.', ephemeral: true });
                }

                const role = options.getRole('role');
                const newName = options.getString('name');

                if (!role) {
                    return await interaction.reply({ content: 'Role not found.', ephemeral: true });
                }

                // Check if the role is higher than the bot's highest role
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return await interaction.reply({ content: 'I cannot rename a role that is higher than or equal to my highest role.', ephemeral: true });
                }

                // Check if the role is higher than the user's highest role (unless they're the owner)
                if (interaction.guild.ownerId !== interaction.user.id && role.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({ content: 'You cannot rename a role that is higher than or equal to your highest role.', ephemeral: true });
                }

                // Check if role is managed (bot/integration role)
                if (role.managed) {
                    return await interaction.reply({ content: 'I cannot rename a managed role (bot/integration role).', ephemeral: true });
                }

                // Validate new name
                if (newName.length > 100) {
                    return await interaction.reply({ content: 'Role name cannot be longer than 100 characters.', ephemeral: true });
                }

                if (newName.trim() === '') {
                    return await interaction.reply({ content: 'Role name cannot be empty.', ephemeral: true });
                }

                const oldName = role.name;

                try {
                    await role.setName(newName, `Role renamed by ${interaction.user.tag}`);

                    const embed = new EmbedBuilder()
                        .setTitle('Role Renamed')
                        .setDescription(`Successfully renamed role from **${oldName}** to **${newName}**`)
                        .addFields(
                            { name: 'Old Name', value: oldName, inline: true },
                            { name: 'New Name', value: newName, inline: true },
                            { name: 'Role', value: `${role}`, inline: true }
                        )
                        .setColor('#00ff00')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error renaming role:', error);
                    await interaction.reply({ content: 'Failed to rename role. Please check my permissions and ensure the name is valid.', ephemeral: true });
                }
            }
        }

        if (commandName === 'avatar') {
            const targetUser = options.getUser('user') || interaction.user;

            // Get avatar URL base (without extension)
            const avatarURL = targetUser.displayAvatarURL({ dynamic: false, size: 1024 });
            const avatarBase = avatarURL.split('.').slice(0, -1).join('.');

            // Create format links
            const formatLinks = [
                `[png](${avatarBase}.png)`,
                `[jpg](${avatarBase}.jpg)`,
                `[webp](${avatarBase}.webp?size=1024)`
            ];

            const embed = new EmbedBuilder()
                .setTitle(`${targetUser.displayName}'s Avatar`)
                .setDescription(`**Download Links:**\n${formatLinks.join(' | ')}`)
                .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag}`, inline: true },
                    { name: 'User ID', value: targetUser.id, inline: true }
                )
                .setColor('#0099ff')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'help') {
            const category = options.getString('category');

            if (!category) {
                // Show general help with all categories
                const embed = new EmbedBuilder()
                    .setTitle('🤖 Bot Help')
                    .setDescription('Here are all available command categories. Use `/help [category]` for detailed information about specific commands.')
                    .addFields(
                        { name: '🏠 Server Commands', value: '`/help server` - Server management and information', inline: true },
                        { name: '📺 Channel Commands', value: '`/help channel` - Channel information', inline: true },
                        { name: '😀 Emoji Commands', value: '`/help emoji` - Emoji management', inline: true },
                        { name: '🤖 Bot Commands', value: '`/help bot` - `/help bot` - Bot information and statistics', inline: true },
                        { name: '💤 AFK System', value: '`/help afk` - AFK status management', inline: true },
                        { name: '📌 Sticky Messages', value: '`/help sticky` - Sticky message system', inline: true },
                        { name: '📋 List Commands', value: '`/help list` - List various server information', inline: true },
                        { name: '👥 Role Commands', value: '`/help role` - Role management commands', inline: true },
                        { name: '🖼️ Avatar Commands', value: '`/help avatar` - Display user avatars', inline: true }
                    )
                    .setColor('#0099ff')
                    .setTimestamp()
                    .setFooter({ text: 'Use /help [category] for detailed command information' });

                await interaction.reply({ embeds: [embed] });
            } else {
                // Show specific category help
                let embed;

                switch (category) {
                    case 'server':
                        embed = new EmbedBuilder()
                            .setTitle('🏠 Server Commands')
                            .setDescription('Commands for server management and information')
                            .addFields(
                                { name: '/server info', value: 'Display detailed server information including owner, creation date, member count, and boost level', inline: false },
                                { name: '/server membercount', value: 'Show breakdown of members (humans vs bots)', inline: false },
                                { name: '/server banlist', value: 'View server ban list (requires Ban Members permission)', inline: false },
                                { name: '/server emojis', value: 'Display all custom server emojis with pagination', inline: false }
                            )
                            .setColor('#ff6b35');
                        break;

                    case 'channel':
                        embed = new EmbedBuilder()
                            .setTitle('📺 Channel Commands')
                            .setDescription('Commands for channel management (requires Manage Channels permission)')
                            .addFields(
                                { name: '/channel info [channel]', value: 'Get detailed information about a channel (current channel if none specified)', inline: false },
                                { name: '/channel delete <channel>', value: 'Delete a specified channel (requires Manage Channels permission)', inline: false },
                                { name: '/channel clone <channel> [name]', value: 'Clone a channel with all its settings. Optionally specify a custom name for the clone', inline: false },
                                { name: '/channel lockall', value: 'Lock all channels in the server (prevents @everyone from sending messages/speaking/connecting)', inline: false },
                                { name: '/channel unlockall', value: 'Unlock all channels in the server (restores default permissions for @everyone)', inline: false },
                                { name: '/channel hideall', value: 'Hide all channels from the server (requires Manage Channels permission)', inline: false },
                                { name: '/channel unhideall', value: 'Unhide all channels from the server (requires Manage Channels permission)', inline: false }
                            )
                            .setColor('#4ecdc4');
                        break;

                    case 'emoji':
                        embed = new EmbedBuilder()
                            .setTitle('😀 Emoji Commands')
                            .setDescription('Commands for emoji management')
                            .addFields(
                                { name: '/emoji steal <emoji> [name]', value: 'Steal a custom emoji from another server (requires Manage Emojis permission)', inline: false },
                                { name: '/emoji info <emoji>', value: 'Get detailed information about a custom emoji', inline: false }
                            )
                            .setColor('#f7b801');
                        break;

                    case 'bot':
                        embed = new EmbedBuilder()
                            .setTitle('🤖 Bot Commands')
                            .setDescription('Commands for bot information and statistics')
                            .addFields(
                                { name: '/bot invite', value: 'Get the bot\'s invite link to add it to other servers', inline: false },
                                { name: '/bot stats', value: 'View detailed bot statistics including server count, users, and memory usage', inline: false },
                                { name: '/bot uptime', value: 'Check how long the bot has been running', inline: false },
                                { name: '/bot ping', value: 'Check bot latency and API response time', inline: false }
                            )
                            .setColor('#0084ff');
                        break;

                    case 'afk':
                        embed = new EmbedBuilder()
                            .setTitle('💤 AFK System')
                            .setDescription('Commands for AFK status management')
                            .addFields(
                                { name: '/afk [reason]', value: 'Set yourself as AFK with an optional reason. The bot will notify others when you\'re mentioned and track your mentions while away', inline: false },
                                { name: 'How it works:', value: '• Send any message to automatically remove your AFK status\n• Others will be notified when they mention you\n• You\'ll see a summary of mentions when you return', inline: false }
                            )
                            .setColor('#ff6b6b');
                        break;

                    case 'sticky':
                        embed = new EmbedBuilder()
                            .setTitle('📌 Sticky Messages')
                            .setDescription('Commands for sticky message management (requires Manage Messages permission)')
                            .addFields(
                                { name: '/stick <message>', value: 'Stick a message to the current channel. It will reappear after every new message', inline: false },
                                { name: '/stickstop', value: 'Stop the sticky message in the current channel (keeps it saved)', inline: false },
                                { name: '/stickstart', value: 'Restart a previously stopped sticky message', inline: false },
                                { name: '/stickremove', value: 'Completely remove the sticky message from the channel', inline: false },
                                { name: '/getstickies', value: 'View all active and stopped sticky messages in the server', inline: false }
                            )
                            .setColor('#95e1d3');
                        break;

                    case 'list':
                        embed = new EmbedBuilder()
                            .setTitle('📋 List Commands')
                            .setDescription('Commands for listing various server information')
                            .addFields(
                                { name: '/list bots', value: 'Display all bots in the server with pagination', inline: false },
                                { name: '/list activedeveloper', value: 'List all users with the Active Developer badge, sorted by account creation date', inline: false }
                            )
                            .setColor('#a8e6cf');
                        break;

                    case 'role':
                        embed = new EmbedBuilder()
                            .setTitle('👥 Role Commands')
                            .setDescription('Commands for role management (requires Manage Roles permission)')
                            .addFields(
                                { name: '/role info <role>', value: 'Display detailed information about a role including permissions, member count, creation date, and other properties.', inline: false },
                                { name: '/role all <role>', value: 'Assign a role to all members in the server. Both you and the bot need "Manage Roles" permission. The role must be lower than both your highest role and the bot\'s highest role.', inline: false },
                                { name: '/role removeall <role>', value: 'Remove a role from all members in the server. Both you and the bot need "Manage Roles" permission. The role must be lower than both your highest role and the bot\'s highest role.', inline: false },
                                { name: '/role add <role> <user>', value: 'Add a role to a specific user. Both you and the bot need "Manage Roles" permission. The role must be lower than both your highest role and the bot\'s highest role.', inline: false },
                                { name: '/role remove <role> <user>', value: 'Remove a role from a specific user. Both you and the bot need "Manage Roles" permission. The role must be lower than both your highest role and the bot\'s highest role.', inline: false },
                                { name: '/role name <role> <name>', value: 'Rename a role. Both you and the bot need "Manage Roles" permission. The role must be lower than both your highest role and the bot\'s highest role.', inline: false }
                            )
                            .setColor('#e74c3c');
                        break;

                    case 'avatar':
                        embed = new EmbedBuilder()
                            .setTitle('🖼️ Avatar Commands')
                            .setDescription('Commands for displaying user avatars')
                            .addFields(
                                { name: '/avatar [user]', value: 'Display a user\'s avatar in high quality. If no user is specified, shows your own avatar. Includes download link for full resolution.', inline: false }
                            )
                            .setColor('#9b59b6');
                        break;

                    default:
                        embed = new EmbedBuilder()
                            .setTitle('❌ Invalid Category')
                            .setDescription('That category doesn\'t exist. Use `/help` to see all available categories.')
                            .setColor('#ff0000');
                }

                embed.setTimestamp().setFooter({ text: 'Use /help to see all categories' });
                await interaction.reply({ embeds: [embed] });
            }
        }

    } catch (error) {
        console.error('Error executing command:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    }
});

// AFK System - Handle mentions and return messages
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const authorId = message.author.id;

    // Check if the message author is AFK and should be removed from AFK
    if (afkUsers.has(authorId)) {
        const afkData = afkUsers.get(authorId);
        const afkDuration = Date.now() - afkData.timestamp;

        // Calculate time components
        const days = Math.floor(afkDuration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((afkDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((afkDuration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((afkDuration % (1000 * 60)) / 1000);

        const mentionCount = afkData.mentions.length;

        const embed = new EmbedBuilder()
            .setTitle('Welcome Back!')
            .setDescription(`Welcome Back <@${authorId}>, You got **${mentionCount}** Mentions while You were AFK. I removed your AFK. You were AFK for **${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds**`)
            .setColor('#00ff00')
            .setTimestamp();

        // Remove user from AFK
        afkUsers.delete(authorId);

        await message.reply({ embeds: [embed] });
        return;
    }

    // Check for mentions of AFK users
    const mentions = message.mentions.users;
    if (mentions.size > 0) {
        mentions.forEach(async (mentionedUser) => {
            if (afkUsers.has(mentionedUser.id)) {
                const afkData = afkUsers.get(mentionedUser.id);

                // Add this mention to the user's mention list
                afkData.mentions.push({
                    author: message.author.tag,
                    content: message.content,
                    timestamp: Date.now(),
                    channel: message.channel.name
                });

                const afkDuration = Date.now() - afkData.timestamp;
                const days = Math.floor(afkDuration / (1000 * 60 * 60 * 24));
                const hours = Math.floor((afkDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((afkDuration % (1000 * 60 * 60)) / (1000 * 60));

                let timeString = '';
                if (days > 0) timeString += `${days}d `;
                if (hours > 0) timeString += `${hours}h `;
                if (minutes > 0) timeString += `${minutes}m`;
                if (!timeString) timeString = 'less than a minute';

                const embed = new EmbedBuilder()
                    .setTitle(`${mentionedUser.displayName} is AFK`)
                    .setDescription(`**Reason:** ${afkData.reason}\n**AFK for:** ${timeString.trim()}`)
                    .setColor('#ff6b6b')
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }
        });
    }

    // Handle sticky messages
    if (stickyMessages.has(channelId)) {
        const stickyData = stickyMessages.get(channelId);

        if (stickyData.active) {
            // Delete the previous sticky message
            try {
                const oldMsg = await message.channel.messages.fetch(stickyData.lastMessageId);
                await oldMsg.delete();
            } catch (error) {
                console.log('Could not delete old sticky message:', error);
            }

            // Send new sticky message after a short delay
            setTimeout(async () => {
                try {
                    const newStickyMsg = await message.channel.send(stickyData.message);
                    stickyData.lastMessageId = newStickyMsg.id;
                } catch (error) {
                    console.log('Could not send new sticky message:', error);
                }
            }, 1000); // 1 second delay
        }
    }
});

// Start the bot

client.login(token);