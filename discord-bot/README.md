# War Thunder Stats Discord Bot

A Discord bot that provides War Thunder statistics using slash commands and generates stat cards.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a Discord application:**
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to the "Bot" section and create a bot
   - Copy the bot token and client ID

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Fill in your Discord bot token and client ID
   - Set the API base URL (default: http://localhost:4000)

4. **Deploy slash commands:**
   ```bash
   node deploy-commands.js
   ```

5. **Start the bot:**
   ```bash
   npm start
   ```

## Commands

- `/stats <username>` - Get War Thunder stats for a player

## Development

Run in development mode with auto-restart:
```bash
npm run dev
```
