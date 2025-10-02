// Function to parse a single battle log text
import { extractVehicleInfo, getVehicleIcon, getCountryFlag } from './assetManager';

export const parseBattleLog = (logText) => {
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
        // Enhanced vehicle information
        vehicles: [],
        vehicleIcons: {},
        countryFlags: {}
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
        // SL and RP are total for the section, not individual kills
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

    // Assistance
    const assistsMatch = logText.match(/Assistance in destroying the enemy\s+(\d+)\s+(\d+)\s+SL\s+(\d+)\s+RP/);
    if (assistsMatch) battle.assists = parseInt(assistsMatch[1], 10);
    const assistsSection = logText.split('Assistance in destroying the enemy')[1]?.split('Severe damage to the enemy')[0] || '';
    assistsSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(\d+:\d+)\s+(.+?)\s+(.+?)\s+(.+?)\s+(\d+)\s+mission points\s+(\d+)\s+SL\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedAssists.push({
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

    // Severe damage
    const severeDamageMatch = logText.match(/Severe damage to the enemy\s+(\d+)\s+(\d+)\s+SL\s+(\d+)\s+RP/);
    if (severeDamageMatch) battle.severeDamage = parseInt(severeDamageMatch[1], 10);
    const severeDamageSection = logText.split('Severe damage to the enemy')[1]?.split('Critical damage to the enemy')[0] || '';
    severeDamageSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(\d+:\d+)\s+(.+?)\s+(.+?)\s+(.+?)\s+(\d+)\s+mission points\s+(\d+)\s+SL\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedSevereDamage.push({
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

    // Critical damage
    const criticalDamageMatch = logText.match(/Critical damage to the enemy\s+(\d+)\s+(\d+)\s+SL\s+(\d+)\s+RP/);
    if (criticalDamageMatch) battle.criticalDamage = parseInt(criticalDamageMatch[1], 10);
    const criticalDamageSection = logText.split('Critical damage to the enemy')[1]?.split('Damage to the enemy')[0] || '';
    criticalDamageSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(\d+:\d+)\s+(.+?)\s+(.+?)\s+(.+?)\s+(\d+)\s+mission points\s+(\d+)\s+SL\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedCriticalDamage.push({
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

    // Damage
    const damageMatch = logText.match(/Damage to the enemy\s+(\d+)\s+(\d+)\s+SL\s+(\d+)\s+RP/);
    if (damageMatch) battle.damage = parseInt(damageMatch[1], 10);
    const damageSection = logText.split('Damage to the enemy')[1]?.split('Awards')[0] || '';
    damageSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(\d+:\d+)\s+(.+?)\s+(.+?)\s+(.+?)\s+(\d+)\s+mission points\s+(\d+)\s+SL\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedDamage.push({
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

    // Awards
    const awardsMatch = logText.match(/Awards\s+(\d+)\s+(\d+)\s+SL(?:\s+(\d+)\s+RP)?/); // Added optional RP capture
    if (awardsMatch) {
        battle.awardsSL = parseInt(awardsMatch[2], 10);
        if (awardsMatch[3]) battle.awardsRP = parseInt(awardsMatch[3], 10); // Capture RP if present
    }
    const awardsSection = logText.split('Awards')[1]?.split('Activity Time')[0] || '';
    awardsSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(\d+:\d+)\s+(.+?)\s+(\d+)\s+SL(?:\s+(\d+)\s+RP)?/); // Added optional RP capture
        if (detailMatch) {
            battle.detailedAwards.push({
                time: detailMatch[1],
                award: detailMatch[2].trim(),
                sl: parseInt(detailMatch[3], 10),
                rp: detailMatch[4] ? parseInt(detailMatch[4], 10) : 0 // Capture RP if present
            });
        }
    });

    // Activity Time
    const activityTimeMatch = logText.match(/Activity Time\s+(\d+)\s+SL\s+(\d+)\s+RP/);
    if (activityTimeMatch) {
        battle.activityTimeSL = parseInt(activityTimeMatch[1], 10);
        battle.activityTimeRP = parseInt(activityTimeMatch[2], 10);
    }
    const activityTimeSection = logText.split('Activity Time')[1]?.split('Time Played')[0] || '';
    activityTimeSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(.+?)\s+(\d+)\s+SL\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedActivityTime.push({
                vehicle: detailMatch[1].trim(),
                sl: parseInt(detailMatch[2], 10),
                rp: parseInt(detailMatch[3], 10)
            });
        }
    });

    // Time Played
    const timePlayedMatch = logText.match(/Time Played\s+(\d+:\d+)\s+(\d+)\s+RP/);
    if (timePlayedMatch) battle.timePlayedRP = parseInt(timePlayedMatch[2], 10);
    const timePlayedSection = logText.split('Time Played')[1]?.split('Reward for participating in the mission')[0] || '';
    timePlayedSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(.+?)\s+(\d+)%\s+(\d+:\d+)\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedTimePlayed.push({
                vehicle: detailMatch[1].trim(),
                percentage: parseInt(detailMatch[2], 10),
                time: detailMatch[3].trim(),
                rp: parseInt(detailMatch[4], 10)
            });
        }
    });

    // Reward for participating / Reward for winning
    const rewardParticipatingMatch = logText.match(/Reward for participating in the mission\s+(\d+)\s+SL/);
    const rewardWinningMatch = logText.match(/Reward for winning\s+(\d+)\s+SL/);
    if (rewardParticipatingMatch) battle.rewardSL = parseInt(rewardParticipatingMatch[1], 10);
    else if (rewardWinningMatch) battle.rewardSL = parseInt(rewardWinningMatch[1], 10);

    // Skill Bonus
    const skillBonusMatch = logText.match(/Skill Bonus\s+(\d+)\s+RP/);
    if (skillBonusMatch) battle.skillBonusRP = parseInt(skillBonusMatch[1], 10);
    const skillBonusSection = logText.split('Skill Bonus')[1]?.split('Earned:')[0] || '';
    skillBonusSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(.+?)\s+(.+?)\s+(\d+)\s+RP/);
        if (detailMatch) {
            battle.detailedSkillBonus.push({
                vehicle: detailMatch[1].trim(),
                type: detailMatch[2].trim(),
                rp: parseInt(detailMatch[3], 10)
            });
        }
    });

    // Earned, Activity, Damaged Vehicles, Costs, Researched, Progress, Session, Total
    const earnedMatch = logText.match(/Earned:\s+(\d+)\s+SL,\s+(\d+)\s+CRP/);
    if (earnedMatch) {
        battle.earnedSL = parseInt(earnedMatch[1], 10);
        battle.earnedCRP = parseInt(earnedMatch[2], 10);
    }

    const activityMatch = logText.match(/Activity:\s+(\d+)%/);
    if (activityMatch) battle.activity = parseInt(activityMatch[1], 10);

    const damagedVehiclesMatch = logText.match(/Damaged Vehicles:\s+(.+)/);
    if (damagedVehiclesMatch) {
        battle.damagedVehicles = damagedVehiclesMatch[1].split(',').map(v => v.trim());
    }

    const autoRepairMatch = logText.match(/Automatic repair of all vehicles:\s+(-?\d+)\s+SL/);
    if (autoRepairMatch) battle.autoRepairCost = parseInt(autoRepairMatch[1], 10);

    const autoAmmoCrewMatch = logText.match(/Automatic purchasing of ammo and "Crew Replenishment":\s+(-?\d+)\s+SL/);
    if (autoAmmoCrewMatch) battle.autoAmmoCrewCost = parseInt(autoAmmoCrewMatch[1], 10);

    const researchedUnitMatch = logText.match(/Researched unit:\s*\n\s*(.+?):\s*(\d+)\s+RP/);
    if (researchedUnitMatch) {
        battle.researchedUnits.push({
            unit: researchedUnitMatch[1].trim(),
            rp: parseInt(researchedUnitMatch[2], 10)
        });
    }

    const researchingProgressSection = logText.split('Researching progress:')[1]?.split('Session:')[0] || '';
    researchingProgressSection.split('\n').forEach(line => {
        const detailMatch = line.match(/^\s*(.+?)\s*-\s*(.+?):\s*(\d+)\s+RP/);
        if (detailMatch) {
            battle.researchingProgress.push({
                unit: detailMatch[1].trim(),
                item: detailMatch[2].trim(),
                rp: parseInt(detailMatch[3], 10)
            });
        }
    });

    const sessionMatch = logText.match(/Session:\s+(.+)/);
    if (sessionMatch) battle.session = sessionMatch[1].trim();

    const totalMatch = logText.match(/Total:\s+(\d+)\s+SL,\s+(\d+)\s+CRP,\s+(\d+)\s+RP/);
    if (totalMatch) {
        battle.totalSL = parseInt(totalMatch[1], 10);
        battle.totalCRP = parseInt(totalMatch[2], 10);
        battle.totalRP = parseInt(totalMatch[3], 10);
    }

    // Extract and enhance vehicle information
    battle.vehicles = extractVehiclesFromBattle(battle);
    battle.vehicleIcons = generateVehicleIcons(battle.vehicles);
    battle.countryFlags = generateCountryFlags(battle.vehicles);
    
    return battle;
};

// Extract all vehicles mentioned in the battle
const extractVehiclesFromBattle = (battle) => {
    const vehicles = new Set();
    
    // Extract from detailed kills
    battle.detailedKills.forEach(kill => {
        if (kill.vehicle) vehicles.add(kill.vehicle);
        if (kill.target) vehicles.add(kill.target);
    });
    
    // Extract from detailed assists
    battle.detailedAssists.forEach(assist => {
        if (assist.vehicle) vehicles.add(assist.vehicle);
        if (assist.target) vehicles.add(assist.target);
    });
    
    // Extract from detailed damage sections
    battle.detailedSevereDamage.forEach(damage => {
        if (damage.vehicle) vehicles.add(damage.vehicle);
        if (damage.target) vehicles.add(damage.target);
    });
    
    battle.detailedCriticalDamage.forEach(damage => {
        if (damage.vehicle) vehicles.add(damage.vehicle);
        if (damage.target) vehicles.add(damage.target);
    });
    
    battle.detailedDamage.forEach(damage => {
        if (damage.vehicle) vehicles.add(damage.vehicle);
        if (damage.target) vehicles.add(damage.target);
    });
    
    // Extract from activity time
    battle.detailedActivityTime.forEach(activity => {
        if (activity.vehicle) vehicles.add(activity.vehicle);
    });
    
    // Extract from time played
    battle.detailedTimePlayed.forEach(time => {
        if (time.vehicle) vehicles.add(time.vehicle);
    });
    
    // Extract from skill bonus
    battle.detailedSkillBonus.forEach(skill => {
        if (skill.vehicle) vehicles.add(skill.vehicle);
    });
    
    // Convert to array and enhance with vehicle info
    return Array.from(vehicles).map(vehicleName => {
        const vehicleInfo = extractVehicleInfo(vehicleName);
        return {
            name: vehicleName,
            ...vehicleInfo
        };
    });
};

// Generate vehicle icons for all vehicles in the battle
const generateVehicleIcons = (vehicles) => {
    const icons = {};
    vehicles.forEach(vehicle => {
        icons[vehicle.name] = {
            icon: getVehicleIcon(vehicle.name, vehicle.country, vehicle.rank, vehicle.type),
            info: vehicle
        };
    });
    return icons;
};

// Generate country flags for all countries in the battle
const generateCountryFlags = (vehicles) => {
    const countries = new Set(vehicles.map(v => v.country).filter(c => c));
    const flags = {};
    countries.forEach(country => {
        flags[country] = getCountryFlag(country);
    });
    return flags;
}; 