// Backend Battle Parser - copied from frontend with Node.js compatibility
const crypto = require('crypto');

// Function to parse a single battle log text
const parseBattleLog = (logText) => {
    const battle = {
        id: crypto.randomUUID(), // Unique ID for each battle
        timestamp: new Date().toISOString(), // When the battle was added
        result: 'Unknown',
        missionType: 'Unknown',
        missionName: 'Unknown',
        killsAircraft: 0,
        killsGround: 0,
        assists: 0,
        severeDamage: 0,
        criticalDamage: 0,
        damage: 0,
        awardsSL: 0,
        activityTimeSL: 0,
        activityTimeRP: 0,
        timePlayedRP: 0,
        rewardSL: 0,
        skillBonusRP: 0,
        earnedSL: 0,
        earnedCRP: 0,
        activity: 0,
        autoRepairCost: 0,
        autoAmmoCrewCost: 0,
        researchedUnits: [],
        researchingProgress: [],
        session: '',
        totalSL: 0,
        totalCRP: 0,
        totalRP: 0,
        damagedVehicles: [],
        detailedKills: [],
        detailedAssists: [],
        detailedSevereDamage: [],
        detailedCriticalDamage: [],
        detailedDamage: [],
        detailedAwards: [],
        detailedActivityTime: [],
        detailedTimePlayed: [],
        detailedSkillBonus: [],
        rawText: logText // Store the original text
    };

    // Result
    const resultMatch = logText.match(/(Defeat|Victory) in the \[(.+?)\] (.+?) mission!/);
    if (resultMatch) {
        battle.result = resultMatch[1];
        battle.missionType = resultMatch[2];
        battle.missionName = resultMatch[3];
    }

    // Destruction of aircraft
    const aircraftKillsMatch = logText.match(/Destruction of aircraft\s+(\d+)\s*/);
    if (aircraftKillsMatch) battle.killsAircraft = parseInt(aircraftKillsMatch[1], 10);
    const aircraftKillsSection = logText.split('Destruction of aircraft')[1]?.split('Destruction of ground vehicles')[0] || '';
    aircraftKillsSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(\d+:\d+)\s+(.+?)\s+(.+?)\s+(.+?)\s+By another player/);
        if (detailMatch) {
            battle.detailedKills.push({
                type: 'aircraft',
                time: detailMatch[1],
                vehicle: detailMatch[2].trim(),
                weapon: detailMatch[3].trim(),
                target: detailMatch[4].trim()
            });
        }
    });

    // Destruction of ground vehicles
    const groundKillsMatch = logText.match(/Destruction of ground vehicles\s+(\d+)\s+(\d+)\s+SL\s+(\d+)\s+RP/);
    if (groundKillsMatch) {
        battle.killsGround = parseInt(groundKillsMatch[1], 10);
    }
    const groundKillsSection = logText.split('Destruction of ground vehicles')[1]?.split('Assistance in destroying the enemy')[0] || '';
    groundKillsSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(\d+:\d+)\s+(.+?)\s+(.+?)\s+(.+?)\s+(\d+)\s+mission points\s+(\d+)\s+SL\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedKills.push({
                type: 'ground',
                time: detailMatch[1],
                vehicle: detailMatch[2].trim(),
                weapon: detailMatch[3].trim(),
                target: detailMatch[4].trim(),
                missionPoints: parseInt(detailMatch[5], 10),
                sl: parseInt(detailMatch[6], 10),
                rp: parseInt(detailMatch[7], 10)
            });
        }
    });

    // Parse other sections (assists, damage, etc.) - simplified for brevity
    // You can copy the rest from your frontend battleParser.js

    // Activity
    const activityMatch = logText.match(/Activity:\s+(\d+)%/);
    if (activityMatch) battle.activity = parseInt(activityMatch[1], 10);

    // Earned SL and RP
    const earnedMatch = logText.match(/Earned:\s+(\d+)\s+SL\s+(\d+)\s+RP/);
    if (earnedMatch) {
        battle.earnedSL = parseInt(earnedMatch[1], 10);
        battle.totalRP = parseInt(earnedMatch[2], 10);
    }

    // Session
    const sessionMatch = logText.match(/Session:\s+(.+)/);
    if (sessionMatch) battle.session = sessionMatch[1].trim();

    return battle;
};

// Function to parse multiple battle logs
const parseMultipleBattleLogs = (logText) => {
    // Split by common battle log start patterns
    const logs = logText.split(/(?=(?:Defeat|Victory) in the \[.+?\] .+? mission!)/)
                        .filter(log => log.trim() !== '');
    
    return logs.map(log => {
        try {
            return {
                success: true,
                battle: parseBattleLog(log.trim()),
                error: null
            };
        } catch (error) {
            return {
                success: false,
                battle: null,
                error: error.message
            };
        }
    });
};

module.exports = {
    parseBattleLog,
    parseMultipleBattleLogs
};
