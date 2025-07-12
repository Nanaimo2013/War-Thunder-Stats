import React, { useState, useCallback } from 'react';
import { Award } from 'lucide-react';
import { calculateStats } from '../utils/statsCalculator';

const LeaderboardPage = ({ users }) => {
    const [sortBy, setSortBy] = useState('totalKillsGround'); // Default sort
    const [sortOrder, setSortOrder] = useState('desc'); // Default order

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
                totalBattles: 0
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
            totalBattles: userBattles.length
        };
        userBattles.forEach(battle => {
            aggregated.totalKillsAircraft += battle.killsAircraft || 0;
            aggregated.totalKillsGround += battle.killsGround || 0;
            aggregated.totalEarnedSL += battle.earnedSL || 0;
            aggregated.totalEarnedCRP += battle.earnedCRP || 0;
            aggregated.overallTotalRP += battle.totalRP || 0;
            if (battle.result === 'Victory') aggregated.wins++;
            if (battle.result === 'Defeat') aggregated.defeats++;
        });
        return aggregated;
    }, []);

    const sortedUsers = [...users].sort((a, b) => {
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

    return (
        <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-xl shadow-lg mb-8 text-gray-100 border-2 border-gray-700 animate-fade-in">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <Award size={24} /> <span>Player Leaderboard</span>
            </h2>

            <div className="mb-6 flex flex-wrap items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <label htmlFor="sort-by" className="text-gray-300 font-bold">Sort By:</label>
                <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="shadow appearance-none border border-gray-600 rounded-xl py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                >
                    <option value="totalKillsGround">Ground Kills</option>
                    <option value="totalKillsAircraft">Aircraft Kills</option>
                    <option value="totalEarnedSL">Earned SL</option>
                    <option value="overallTotalRP">Total RP</option>
                    <option value="winRate">Win Rate</option>
                    <option value="totalBattles">Total Battles</option>
                </select>
                <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105"
                >
                    Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
            </div>

            {users.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-900 rounded-xl shadow-md">
                        <thead>
                            <tr className="bg-gray-950 text-yellow-400 text-left uppercase text-sm leading-normal">
                                <th className="py-3 px-6">Rank</th>
                                <th className="py-3 px-6">Player Name</th>
                                <th className="py-3 px-6">Ground Kills</th>
                                <th className="py-3 px-6">Aircraft Kills</th>
                                <th className="py-3 px-6">Earned SL</th>
                                <th className="py-3 px-6">Total RP</th>
                                <th className="py-3 px-6">Win Rate</th>
                                <th className="py-3 px-6">Total Battles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((user, index) => {
                                const userStats = calculateUserAggregatedStats(user.battles);
                                const winRate = userStats.totalBattles > 0 ? ((userStats.wins / userStats.totalBattles) * 100).toFixed(2) : '0.00';
                                return (
                                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800 transition duration-200 ease-in-out">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">{index + 1}</td>
                                        <td className="py-3 px-6 text-left">{user.name}</td>
                                        <td className="py-3 px-6 text-left">{userStats.totalKillsGround}</td>
                                        <td className="py-3 px-6 text-left">{userStats.totalKillsAircraft}</td>
                                        <td className="py-3 px-6 text-left">{userStats.totalEarnedSL}</td>
                                        <td className="py-3 px-6 text-left">{userStats.overallTotalRP}</td>
                                        <td className="py-3 px-6 text-left">{winRate}%</td>
                                        <td className="py-3 px-6 text-left">{userStats.totalBattles}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-400 text-center">No users or battle data to display on the leaderboard.</p>
            )}
        </div>
    );
};

export default LeaderboardPage; 