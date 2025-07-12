// Function to calculate aggregated stats
export const calculateStats = (battles) => {
    const aggregated = {
        totalBattles: battles.length,
        totalKillsAircraft: 0,
        totalKillsGround: 0,
        totalAssists: 0,
        totalSevereDamage: 0,
        totalCriticalDamage: 0,
        totalDamage: 0,
        totalAwardsSL: 0,
        totalAwardsRP: 0, // New: Total Awards RP
        totalActivityTimeSL: 0,
        totalActivityTimeRP: 0,
        totalTimePlayedRP: 0,
        totalRewardSL: 0,
        totalSkillBonusRP: 0,
        totalEarnedSL: 0,
        totalEarnedCRP: 0,
        totalActivity: 0,
        totalAutoRepairCost: 0,
        totalAutoAmmoCrewCost: 0,
        totalResearchedRP: 0,
        totalResearchingProgressRP: 0,
        overallTotalSL: 0,
        overallTotalCRP: 0,
        overallTotalRP: 0,
        wins: 0,
        defeats: 0,
        vehiclesUsed: {}, // Tracks usage count for each vehicle
        topVehiclesKills: [],
        topVehiclesDamage: [],
        topAwards: {},
        averageActivity: 0,
        averageEarnedSL: 0,
        averageEarnedCRP: 0,
        averageTotalRP: 0,
        missionTypes: {},
        results: { Victory: 0, Defeat: 0, Unknown: 0 },
        missionNames: {} // New: track specific mission names
    };

    const vehicleKills = {};
    const vehicleDamage = {};
    const awardCounts = {};
    const vehicleTimePlayed = {}; // New: track time played per vehicle

    battles.forEach(battle => {
        if (battle.result === 'Victory') aggregated.wins++;
        else if (battle.result === 'Defeat') aggregated.defeats++;
        else aggregated.results.Unknown++;

        aggregated.missionTypes[battle.missionType] = (aggregated.missionTypes[battle.missionType] || 0) + 1;
        aggregated.missionNames[battle.missionName] = (aggregated.missionNames[battle.missionName] || 0) + 1;

        aggregated.totalKillsAircraft += battle.killsAircraft || 0;
        aggregated.totalKillsGround += battle.killsGround || 0;
        aggregated.totalAssists += battle.assists || 0;
        aggregated.totalSevereDamage += battle.severeDamage || 0;
        aggregated.totalCriticalDamage += battle.criticalDamage || 0;
        aggregated.totalDamage += battle.damage || 0;
        aggregated.totalAwardsSL += battle.awardsSL || 0;
        aggregated.totalAwardsRP += battle.awardsRP || 0; // Aggregate awards RP
        aggregated.totalActivityTimeSL += battle.activityTimeSL || 0;
        aggregated.totalActivityTimeRP += battle.activityTimeRP || 0;
        aggregated.totalTimePlayedRP += battle.timePlayedRP || 0;
        aggregated.totalRewardSL += battle.rewardSL || 0;
        aggregated.totalSkillBonusRP += battle.skillBonusRP || 0;
        aggregated.totalEarnedSL += battle.earnedSL || 0;
        aggregated.totalEarnedCRP += battle.earnedCRP || 0;
        aggregated.totalActivity += battle.activity || 0;
        aggregated.totalAutoRepairCost += battle.autoRepairCost || 0;
        aggregated.totalAutoAmmoCrewCost += battle.autoAmmoCrewCost || 0;
        aggregated.overallTotalSL += battle.totalSL || 0;
        aggregated.overallTotalCRP += battle.totalCRP || 0;
        aggregated.overallTotalRP += battle.totalRP || 0;

        // Research points
        battle.researchedUnits.forEach(unit => aggregated.totalResearchedRP += unit.rp);
        battle.researchingProgress.forEach(progress => aggregated.totalResearchingProgressRP += progress.rp);

        // Vehicle usage and kills/damage
        battle.detailedKills.forEach(kill => {
            vehicleKills[kill.vehicle] = (vehicleKills[kill.vehicle] || 0) + 1;
            aggregated.vehiclesUsed[kill.vehicle] = (aggregated.vehiclesUsed[kill.vehicle] || 0) + 1;
        });
        battle.detailedDamage.forEach(dmg => {
            vehicleDamage[dmg.vehicle] = (vehicleDamage[dmg.vehicle] || 0) + 1;
            aggregated.vehiclesUsed[dmg.vehicle] = (aggregated.vehiclesUsed[dmg.vehicle] || 0) + 1;
        });
        battle.detailedSevereDamage.forEach(dmg => {
            vehicleDamage[dmg.vehicle] = (vehicleDamage[dmg.vehicle] || 0) + 1;
            aggregated.vehiclesUsed[dmg.vehicle] = (aggregated.vehiclesUsed[dmg.vehicle] || 0) + 1;
        });
        battle.detailedCriticalDamage.forEach(dmg => {
            vehicleDamage[dmg.vehicle] = (vehicleDamage[dmg.vehicle] || 0) + 1;
            aggregated.vehiclesUsed[dmg.vehicle] = (aggregated.vehiclesUsed[dmg.vehicle] || 0) + 1;
        });
        battle.detailedAssists.forEach(assist => {
            aggregated.vehiclesUsed[assist.vehicle] = (aggregated.vehiclesUsed[assist.vehicle] || 0) + 1;
        });
        battle.detailedActivityTime.forEach(activity => {
            aggregated.vehiclesUsed[activity.vehicle] = (aggregated.vehiclesUsed[activity.vehicle] || 0) + 1;
        });
        battle.detailedTimePlayed.forEach(played => {
            aggregated.vehiclesUsed[played.vehicle] = (aggregated.vehiclesUsed[played.vehicle] || 0) + 1;
            // Convert "MM:SS" to seconds for total time played calculation
            const [minutes, seconds] = played.time.split(':').map(Number);
            vehicleTimePlayed[played.vehicle] = (vehicleTimePlayed[played.vehicle] || 0) + (minutes * 60 + seconds);
        });
        battle.detailedSkillBonus.forEach(skill => {
            aggregated.vehiclesUsed[skill.vehicle] = (aggregated.vehiclesUsed[skill.vehicle] || 0) + 1;
        });
        battle.damagedVehicles.forEach(vehicle => {
            aggregated.vehiclesUsed[vehicle] = (aggregated.vehiclesUsed[vehicle] || 0) + 1;
        });

        // Awards
        battle.detailedAwards.forEach(award => {
            awardCounts[award.award] = (awardCounts[award.award] || 0) + 1;
        });
    });

    // Calculate averages
    if (battles.length > 0) {
        aggregated.averageActivity = aggregated.totalActivity / battles.length;
        aggregated.averageEarnedSL = aggregated.totalEarnedSL / battles.length;
        aggregated.averageEarnedCRP = aggregated.totalEarnedCRP / battles.length;
        aggregated.averageTotalRP = aggregated.overallTotalRP / battles.length;
    }

    // Sort top vehicles by kills
    aggregated.topVehiclesKills = Object.entries(vehicleKills)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([vehicle, count]) => ({ vehicle, count }));

    // Sort top vehicles by damage (simple count of damage events)
    aggregated.topVehiclesDamage = Object.entries(vehicleDamage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([vehicle, count]) => ({ vehicle, count }));

    // Sort top awards
    aggregated.topAwards = Object.entries(awardCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([award, count]) => ({ award, count }));

    // Convert total seconds back to MM:SS for display if needed, or keep as seconds for charts
    aggregated.vehicleTimePlayed = Object.entries(vehicleTimePlayed)
        .sort(([, a], [, b]) => b - a)
        .map(([vehicle, seconds]) => ({
            vehicle,
            time: `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
            seconds: seconds
        }));

    return aggregated;
}; 