# War Thunder Stats Tracker

A comprehensive React application for tracking and analyzing War Thunder battle statistics. This tool allows players to parse battle logs, view detailed statistics, compare performance with other players, and manage their gaming data locally.

## Features

- **Battle Log Parsing**: Automatically parse War Thunder battle logs and extract detailed statistics
- **User Profile Management**: Create and manage multiple player profiles with custom information
- **Comprehensive Statistics**: View detailed combat, economic, and research statistics
- **Visual Analytics**: Interactive charts and graphs using Recharts
- **Player Comparison**: Compare stats between different players
- **Leaderboard**: Track performance across multiple users
- **Data Export/Import**: Backup and restore your data locally
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** - Frontend framework
- **Recharts** - Chart library for data visualization
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first CSS framework
- **Session Storage** - Local data persistence

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/war-thunder-stats-tracker.git
cd war-thunder-stats-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### Setting Up User Profiles
1. Navigate to the "Data Management" page
2. Create a new user profile with your details
3. Add your Gaijin ID, level, rank, and other information

### Adding Battle Data
1. Copy your War Thunder battle log from the game
2. Paste it into the battle data input field
3. The system will automatically parse and preview the data
4. Confirm to add the battles to your profile

### Viewing Statistics
- **Overview**: General statistics and win/loss ratio
- **Combat**: Detailed combat performance metrics
- **Economy**: Financial statistics and earnings
- **Research**: Research progress and points
- **Vehicles**: Vehicle usage and performance
- **Missions**: Mission type and name statistics

### Data Management
- Export your data as a JSON file for backup
- Import previously exported data to restore your statistics
- All data is stored locally in your browser's session storage

## Project Structure

```
war-thunder-stats-tracker/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Application-specific styles
│   ├── index.js        # Application entry point
│   └── index.css       # Global styles and Tailwind imports
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
└── README.md          # Project documentation
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Data Privacy

All data is stored locally in your browser's session storage. No data is sent to external servers or stored in the cloud. Your battle statistics remain private and under your control.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This is an unofficial fan-made tool and is not affiliated with, endorsed, or sponsored by Gaijin Entertainment. War Thunder and its associated logos are trademarks of Gaijin Entertainment. 