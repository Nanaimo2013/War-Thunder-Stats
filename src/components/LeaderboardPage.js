import React, { useState, useCallback, useMemo } from 'react';
import { Award, Trophy, Target, DollarSign, TrendingUp, Users, Medal, Crown, Star, ArrowUpDown, Filter, Search, BarChart3, Zap, Activity, Sword, Target as TargetIcon } from 'lucide-react';
import { calculateStats } from '../utils/statsCalculator';
import { formatNumber, formatCurrency } from '../utils/helpers';

const LeaderboardPage = ({ users }) => {
    const [sortBy, setSortBy] = useState('totalKillsGround'); // Default sort
    const [sortOrder, setSortOrder] = useState('desc'); // Default order
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all'); // 'all', 'active', 'top'

    const calculateUserAggregatedStats = useCallback((userBattles) => {
        if (!userBattles || userBattles.length === 0) {
            return {
                totalKillsAircraft: 0,
                totalKillsGround: 0,
                totalEarnedSL: 0,
                totalEarnedCRP: 0,
                overallTotalRP: 0,
                wins: 0,
                defeats: 0,
                totalBattles: 0,
                totalAssists: 0,
                avgActivity: 0,
                totalDamage: 0,
                avgKillsPerBattle: 0
            };
        }
        const aggregated = {
            totalKillsAircraft: 0,
            totalKillsGround: 0,
            totalEarnedSL: 0,
            totalEarnedCRP: 0,
            overallTotalRP: 0,
            wins: 0,
            defeats: 0,
            totalBattles: userBattles.length,
            totalAssists: 0,
            avgActivity: 0,
            totalDamage: 0,
            avgKillsPerBattle: 0
        };
        let totalActivity = 0;
        let totalKills = 0;
        userBattles.forEach(battle => {
            aggregated.totalKillsAircraft += battle.killsAircraft || 0;
            aggregated.totalKillsGround += battle.killsGround || 0;
            aggregated.totalEarnedSL += battle.earnedSL || 0;
            aggregated.totalEarnedCRP += battle.earnedCRP || 0;
            aggregated.overallTotalRP += battle.totalRP || 0;
            aggregated.totalAssists += battle.assists || 0;
            aggregated.totalDamage += battle.damage || 0;
            totalActivity += battle.activity || 0;
            totalKills += (battle.killsGround || 0) + (battle.killsAircraft || 0);
            if (battle.result === 'Victory') aggregated.wins++;
            if (battle.result === 'Defeat') aggregated.defeats++;
        });
        aggregated.avgActivity = totalActivity / userBattles.length;
        aggregated.avgKillsPerBattle = totalKills / userBattles.length;
        return aggregated;
    }, []);

    const filteredAndSortedUsers = useMemo(() => {
        let filtered = users;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (filterBy === 'active') {
            filtered = filtered.filter(user => 
                user.battles && user.battles.length > 5
            );
        } else if (filterBy === 'top') {
            filtered = filtered.filter(user => {
                const stats = calculateUserAggregatedStats(user.battles);
                return stats.totalBattles > 10 && (stats.wins / stats.totalBattles) > 0.5;
            });
        }

        // Sort users
        return filtered.sort((a, b) => {
            const statsA = calculateUserAggregatedStats(a.battles);
            const statsB = calculateUserAggregatedStats(b.battles);

            let valueA = statsA[sortBy] || 0;
            let valueB = statsB[sortBy] || 0;

            if (sortBy === 'winRate') {
                valueA = statsA.totalBattles > 0 ? (statsA.wins / statsA.totalBattles) * 100 : 0;
                valueB = statsB.totalBattles > 0 ? (statsB.wins / statsB.totalBattles) * 100 : 0;
            }

            if (sortOrder === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        });
    }, [users, sortBy, sortOrder, searchTerm, filterBy, calculateUserAggregatedStats]);

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown size={28} className="text-yellow-500 drop-shadow-lg" />;
        if (rank === 2) return <Medal size={28} className="text-gray-400 drop-shadow-lg" />;
        if (rank === 3) return <Medal size={28} className="text-amber-600 drop-shadow-lg" />;
        return <Star size={24} className="text-gray-500" />;
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 shadow-lg";
        if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900 shadow-lg";
        if (rank === 3) return "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg";
        return "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300";
    };

    const getRankGlow = (rank) => {
        if (rank === 1) return "shadow-yellow-500/50";
        if (rank === 2) return "shadow-gray-400/50";
        if (rank === 3) return "shadow-amber-600/50";
        return "shadow-gray-700/50";
    };

    const StatCard = ({ user, rank, stats }) => (
        <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border-2 border-gray-700/50 hover:border-yellow-500/50 transition-all duration-500 transform hover:scale-105 animate-fade-in backdrop-blur-sm ${getRankGlow(rank)}`} style={{ animationDelay: `${rank * 100}ms` }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shadow-lg ${getRankBadge(rank)}`}>
                        {rank}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-yellow-400 drop-shadow-lg">{user.name}</h3>
                        <p className="text-gray-500 text-sm font-semibold">Rank #{rank}</p>
                    </div>
                </div>
                <div className="text-right">
                    {getRankIcon(rank)}
                </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border border-gray-600/50">
                    <TargetIcon size={24} className="text-red-500 mx-auto mb-2 drop-shadow-lg" />
                    <p className="text-gray-400 text-sm font-semibold">Ground Kills</p>
                    <p className="text-red-400 font-black text-xl">{formatNumber(stats.totalKillsGround)}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border border-gray-600/50">
                    <Sword size={24} className="text-blue-500 mx-auto mb-2 drop-shadow-lg" />
                    <p className="text-gray-400 text-sm font-semibold">Air Kills</p>
                    <p className="text-blue-400 font-black text-xl">{formatNumber(stats.totalKillsAircraft)}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border border-gray-600/50">
                    <DollarSign size={24} className="text-green-500 mx-auto mb-2 drop-shadow-lg" />
                    <p className="text-gray-400 text-sm font-semibold">Earned SL</p>
                    <p className="text-green-400 font-black text-lg">{formatCurrency(stats.totalEarnedSL, 'SL', { decimals: 0 })}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border border-gray-600/50">
                    <TrendingUp size={24} className="text-purple-500 mx-auto mb-2 drop-shadow-lg" />
                    <p className="text-gray-400 text-sm font-semibold">Win Rate</p>
                    <p className="text-purple-400 font-black text-xl">
                        {stats.totalBattles > 0 ? ((stats.wins / stats.totalBattles) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <p className="text-gray-500 text-xs font-semibold">Total RP</p>
                    <p className="text-cyan-400 font-bold text-sm">{formatNumber(stats.overallTotalRP)}</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <p className="text-gray-500 text-xs font-semibold">Battles</p>
                    <p className="text-yellow-400 font-bold text-sm">{stats.totalBattles}</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <p className="text-gray-500 text-xs font-semibold">Assists</p>
                    <p className="text-orange-400 font-bold text-sm">{stats.totalAssists}</p>
                </div>
            </div>

            {/* Performance Bar */}
            <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Performance</span>
                    <span>{stats.avgKillsPerBattle.toFixed(1)} kills/battle</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.avgKillsPerBattle / 5) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-500/20 rounded-full animate-ping"></div>
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-orange-500/30 rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-yellow-600/25 rounded-full animate-bounce"></div>
            </div>

            <div className="relative w-full max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6 drop-shadow-2xl">
                        Player Leaderboard
                    </h2>
                    <p className="text-gray-400 text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed">
                        Compare your performance with other commanders and see who dominates the battlefield
                    </p>
                </div>

                {/* Enhanced Controls */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-2xl mb-12 border border-gray-700/50 shadow-2xl backdrop-blur-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Side - Search and Filter */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-300 font-bold mb-3 flex items-center">
                                    <Search size={20} className="mr-2 text-yellow-400" />
                                    Search Players
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by player name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-300 font-bold mb-3 flex items-center">
                                    <Filter size={20} className="mr-2 text-yellow-400" />
                                    Filter Players
                                </label>
                                <select
                                    value={filterBy}
                                    onChange={(e) => setFilterBy(e.target.value)}
                                    className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                                >
                                    <option value="all">All Players</option>
                                    <option value="active">Active Players (5+ battles)</option>
                                    <option value="top">Top Performers (10+ battles, 50%+ win rate)</option>
                                </select>
                            </div>
                        </div>

                        {/* Right Side - Sort and View */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-300 font-bold mb-3 flex items-center">
                                    <BarChart3 size={20} className="mr-2 text-yellow-400" />
                                    Sort By
                                </label>
                                <div className="flex space-x-3">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="flex-1 p-4 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                                    >
                                        <option value="totalKillsGround">Ground Kills</option>
                                        <option value="totalKillsAircraft">Aircraft Kills</option>
                                        <option value="totalEarnedSL">Earned SL</option>
                                        <option value="overallTotalRP">Total RP</option>
                                        <option value="winRate">Win Rate</option>
                                        <option value="totalBattles">Total Battles</option>
                                        <option value="totalAssists">Total Assists</option>
                                        <option value="avgKillsPerBattle">Avg Kills/Battle</option>
                                    </select>
                                    <button
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 transform hover:scale-105 flex items-center space-x-2"
                                    >
                                        <ArrowUpDown size={20} />
                                        <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-300 font-bold mb-3 flex items-center">
                                    <Zap size={20} className="mr-2 text-yellow-400" />
                                    View Mode
                                </label>
                                <div className="flex bg-gray-800 rounded-xl p-1">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`flex-1 px-6 py-3 rounded-lg transition-all duration-300 ${
                                            viewMode === 'table' 
                                                ? 'bg-yellow-600 text-white shadow-lg' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                    >
                                        Table View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={`flex-1 px-6 py-3 rounded-lg transition-all duration-300 ${
                                            viewMode === 'cards' 
                                                ? 'bg-yellow-600 text-white shadow-lg' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                    >
                                        Card View
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="mb-8 text-center">
                    <p className="text-gray-400 text-lg">
                        Showing <span className="text-yellow-400 font-bold">{filteredAndSortedUsers.length}</span> of <span className="text-yellow-400 font-bold">{users.length}</span> players
                    </p>
                </div>

                {/* Content */}
                {filteredAndSortedUsers.length > 0 ? (
                    viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredAndSortedUsers.map((user, index) => {
                                const userStats = calculateUserAggregatedStats(user.battles);
                                return (
                                    <StatCard 
                                        key={user.id} 
                                        user={user} 
                                        rank={index + 1} 
                                        stats={userStats} 
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-950 to-gray-900 text-yellow-400 text-left uppercase text-sm font-black">
                                            <th className="py-6 px-8 text-center">Rank</th>
                                            <th className="py-6 px-8">Player Name</th>
                                            <th className="py-6 px-8 text-center">Ground Kills</th>
                                            <th className="py-6 px-8 text-center">Air Kills</th>
                                            <th className="py-6 px-8 text-center">Earned SL</th>
                                            <th className="py-6 px-8 text-center">Total RP</th>
                                            <th className="py-6 px-8 text-center">Win Rate</th>
                                            <th className="py-6 px-8 text-center">Battles</th>
                                            <th className="py-6 px-8 text-center">Assists</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedUsers.map((user, index) => {
                                            const userStats = calculateUserAggregatedStats(user.battles);
                                            const winRate = userStats.totalBattles > 0 ? ((userStats.wins / userStats.totalBattles) * 100).toFixed(1) : '0.0';
                                            return (
                                                <tr 
                                                    key={user.id} 
                                                    className="border-b border-gray-700/50 hover:bg-gray-800/50 transition duration-300 ease-in-out animate-fade-in"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <td className="py-6 px-8 text-center">
                                                        <div className="flex items-center justify-center space-x-3">
                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shadow-lg ${getRankBadge(index + 1)}`}>
                                                                {index + 1}
                                                            </div>
                                                            {index < 3 && getRankIcon(index + 1)}
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-8">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border border-gray-600/50">
                                                                <Users size={24} className="text-gray-400" />
                                                            </div>
                                                            <span className="font-black text-yellow-400 text-lg">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className="text-red-400 font-black text-lg">{formatNumber(userStats.totalKillsGround)}</span>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className="text-blue-400 font-black text-lg">{formatNumber(userStats.totalKillsAircraft)}</span>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className="text-green-400 font-black text-lg">{formatCurrency(userStats.totalEarnedSL, 'SL', { decimals: 0 })}</span>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className="text-purple-400 font-black text-lg">{formatNumber(userStats.overallTotalRP)}</span>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className={`font-black text-lg ${parseFloat(winRate) >= 60 ? 'text-green-400' : parseFloat(winRate) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {winRate}%
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className="text-gray-300 font-black text-lg">{userStats.totalBattles}</span>
                                                    </td>
                                                    <td className="py-6 px-8 text-center">
                                                        <span className="text-orange-400 font-black text-lg">{userStats.totalAssists}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-center py-16">
                        <Award size={80} className="text-gray-600 mx-auto mb-6" />
                        <p className="text-gray-400 text-2xl mb-4">No players found</p>
                        <p className="text-gray-500 text-lg">Try adjusting your search or filter criteria.</p>
                    </div>
                )}

                {/* Enhanced Stats Summary */}
                {filteredAndSortedUsers.length > 0 && (
                    <div className="mt-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700/50 shadow-2xl backdrop-blur-sm">
                        <h3 className="text-2xl font-black text-yellow-400 mb-6 flex items-center space-x-3">
                            <TrendingUp size={28} className="text-yellow-500" />
                            <span>Leaderboard Summary</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm font-semibold">Total Players</p>
                                <p className="text-yellow-400 text-3xl font-black">{filteredAndSortedUsers.length}</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm font-semibold">Top Ground Killer</p>
                                <p className="text-red-400 text-lg font-black">
                                    {filteredAndSortedUsers[0]?.name || 'N/A'}
                                </p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm font-semibold">Top Air Ace</p>
                                <p className="text-blue-400 text-lg font-black">
                                    {filteredAndSortedUsers.find(u => calculateUserAggregatedStats(u.battles).totalKillsAircraft === Math.max(...filteredAndSortedUsers.map(u => calculateUserAggregatedStats(u.battles).totalKillsAircraft)))?.name || 'N/A'}
                                </p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm font-semibold">Highest Win Rate</p>
                                <p className="text-green-400 text-lg font-black">
                                    {filteredAndSortedUsers.find(u => {
                                        const stats = calculateUserAggregatedStats(u.battles);
                                        return stats.totalBattles > 0 && (stats.wins / stats.totalBattles) === Math.max(...filteredAndSortedUsers.map(u => {
                                            const s = calculateUserAggregatedStats(u.battles);
                                            return s.totalBattles > 0 ? s.wins / s.totalBattles : 0;
                                        }));
                                    })?.name || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default LeaderboardPage; 