require('dotenv').config();
const {Client, GatewayIntentBits, REST, Routes} = require('discord.js');

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]});

const commands = [
    {
        name: 'swearjar',
        description: 'Reports the number of times the specified user said a tasteless word!',
        options: [
            {
                name: 'user',
                type: 6,
                description: 'User to keep track of',
                required: false,
            }
        ]
    }
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

client.on('ready', async () => {
    console.log(`${client.user.tag} reporting for duty!`);

    try {
        console.log('Registering swear jar');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            {body: commands}
        );
        console.log('Swear jar registered!');
    } catch (error) {
        console.error('Error registering swear jar: ', error);
    }
});

const filteredWords = require('./filteredWords');
const rangerResponses = require('./rangerResponses');
const swearCounts = {};

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'swearjar') {
        const currentUser = interaction.options.getUser('user').id;
        const currentSwearCount = swearCounts[currentUser] || 0;

        await interaction.reply(
            `${currentUser.username} broke the anti-swear law ${currentSwearCount} times.`
        );
    }
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const currentUser = message.author.id;
    const messageContent = message.content.toLowerCase();
    const messageSplitIntoWords = messageContent.split(/\s+/);

    let swearWordsPresent = false;

    for (let i = 0; i < messageSplitIntoWords.length; i++) {
        if (filteredWords.includes(messageSplitIntoWords[i])) {
            if (!swearCounts[currentUser]) {
                swearCounts[currentUser] = 1;
            } else {
                swearCounts[currentUser]++;
            }

            if (i === 0) {
                swearWordsPresent = true;
            }
        }
    }

    if (swearWordsPresent) {
        const randomResponse = rangerResponses[Math.floor(Math.random() * rangerResponses.length)];
        message.reply(`${message.author} ` +  randomResponse);
    }
});

client.login();