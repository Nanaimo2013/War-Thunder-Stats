import React, { useState, useMemo } from 'react';
import { BarChart2, Map, TrendingUp, Target, Award, Clock, DollarSign, Zap, Users, Calendar } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import { calculateStats } from '../utils/statsCalculator';

const StatsPage = ({ users, selectedUserId, setSelectedUserId, stats, battles }) => {
    const currentUser = users.find(u => u.id === selectedUserId);
    const [statsTab, setStatsTab] = useState('overview'); // 'overview', 'combat', 'economy', 'research', 'vehicles', 'missions', 'maps', 'modes', 'performance'

    // Enhanced data processing with useMemo for better performance
    const enhancedStats = useMemo(() => {
        if (!battles || battles.length === 0) return stats;

        // Calculate additional statistics
        const recentBattles = battles.slice(-10); // Last 10 battles
        const recentStats = calculateStats(recentBattles);
        
        // Calculate win rate trends
        const winRateTrend = battles.length >= 10 ? 
            (recentStats.wins / recentBattles.length) - (stats.wins / stats.totalBattles) : 0;

        // Calculate performance metrics - use damaged vehicles count instead of deaths
        const totalDamagedVehicles = battles.reduce((total, battle) => total + (battle.damagedVehicles?.length || 0), 0);
        const kdr = (stats.totalKillsAircraft + stats.totalKillsGround) / Math.max(totalDamagedVehicles, 1);
        const avgSLPerBattle = stats.totalEarnedSL / Math.max(stats.totalBattles, 1);
        const avgRPPerBattle = stats.overallTotalRP / Math.max(stats.totalBattles, 1);

        // Map and mode analysis
        const mapStats = {};
        const modeStats = {};
        const timeStats = {};

        battles.forEach(battle => {
            // Map statistics
            const mapName = battle.missionName || 'Unknown';
            if (!mapStats[mapName]) {
                mapStats[mapName] = {
                    battles: 0, wins: 0, kills: 0, earnedSL: 0, earnedRP: 0
                };
            }
            mapStats[mapName].battles++;
            if (battle.result === 'Victory') mapStats[mapName].wins++;
            mapStats[mapName].kills += (battle.killsAircraft || 0) + (battle.killsGround || 0);
            mapStats[mapName].earnedSL += battle.earnedSL || 0;
            mapStats[mapName].earnedRP += battle.totalRP || 0;

            // Mode statistics
            const modeName = battle.missionType || 'Unknown';
            if (!modeStats[modeName]) {
                modeStats[modeName] = {
                    battles: 0, wins: 0, kills: 0, earnedSL: 0, earnedRP: 0
                };
            }
            modeStats[modeName].battles++;
            if (battle.result === 'Victory') modeStats[modeName].wins++;
            modeStats[modeName].kills += (battle.killsAircraft || 0) + (battle.killsGround || 0);
            modeStats[modeName].earnedSL += battle.earnedSL || 0;
            modeStats[modeName].earnedRP += battle.totalRP || 0;

            // Time-based statistics (if timestamp is available)
            if (battle.timestamp) {
                const date = new Date(battle.timestamp);
                const hour = date.getHours();
                const dayOfWeek = date.getDay();
                
                if (!timeStats[hour]) timeStats[hour] = { battles: 0, wins: 0 };
                timeStats[hour].battles++;
                if (battle.result === 'Victory') timeStats[hour].wins++;
            }
        });

        return {
            ...stats,
            winRateTrend,
            kdr,
            avgSLPerBattle,
            avgRPPerBattle,
            totalDamagedVehicles,
            mapStats,
            modeStats,
            timeStats,
            recentStats
        };
    }, [stats, battles]);

    const pieChartData = [
        { name: 'Victories', value: enhancedStats.wins || 0 },
        { name: 'Defeats', value: enhancedStats.defeats || 0 },
        { name: 'Unknown', value: enhancedStats.results?.Unknown || 0 }
    ];
    const PIE_COLORS = ['#4CAF50', '#F44336', '#9E9E9E']; // Green for win, Red for loss, Grey for unknown

    const combatData = [
        { name: 'Aircraft Kills', value: enhancedStats.totalKillsAircraft || 0 },
        { name: 'Ground Kills', value: enhancedStats.totalKillsGround || 0 },
        { name: 'Assists', value: enhancedStats.totalAssists || 0 },
        { name: 'Severe Damage', value: enhancedStats.totalSevereDamage || 0 },
        { name: 'Critical Damage', value: enhancedStats.totalCriticalDamage || 0 },
        { name: 'Total Damage Events', value: enhancedStats.totalDamage || 0 },
    ];

    const economyData = [
        { name: 'Earned SL', value: enhancedStats.totalEarnedSL || 0 },
        { name: 'Earned CRP', value: enhancedStats.totalEarnedCRP || 0 },
        { name: 'Overall SL', value: enhancedStats.overallTotalSL || 0 },
        { name: 'Overall RP', value: enhancedStats.overallTotalRP || 0 },
        { name: 'Awards SL', value: enhancedStats.totalAwardsSL || 0 },
        { name: 'Awards RP', value: enhancedStats.totalAwardsRP || 0 },
        { name: 'Activity Time SL', value: enhancedStats.totalActivityTimeSL || 0 },
        { name: 'Activity Time RP', value: enhancedStats.totalActivityTimeRP || 0 },
        { name: 'Reward SL', value: enhancedStats.totalRewardSL || 0 },
        { name: 'Auto Repair Cost', value: Math.abs(enhancedStats.totalAutoRepairCost || 0) },
        { name: 'Ammo/Crew Cost', value: Math.abs(enhancedStats.totalAutoAmmoCrewCost || 0) },
    ];

    const researchData = [
        { name: 'Researched RP', value: enhancedStats.totalResearchedRP || 0 },
        { name: 'Researching Progress RP', value: enhancedStats.totalResearchingProgressRP || 0 },
        { name: 'Skill Bonus RP', value: enhancedStats.totalSkillBonusRP || 0 },
    ];

    const missionTypeData = Object.entries(enhancedStats.missionTypes || {}).map(([name, value]) => ({ name, value }));
    const missionNameData = Object.entries(enhancedStats.missionNames || {}).map(([name, value]) => ({ name, value }));

    // New data arrays for enhanced features
    const performanceData = [
        { name: 'K/D Ratio', value: enhancedStats.kdr || 0 },
        { name: 'Win Rate', value: (enhancedStats.wins / Math.max(enhancedStats.totalBattles, 1)) * 100 },
        { name: 'Avg SL/Battle', value: enhancedStats.avgSLPerBattle || 0 },
        { name: 'Avg RP/Battle', value: enhancedStats.avgRPPerBattle || 0 },
        { name: 'Activity %', value: enhancedStats.averageActivity || 0 },
    ];

    const mapData = Object.entries(enhancedStats.mapStats || {}).map(([name, data]) => ({
        name,
        battles: data.battles,
        winRate: (data.wins / data.battles) * 100,
        avgKills: data.kills / data.battles,
        avgSL: data.earnedSL / data.battles,
        avgRP: data.earnedRP / data.battles
    })).sort((a, b) => b.battles - a.battles).slice(0, 10);

    const modeData = Object.entries(enhancedStats.modeStats || {}).map(([name, data]) => ({
        name,
        battles: data.battles,
        winRate: (data.wins / data.battles) * 100,
        avgKills: data.kills / data.battles,
        avgSL: data.earnedSL / data.battles,
        avgRP: data.earnedRP / data.battles
    })).sort((a, b) => b.battles - a.battles);

    const timeData = Object.entries(enhancedStats.timeStats || {}).map(([hour, data]) => ({
        hour: `${hour}:00`,
        battles: data.battles,
        winRate: (data.wins / data.battles) * 100
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return (
        <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-xl shadow-lg mb-8 text-gray-100 border-2 border-gray-700 animate-fade-in">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <BarChart2 size={24} /> <span>Player Stats Overview</span>
            </h2>

            <div className="mb-6">
                <label htmlFor="user-select-stats" className="block text-gray-300 text-sm font-bold mb-2">
                    Select User to View Stats:
                </label>
                <select
                    id="user-select-stats"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                >
                    <option value="">-- Select a user --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </div>

            {currentUser && (
                <div className="mb-6 bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                    <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center space-x-2">
                        <Users size={24} /> <span>Player Profile: {currentUser.name}</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Basic Info */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <h4 className="font-semibold text-lg text-yellow-300 mb-3 flex items-center space-x-2">
                                <Users size={18} /> <span>Basic Information</span>
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-400">Title:</span> <span className="text-gray-200">{currentUser.title || 'N/A'}</span></p>
                                <p><span className="text-gray-400">Level:</span> <span className="text-gray-200">{currentUser.level || 'N/A'}</span></p>
                                <p><span className="text-gray-400">Gaijin ID:</span> <span className="text-gray-200">{currentUser.gaijinId || 'N/A'}</span></p>
                                <p><span className="text-gray-400">Rank:</span> <span className="text-gray-200">{currentUser.rank || 'N/A'}</span></p>
                                <p><span className="text-gray-400">Favorite Vehicle:</span> <span className="text-gray-200">{currentUser.favoriteVehicle || 'N/A'}</span></p>
                                <p><span className="text-gray-400">Squadron:</span> <span className="text-gray-200">{currentUser.squadron || 'N/A'}</span></p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <h4 className="font-semibold text-lg text-yellow-300 mb-3 flex items-center space-x-2">
                                <BarChart2 size={18} /> <span>Quick Stats</span>
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-400">Total Battles:</span> <span className="text-gray-200 font-semibold">{enhancedStats.totalBattles || 0}</span></p>
                                <p><span className="text-gray-400">Win Rate:</span> <span className="text-gray-200 font-semibold">{((enhancedStats.wins / Math.max(enhancedStats.totalBattles, 1)) * 100).toFixed(1)}%</span></p>
                                <p><span className="text-gray-400">K/D Ratio:</span> <span className="text-gray-200 font-semibold">{enhancedStats.kdr?.toFixed(2) || '0.00'}</span></p>
                                <p><span className="text-gray-400">Total Kills:</span> <span className="text-gray-200 font-semibold">{(enhancedStats.totalKillsAircraft || 0) + (enhancedStats.totalKillsGround || 0)}</span></p>
                                <p><span className="text-gray-400">Total SL Earned:</span> <span className="text-gray-200 font-semibold">{(enhancedStats.totalEarnedSL || 0).toLocaleString()}</span></p>
                                <p><span className="text-gray-400">Total RP Earned:</span> <span className="text-gray-200 font-semibold">{(enhancedStats.overallTotalRP || 0).toLocaleString()}</span></p>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <h4 className="font-semibold text-lg text-yellow-300 mb-3 flex items-center space-x-2">
                                <TrendingUp size={18} /> <span>Performance</span>
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-400">Avg Activity:</span> <span className="text-gray-200 font-semibold">{enhancedStats.averageActivity?.toFixed(1) || '0.0'}%</span></p>
                                <p><span className="text-gray-400">Avg SL/Battle:</span> <span className="text-gray-200 font-semibold">{(enhancedStats.avgSLPerBattle || 0).toLocaleString()}</span></p>
                                <p><span className="text-gray-400">Avg RP/Battle:</span> <span className="text-gray-200 font-semibold">{(enhancedStats.avgRPPerBattle || 0).toLocaleString()}</span></p>
                                <p><span className="text-gray-400">Total Assists:</span> <span className="text-gray-200 font-semibold">{enhancedStats.totalAssists || 0}</span></p>
                                <p><span className="text-gray-400">Total Damage Events:</span> <span className="text-gray-200 font-semibold">{enhancedStats.totalDamage || 0}</span></p>
                                <p><span className="text-gray-400">Vehicles Used:</span> <span className="text-gray-200 font-semibold">{Object.keys(enhancedStats.vehiclesUsed || {}).length}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Performance Trend */}
                    {enhancedStats.recentStats && enhancedStats.totalBattles >= 10 && (
                        <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-600">
                            <h4 className="font-semibold text-lg text-yellow-300 mb-3 flex items-center space-x-2">
                                <TrendingUp size={18} /> <span>Recent Performance (Last 10 Battles)</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div className="text-center">
                                    <p className="text-gray-400">Recent Win Rate</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        {((enhancedStats.recentStats.wins / 10) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400">Recent K/D</p>
                                    <p className="text-2xl font-bold text-blue-400">
                                        {((enhancedStats.recentStats.totalKillsAircraft + enhancedStats.recentStats.totalKillsGround) / 10).toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400">Recent Avg SL</p>
                                    <p className="text-2xl font-bold text-yellow-400">
                                        {(enhancedStats.recentStats.totalEarnedSL / 10).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400">Recent Avg RP</p>
                                    <p className="text-2xl font-bold text-purple-400">
                                        {(enhancedStats.recentStats.overallTotalRP / 10).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedUserId && Object.keys(stats).length > 0 ? (
                <>
                    <div className="w-full overflow-x-auto mb-6">
                        <div className="flex space-x-2 min-w-[700px]">
                            <button onClick={() => setStatsTab('overview')} className={`flex items-center space-x-1 px-4 py-2 rounded-xl font-semibold transition duration-300 text-sm shadow-md border-2 ${statsTab === 'overview' ? 'bg-yellow-500 text-gray-900 border-yellow-400' : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'}`}><BarChart2 size={16} /><span>Overview</span></button>
                            <button onClick={() => setStatsTab('combat')} className={`flex items-center space-x-1 px-4 py-2 rounded-xl font-semibold transition duration-300 text-sm shadow-md border-2 ${statsTab === 'combat' ? 'bg-red-500 text-gray-900 border-red-400' : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'}`}><Target size={16} /><span>Combat</span></button>
                            <button onClick={() => setStatsTab('economy')} className={`flex items-center space-x-1 px-4 py-2 rounded-xl font-semibold transition duration-300 text-sm shadow-md border-2 ${statsTab === 'economy' ? 'bg-yellow-400 text-gray-900 border-yellow-300' : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'}`}><DollarSign size={16} /><span>Economy</span></button>
                            <button onClick={() => setStatsTab('research')} className={`flex items-center space-x-1 px-4 py-2 rounded-xl font-semibold transition duration-300 text-sm shadow-md border-2 ${statsTab === 'research' ? 'bg-purple-500 text-gray-900 border-purple-400' : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'}`}><Zap size={16} /><span>Research</span></button>
                            <button onClick={() => setStatsTab('vehicles')} className={`flex items-center space-x-1 px-4 py-2 rounded-xl font-semibold transition duration-300 text-sm shadow-md border-2 ${statsTab === 'vehicles' ? 'bg-pink-500 text-gray-900 border-pink-400' : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'}`}><Users size={16} /><span>Vehicles</span></button>
                            <button onClick={() => setStatsTab('maps-modes')} className={`flex items-center space-x-1 px-4 py-2 rounded-xl font-semibold transition duration-300 text-sm shadow-md border-2 ${statsTab === 'maps-modes' ? 'bg-blue-500 text-gray-900 border-blue-400' : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'}`}><Map size={16} /><span>Maps & Modes</span></button>
                            <button onClick={() => setStatsTab('performance')} className={`flex items-center space-x-1 px-4 py-2 rounded-xl font-semibold transition duration-300 text-sm shadow-md border-2 ${statsTab === 'performance' ? 'bg-indigo-500 text-gray-900 border-indigo-400' : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'}`}><TrendingUp size={16} /><span>Performance</span></button>
                        </div>
                    </div>

                    {statsTab === 'overview' && (
                        <>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center space-x-2">
                                <BarChart2 size={24} /> <span>Comprehensive Overview</span>
                            </h3>
                            
                            {/* Wide, Compact KPI Grid */}
                            <div className="w-full overflow-x-auto mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[900px]">
                                    {/* General/Performance */}
                                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-xl shadow-lg border border-green-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <TrendingUp size={20} className="text-green-200" />
                                            <span className="text-green-100 text-xs">Win Rate</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{((enhancedStats.wins / Math.max(enhancedStats.totalBattles, 1)) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg border border-blue-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Target size={20} className="text-blue-200" />
                                            <span className="text-blue-100 text-xs">K/D Ratio</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{enhancedStats.kdr?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {/* Combat */}
                                    <div className="bg-gradient-to-br from-red-600 to-red-700 p-3 rounded-xl shadow-lg border border-red-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <PieChart size={20} className="text-red-200" />
                                            <span className="text-red-100 text-xs">Total Kills</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{(enhancedStats.totalKillsAircraft || 0) + (enhancedStats.totalKillsGround || 0)}</span>
                                    </div>
                                    {/* Economy */}
                                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-3 rounded-xl shadow-lg border border-yellow-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <DollarSign size={20} className="text-yellow-200" />
                                            <span className="text-yellow-100 text-xs">Total SL</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{(enhancedStats.totalEarnedSL || 0).toLocaleString()}</span>
                                    </div>
                                    {/* Research */}
                                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-3 rounded-xl shadow-lg border border-purple-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Zap size={20} className="text-purple-200" />
                                            <span className="text-purple-100 text-xs">Total RP</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{(enhancedStats.overallTotalRP || 0).toLocaleString()}</span>
                                    </div>
                                    {/* Vehicles */}
                                    <div className="bg-gradient-to-br from-pink-600 to-pink-700 p-3 rounded-xl shadow-lg border border-pink-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Users size={20} className="text-pink-200" />
                                            <span className="text-pink-100 text-xs">Vehicles Used</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{Object.keys(enhancedStats.vehiclesUsed || {}).length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Statistics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h3 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <Target size={20} /> <span>Combat Stats</span>
                                    </h3>
                                    <p>Total Battles: <span className="font-medium text-gray-200">{enhancedStats.totalBattles}</span></p>
                                    <p>Wins: <span className="font-medium text-gray-200">{enhancedStats.wins}</span></p>
                                    <p>Defeats: <span className="font-medium text-gray-200">{enhancedStats.defeats}</span></p>
                                    <p>Total Kills: <span className="font-medium text-gray-200">{(enhancedStats.totalKillsAircraft || 0) + (enhancedStats.totalKillsGround || 0)}</span></p>
                                    <p>Total Assists: <span className="font-medium text-gray-200">{enhancedStats.totalAssists}</span></p>
                                    <p>Deaths (Damaged Vehicles): <span className="font-medium text-gray-200">{enhancedStats.totalDamagedVehicles || 0}</span></p>
                                    <p>Avg. Activity: <span className="font-medium text-gray-200">{enhancedStats.averageActivity?.toFixed(2) || '0.00'}%</span></p>
                                </div>
                                
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <DollarSign size={20} /> <span>Economy Stats</span>
                                    </h4>
                                    <p>Total Earned SL: <span className="font-medium text-gray-200">{enhancedStats.totalEarnedSL?.toLocaleString()}</span></p>
                                    <p>Total Earned RP: <span className="font-medium text-gray-200">{enhancedStats.overallTotalRP?.toLocaleString()}</span></p>
                                    <p>Total Awards SL: <span className="font-medium text-gray-200">{enhancedStats.totalAwardsSL?.toLocaleString()}</span></p>
                                    <p>Total Awards RP: <span className="font-medium text-gray-200">{enhancedStats.totalAwardsRP?.toLocaleString()}</span></p>
                                    <p>Repair Costs: <span className="font-medium text-gray-200">{Math.abs(enhancedStats.totalAutoRepairCost || 0).toLocaleString()}</span></p>
                                    <p>Net Profit: <span className="font-medium text-gray-200">{(enhancedStats.totalEarnedSL + enhancedStats.totalAwardsSL + Math.abs(enhancedStats.totalAutoRepairCost || 0)).toLocaleString()}</span></p>
                                </div>
                                
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <BarChart2 size={20} /> <span>Win/Loss Distribution</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Performance Radar Chart */}
                            <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700 mb-6">
                                <h4 className="font-semibold text-lg text-yellow-300 mb-4 flex items-center space-x-2">
                                    <TrendingUp size={20} /> <span>Performance Overview</span>
                                </h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={performanceData}>
                                        <PolarGrid stroke="#555" />
                                        <PolarAngleAxis dataKey="name" stroke="#ccc" />
                                        <PolarRadiusAxis stroke="#555" />
                                        <Radar
                                            name="Performance"
                                            dataKey="value"
                                            stroke="#8884d8"
                                            fill="#8884d8"
                                            fillOpacity={0.3}
                                        />
                                        <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {statsTab === 'combat' && (
                        <>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center space-x-2">
                                <Target size={24} /> <span>Combat Statistics</span>
                            </h3>
                            
                            {/* Combat KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-xl shadow-lg border border-red-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-100 text-sm">Total Kills</p>
                                            <p className="text-white text-2xl font-bold">
                                                {(enhancedStats.totalKillsAircraft || 0) + (enhancedStats.totalKillsGround || 0)}
                                            </p>
                                        </div>
                                        <Target size={24} className="text-red-200" />
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg border border-blue-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">K/D Ratio</p>
                                            <p className="text-white text-2xl font-bold">
                                                {enhancedStats.kdr?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <TrendingUp size={24} className="text-blue-200" />
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-xl shadow-lg border border-green-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">Total Assists</p>
                                            <p className="text-white text-2xl font-bold">
                                                {enhancedStats.totalAssists || 0}
                                            </p>
                                        </div>
                                        <Users size={24} className="text-green-200" />
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-xl shadow-lg border border-purple-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100 text-sm">Damage Events</p>
                                            <p className="text-white text-2xl font-bold">
                                                {enhancedStats.totalDamage || 0}
                                            </p>
                                        </div>
                                        <Zap size={24} className="text-purple-200" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <Target size={20} /> <span>Combat Overview</span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400">Aircraft Kills:</p>
                                            <p className="text-gray-200 font-semibold">{enhancedStats.totalKillsAircraft || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Ground Kills:</p>
                                            <p className="text-gray-200 font-semibold">{enhancedStats.totalKillsGround || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Assists:</p>
                                            <p className="text-gray-200 font-semibold">{enhancedStats.totalAssists || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Severe Damage:</p>
                                            <p className="text-gray-200 font-semibold">{enhancedStats.totalSevereDamage || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Critical Damage:</p>
                                            <p className="text-gray-200 font-semibold">{enhancedStats.totalCriticalDamage || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Total Damage:</p>
                                            <p className="text-gray-200 font-semibold">{enhancedStats.totalDamage || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Deaths (Damaged Vehicles):</p>
                                            <p className="text-gray-200 font-semibold">{enhancedStats.totalDamagedVehicles || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <BarChart2 size={20} /> <span>Combat Performance Graph</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={combatData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="name" stroke="#ccc" />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Bar dataKey="value" fill="#8884d8" name="Count" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Kill Distribution Chart */}
                            <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700 mb-6">
                                <h4 className="font-semibold text-lg text-yellow-300 mb-4 flex items-center space-x-2">
                                    <PieChart size={20} /> <span>Kill Type Distribution</span>
                                </h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Aircraft Kills', value: enhancedStats.totalKillsAircraft || 0 },
                                                { name: 'Ground Kills', value: enhancedStats.totalKillsGround || 0 }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            <Cell fill="#4CAF50" />
                                            <Cell fill="#FF9800" />
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {statsTab === 'economy' && (
                        <>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center space-x-2">
                                <DollarSign size={24} /> <span>Economy Statistics</span>
                            </h3>
                            
                            {/* Economy KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-xl shadow-lg border border-green-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">Total SL Earned</p>
                                            <p className="text-white text-2xl font-bold">
                                                {(enhancedStats.totalEarnedSL || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <DollarSign size={24} className="text-green-200" />
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg border border-blue-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">Total RP Earned</p>
                                            <p className="text-white text-2xl font-bold">
                                                {(enhancedStats.overallTotalRP || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <Zap size={24} className="text-blue-200" />
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-4 rounded-xl shadow-lg border border-yellow-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-yellow-100 text-sm">Avg SL/Battle</p>
                                            <p className="text-white text-2xl font-bold">
                                                {(enhancedStats.avgSLPerBattle || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <TrendingUp size={24} className="text-yellow-200" />
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-xl shadow-lg border border-red-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-100 text-sm">Total Costs</p>
                                            <p className="text-white text-2xl font-bold">
                                                {Math.abs((enhancedStats.totalAutoRepairCost || 0) + (enhancedStats.totalAutoAmmoCrewCost || 0)).toLocaleString()}
                                            </p>
                                        </div>
                                        <Target size={24} className="text-red-200" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <DollarSign size={20} /> <span>Financial Overview</span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400">Total Earned SL:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.totalEarnedSL || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Total Earned CRP:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.totalEarnedCRP || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Overall Total SL:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.overallTotalSL || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Overall Total RP:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.overallTotalRP || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Total Awards SL:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.totalAwardsSL || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Total Awards RP:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.totalAwardsRP || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Activity Time SL:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.totalActivityTimeSL || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Activity Time RP:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.totalActivityTimeRP || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Total Reward SL:</p>
                                            <p className="text-gray-200 font-semibold">{(enhancedStats.totalRewardSL || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Repair Costs:</p>
                                            <p className="text-gray-200 font-semibold">{Math.abs(enhancedStats.totalAutoRepairCost || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Ammo/Crew Costs:</p>
                                            <p className="text-gray-200 font-semibold">{Math.abs(enhancedStats.totalAutoAmmoCrewCost || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Net Profit:</p>
                                            <p className="text-gray-200 font-semibold text-green-400">
                                                {((enhancedStats.totalEarnedSL || 0) + (enhancedStats.totalAwardsSL || 0) + Math.abs(enhancedStats.totalAutoRepairCost || 0)).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <BarChart2 size={20} /> <span>Economy Graph (SL/CRP)</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={economyData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="name" stroke="#ccc" />
                                            <YAxis stroke="#ccc" formatter={(value) => value.toLocaleString()} />
                                            <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Bar dataKey="value" fill="#82ca9d" name="Amount" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Income vs Expenses Chart */}
                            <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700 mb-6">
                                <h4 className="font-semibold text-lg text-yellow-300 mb-4 flex items-center space-x-2">
                                    <PieChart size={20} /> <span>Income vs Expenses Distribution</span>
                                </h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Earned SL', value: enhancedStats.totalEarnedSL || 0 },
                                                { name: 'Awards SL', value: enhancedStats.totalAwardsSL || 0 },
                                                { name: 'Repair Costs', value: Math.abs(enhancedStats.totalAutoRepairCost || 0) },
                                                { name: 'Ammo/Crew Costs', value: Math.abs(enhancedStats.totalAutoAmmoCrewCost || 0) }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            <Cell fill="#4CAF50" />
                                            <Cell fill="#2196F3" />
                                            <Cell fill="#FF5722" />
                                            <Cell fill="#FF9800" />
                                        </Pie>
                                        <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {statsTab === 'research' && (
                        <>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Research Statistics</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2">Research Overview</h4>
                                    <p>Total Researched RP: <span className="font-medium text-gray-200">{stats.totalResearchedRP.toLocaleString()}</span></p>
                                    <p>Total Researching Progress RP: <span className="font-medium text-gray-200">{stats.totalResearchingProgressRP.toLocaleString()}</span></p>
                                    <p>Total Skill Bonus RP: <span className="font-medium text-gray-200">{stats.totalSkillBonusRP.toLocaleString()}</span></p>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2">Research Points Graph</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={researchData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="name" stroke="#ccc" />
                                            <YAxis stroke="#ccc" formatter={(value) => value.toLocaleString()} />
                                            <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Bar dataKey="value" fill="#ffc658" name="RP" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {statsTab === 'vehicles' && (
                        <>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Vehicle Statistics</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2">Top Vehicles (Kills)</h4>
                                    {stats.topVehiclesKills.length > 0 ? (
                                        <ul className="list-disc list-inside text-gray-200">
                                            {stats.topVehiclesKills.map((item, index) => (
                                                <li key={index}>{item.vehicle}: {item.count} kills</li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-gray-400">No data</p>}
                                </div>
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2">Top Vehicles (Damage Events)</h4>
                                    {stats.topVehiclesDamage.length > 0 ? (
                                        <ul className="list-disc list-inside text-gray-200">
                                            {stats.topVehiclesDamage.map((item, index) => (
                                                <li key={index}>{item.vehicle}: {item.count} damage events</li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-gray-400">No data</p>}
                                </div>
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700 col-span-full">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2">Time Played Per Vehicle</h4>
                                    {stats.vehicleTimePlayed && stats.vehicleTimePlayed.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart
                                                data={stats.vehicleTimePlayed}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                                <XAxis dataKey="vehicle" stroke="#ccc" angle={-45} textAnchor="end" height={80} />
                                                <YAxis stroke="#ccc" formatter={(value) => `${Math.floor(value / 60)}m ${value % 60}s`} />
                                                <Tooltip formatter={(value) => `${Math.floor(value / 60)}m ${value % 60}s`} contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                                <Legend />
                                                <Bar dataKey="seconds" fill="#8884d8" name="Time Played" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <p className="text-gray-400">No data</p>}
                                </div>
                            </div>
                        </>
                    )}

                    {statsTab === 'maps-modes' && (
                        <>
                            <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center space-x-2">
                                <Map size={24} /> <span>Maps & Modes Overview</span>
                            </h3>
                            {/* KPI Cards for Maps & Modes */}
                            <div className="w-full overflow-x-auto mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[900px]">
                                    {/* Most Played Map */}
                                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-xl shadow-lg border border-green-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Map size={20} className="text-green-200" />
                                            <span className="text-green-100 text-xs">Most Played Map</span>
                                        </div>
                                        <span className="text-white text-sm font-bold">{mapData[0]?.name || 'N/A'}</span>
                                    </div>
                                    {/* Best Win Rate Map */}
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg border border-blue-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Map size={20} className="text-blue-200" />
                                            <span className="text-blue-100 text-xs">Best Win Rate Map</span>
                                        </div>
                                        <span className="text-white text-sm font-bold">{[...mapData].sort((a,b)=>b.winRate-a.winRate)[0]?.name || 'N/A'}</span>
                                    </div>
                                    {/* Most Played Mode */}
                                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-3 rounded-xl shadow-lg border border-yellow-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Award size={20} className="text-yellow-200" />
                                            <span className="text-yellow-100 text-xs">Most Played Mode</span>
                                        </div>
                                        <span className="text-white text-sm font-bold">{modeData[0]?.name || 'N/A'}</span>
                                    </div>
                                    {/* Best Win Rate Mode */}
                                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-3 rounded-xl shadow-lg border border-purple-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Award size={20} className="text-purple-200" />
                                            <span className="text-purple-100 text-xs">Best Win Rate Mode</span>
                                        </div>
                                        <span className="text-white text-sm font-bold">{[...modeData].sort((a,b)=>b.winRate-a.winRate)[0]?.name || 'N/A'}</span>
                                    </div>
                                    {/* Most Played Mission */}
                                    <div className="bg-gradient-to-br from-pink-600 to-pink-700 p-3 rounded-xl shadow-lg border border-pink-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Map size={20} className="text-pink-200" />
                                            <span className="text-pink-100 text-xs">Most Played Mission</span>
                                        </div>
                                        <span className="text-white text-sm font-bold">{missionNameData[0]?.name || 'N/A'}</span>
                                    </div>
                                    {/* Most Played Hour */}
                                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-3 rounded-xl shadow-lg border border-indigo-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Clock size={20} className="text-indigo-200" />
                                            <span className="text-indigo-100 text-xs">Most Active Hour</span>
                                        </div>
                                        <span className="text-white text-sm font-bold">{timeData.sort((a,b)=>b.battles-a.battles)[0]?.hour || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Charts and Tables (Maps, Modes, Missions) in a wide, compact layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Map Win Rates */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-blue-300 mb-2 flex items-center space-x-2">
                                        <Map size={20} /> <span>Map Win Rates</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={mapData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="name" stroke="#ccc" angle={-45} textAnchor="end" height={80} />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Bar dataKey="winRate" fill="#4CAF50" name="Win Rate %" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Mode Win Rates */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <Award size={20} /> <span>Mode Win Rates</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={modeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="name" stroke="#ccc" />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Bar dataKey="winRate" fill="#4CAF50" name="Win Rate %" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Mission Types Pie Chart */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-pink-300 mb-2 flex items-center space-x-2">
                                        <Map size={20} /> <span>Mission Types Played</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={missionTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {missionTypeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Mission Names Bar Chart */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-pink-300 mb-2 flex items-center space-x-2">
                                        <Map size={20} /> <span>Specific Missions Played</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={missionNameData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="name" stroke="#ccc" angle={-45} textAnchor="end" height={80} />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Bar dataKey="value" fill="#ff7300" name="Count" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Map Table */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700 col-span-full">
                                    <h4 className="font-semibold text-lg text-blue-300 mb-2 flex items-center space-x-2">
                                        <BarChart2 size={20} /> <span>Map Statistics Table</span>
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-gray-200">
                                            <thead className="text-blue-300 border-b border-gray-600">
                                                <tr>
                                                    <th className="text-left py-2">Map</th>
                                                    <th className="text-right py-2">Battles</th>
                                                    <th className="text-right py-2">Win Rate</th>
                                                    <th className="text-right py-2">Avg Kills</th>
                                                    <th className="text-right py-2">Avg SL</th>
                                                    <th className="text-right py-2">Avg RP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mapData.map((map, index) => (
                                                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-800">
                                                        <td className="py-2">{map.name}</td>
                                                        <td className="text-right py-2">{map.battles}</td>
                                                        <td className="text-right py-2">{map.winRate.toFixed(1)}%</td>
                                                        <td className="text-right py-2">{map.avgKills.toFixed(1)}</td>
                                                        <td className="text-right py-2">{map.avgSL.toLocaleString()}</td>
                                                        <td className="text-right py-2">{map.avgRP.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Mode Table */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700 col-span-full">
                                    <h4 className="font-semibold text-lg text-yellow-300 mb-2 flex items-center space-x-2">
                                        <BarChart2 size={20} /> <span>Mode Statistics Table</span>
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-gray-200">
                                            <thead className="text-yellow-300 border-b border-gray-600">
                                                <tr>
                                                    <th className="text-left py-2">Mode</th>
                                                    <th className="text-right py-2">Battles</th>
                                                    <th className="text-right py-2">Win Rate</th>
                                                    <th className="text-right py-2">Avg Kills</th>
                                                    <th className="text-right py-2">Avg SL</th>
                                                    <th className="text-right py-2">Avg RP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {modeData.map((mode, index) => (
                                                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-800">
                                                        <td className="py-2">{mode.name}</td>
                                                        <td className="text-right py-2">{mode.battles}</td>
                                                        <td className="text-right py-2">{mode.winRate.toFixed(1)}%</td>
                                                        <td className="text-right py-2">{mode.avgKills.toFixed(1)}</td>
                                                        <td className="text-right py-2">{mode.avgSL.toLocaleString()}</td>
                                                        <td className="text-right py-2">{mode.avgRP.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {statsTab === 'performance' && (
                        <>
                            <h3 className="text-2xl font-bold text-indigo-400 mb-4 flex items-center space-x-2">
                                <TrendingUp size={24} /> <span>Performance Analytics</span>
                            </h3>
                            
                            {/* Performance KPIs - Same as Overview */}
                            <div className="w-full overflow-x-auto mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[900px]">
                                    {/* General/Performance */}
                                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-xl shadow-lg border border-green-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <TrendingUp size={20} className="text-green-200" />
                                            <span className="text-green-100 text-xs">Win Rate</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{((enhancedStats.wins / Math.max(enhancedStats.totalBattles, 1)) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg border border-blue-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Target size={20} className="text-blue-200" />
                                            <span className="text-blue-100 text-xs">K/D Ratio</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{enhancedStats.kdr?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {/* Combat */}
                                    <div className="bg-gradient-to-br from-red-600 to-red-700 p-3 rounded-xl shadow-lg border border-red-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <PieChart size={20} className="text-red-200" />
                                            <span className="text-red-100 text-xs">Total Kills</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{(enhancedStats.totalKillsAircraft || 0) + (enhancedStats.totalKillsGround || 0)}</span>
                                    </div>
                                    {/* Economy */}
                                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-3 rounded-xl shadow-lg border border-yellow-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <DollarSign size={20} className="text-yellow-200" />
                                            <span className="text-yellow-100 text-xs">Total SL</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{(enhancedStats.totalEarnedSL || 0).toLocaleString()}</span>
                                    </div>
                                    {/* Research */}
                                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-3 rounded-xl shadow-lg border border-purple-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Zap size={20} className="text-purple-200" />
                                            <span className="text-purple-100 text-xs">Total RP</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{(enhancedStats.overallTotalRP || 0).toLocaleString()}</span>
                                    </div>
                                    {/* Vehicles */}
                                    <div className="bg-gradient-to-br from-pink-600 to-pink-700 p-3 rounded-xl shadow-lg border border-pink-500 flex flex-col items-center justify-center min-w-[140px]">
                                        <div className="flex items-center space-x-2">
                                            <Users size={20} className="text-pink-200" />
                                            <span className="text-pink-100 text-xs">Vehicles Used</span>
                                        </div>
                                        <span className="text-white text-xl font-bold">{Object.keys(enhancedStats.vehiclesUsed || {}).length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Charts with Line and Scatter Plots */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Performance by Hour - Line Chart */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-indigo-300 mb-2 flex items-center space-x-2">
                                        <Clock size={20} /> <span>Win Rate by Hour</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart
                                            data={timeData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="hour" stroke="#ccc" />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="winRate" 
                                                stroke="#4CAF50" 
                                                strokeWidth={3}
                                                dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
                                                activeDot={{ r: 8, stroke: '#4CAF50', strokeWidth: 2 }}
                                                name="Win Rate %" 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Battle Distribution by Hour - Scatter Plot */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-indigo-300 mb-2 flex items-center space-x-2">
                                        <BarChart2 size={20} /> <span>Battle Activity by Hour</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <ScatterChart
                                            data={timeData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="hour" stroke="#ccc" />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Scatter 
                                                dataKey="battles" 
                                                fill="#8884d8" 
                                                name="Battles"
                                                shape="circle"
                                            />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Performance Trends - Area Chart */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-indigo-300 mb-2 flex items-center space-x-2">
                                        <TrendingUp size={20} /> <span>Performance Trends</span>
                                    </h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart
                                            data={timeData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                            <XAxis dataKey="hour" stroke="#ccc" />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                            <Legend />
                                            <Area 
                                                type="monotone" 
                                                dataKey="winRate" 
                                                stroke="#8884d8" 
                                                fill="#8884d8" 
                                                fillOpacity={0.6} 
                                                name="Win Rate %" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Performance Metrics Grid */}
                                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                                    <h4 className="font-semibold text-lg text-indigo-300 mb-2 flex items-center space-x-2">
                                        <TrendingUp size={20} /> <span>Performance Metrics</span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-400 text-sm">K/D Ratio</p>
                                            <p className="text-2xl font-bold text-blue-400">{enhancedStats.kdr?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-400 text-sm">Win Rate</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                {((enhancedStats.wins / Math.max(enhancedStats.totalBattles, 1)) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-400 text-sm">Avg Activity</p>
                                            <p className="text-2xl font-bold text-yellow-400">
                                                {enhancedStats.averageActivity?.toFixed(1) || '0.0'}%
                                            </p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-400 text-sm">Total Battles</p>
                                            <p className="text-2xl font-bold text-purple-400">
                                                {enhancedStats.totalBattles}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-400 text-sm">Avg SL/Battle</p>
                                            <p className="text-2xl font-bold text-yellow-400">
                                                {(enhancedStats.avgSLPerBattle || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-400 text-sm">Avg RP/Battle</p>
                                            <p className="text-2xl font-bold text-purple-400">
                                                {(enhancedStats.avgRPPerBattle || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                            <p className="text-gray-400 text-sm">Deaths (Damaged Vehicles)</p>
                                            <p className="text-2xl font-bold text-red-400">
                                                {enhancedStats.totalDamagedVehicles || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Overview - Composed Chart */}
                            <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700 mb-6">
                                <h4 className="font-semibold text-lg text-indigo-300 mb-4 flex items-center space-x-2">
                                    <TrendingUp size={20} /> <span>Performance Overview</span>
                                </h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                                        <XAxis dataKey="name" stroke="#ccc" />
                                        <YAxis stroke="#ccc" />
                                        <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                                        <Legend />
                                        <Bar dataKey="value" fill="#8884d8" name="Value" />
                                        <Line type="monotone" dataKey="value" stroke="#ff7300" strokeWidth={2} name="Trend" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <p className="text-gray-400 text-center">No battle data available for this user yet. Add some on the "Data Management" page!</p>
            )}
        </div>
    );
};

export default StatsPage; 