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
        console.log('Dusting off swear jar');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            {body: commands}
        );
        console.log('Swear jar has been placed!');
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
        const currentUser = interaction.options.getUser('user');
        const currentSwearCount = swearCounts[currentUser.id] || 0;

        await interaction.reply(
            `<@${currentUser.id}> broke the anti-swear law ${currentSwearCount} times.`
        );
    }
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const currentUser = message.author.id;
    const messageContent = message.content.toLowerCase();
    const messageSplitIntoWords = messageContent.split(/\s+/);

    let swearWordsPresentInMessage = false;

    for (let i = 0; i < messageSplitIntoWords.length; i++) {
        const containsSwearWord = filteredWords.some(swearWord => messageSplitIntoWords[i].includes(swearWord));

        if (containsSwearWord) {
            if (!swearCounts[currentUser]) {
                swearCounts[currentUser] = 1;
            } else {
                swearCounts[currentUser]++;
            }

            swearWordsPresentInMessage = true;
        }
    }

    if (swearWordsPresentInMessage) {
        const randomResponse = rangerResponses[Math.floor(Math.random() * rangerResponses.length)];
        message.reply(`${message.author} ` +  randomResponse);
    }
});

client.login();