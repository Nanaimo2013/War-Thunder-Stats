const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Fetches War Thunder stats for a user.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The username of the player to fetch stats for')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const username = interaction.options.getString('username');
        
        try {
            // You will need to implement this endpoint in your backend
            const response = await axios.get(`${process.env.API_BASE_URL}/api/users/search`, { params: { name: username } });
            const user = response.data;

            if (!user) {
                await interaction.editReply('User not found.');
                return;
            }
            
            // You can create a nice embed here with the user's stats
            await interaction.editReply(`Stats for ${user.name}:\nLevel: ${user.level}\nRank: ${user.rank}`);
        } catch (error) {
            console.error('Error fetching user stats:', error);
            await interaction.editReply('There was an error while fetching user stats.');
        }
    },
};
