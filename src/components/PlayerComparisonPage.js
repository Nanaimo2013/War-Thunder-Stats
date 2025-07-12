import React, { useState } from 'react';
import { GitCompare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateStats } from '../utils/statsCalculator';

const PlayerComparisonPage = ({ users }) => {
    const [player1Id, setPlayer1Id] = useState('');
    const [player2Id, setPlayer2Id] = useState('');

    const player1 = users.find(u => u.id === player1Id);
    const player2 = users.find(u => u.id === player2Id);

    const stats1 = player1 ? calculateStats(player1.battles) : {};
    const stats2 = player2 ? calculateStats(player2.battles) : {};

    const comparisonData = [
        { name: 'Total Kills (Ground)', Player1: stats1.totalKillsGround || 0, Player2: stats2.totalKillsGround || 0 },
        { name: 'Total Kills (Aircraft)', Player1: stats1.totalKillsAircraft || 0, Player2: stats2.totalKillsAircraft || 0 },
        { name: 'Total Earned SL', Player1: stats1.totalEarnedSL || 0, Player2: stats2.totalEarnedSL || 0 },
        { name: 'Total Earned RP', Player1: stats1.overallTotalRP || 0, Player2: stats2.overallTotalRP || 0 },
        { name: 'Total Battles', Player1: stats1.totalBattles || 0, Player2: stats2.totalBattles || 0 },
        { name: 'Win Rate (%)', Player1: stats1.totalBattles > 0 ? (stats1.wins / stats1.totalBattles * 100).toFixed(2) : 0, Player2: stats2.totalBattles > 0 ? (stats2.wins / stats2.totalBattles * 100).toFixed(2) : 0 },
        { name: 'Avg. Activity (%)', Player1: stats1.averageActivity ? stats1.averageActivity.toFixed(2) : 0, Player2: stats2.averageActivity ? stats2.averageActivity.toFixed(2) : 0 },
    ];

    return (
        <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-xl shadow-lg mb-8 text-gray-100 border-2 border-gray-700 animate-fade-in">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <GitCompare size={24} /> <span>Compare Players</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div>
                    <label htmlFor="player1-select" className="block text-gray-300 text-sm font-bold mb-2">
                        Select Player 1:
                    </label>
                    <select
                        id="player1-select"
                        value={player1Id}
                        onChange={(e) => setPlayer1Id(e.target.value)}
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    >
                        <option value="">-- Select Player 1 --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="player2-select" className="block text-gray-300 text-sm font-bold mb-2">
                        Select Player 2:
                    </label>
                    <select
                        id="player2-select"
                        value={player2Id}
                        onChange={(e) => setPlayer2Id(e.target.value)}
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    >
                        <option value="">-- Select Player 2 --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                </div>
            </div>

            {(player1Id && player2Id) ? (
                <div className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-700">
                    <h3 className="font-semibold text-lg text-yellow-300 mb-2">Comparison Chart</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={comparisonData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                            <XAxis dataKey="name" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                            <Legend />
                            <Bar dataKey="Player1" fill="#8884d8" name={player1?.name || 'Player 1'} />
                            <Bar dataKey="Player2" fill="#82ca9d" name={player2?.name || 'Player 2'} />
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {player1 && (
                            <div className="bg-gray-950 p-4 rounded-xl shadow-inner border border-gray-700">
                                <h4 className="text-xl font-bold text-yellow-400 mb-3">{player1.name}</h4>
                                <p>Total Battles: {stats1.totalBattles}</p>
                                <p>Ground Kills: {stats1.totalKillsGround}</p>
                                <p>Aircraft Kills: {stats1.totalKillsAircraft}</p>
                                <p>Earned SL: {stats1.totalEarnedSL}</p>
                                <p>Total RP: {stats1.overallTotalRP}</p>
                                <p>Win Rate: {stats1.totalBattles > 0 ? (stats1.wins / stats1.totalBattles * 100).toFixed(2) : 0}%</p>
                                <p>Avg. Activity: {stats1.averageActivity ? stats1.averageActivity.toFixed(2) : 0}%</p>
                            </div>
                        )}
                        {player2 && (
                            <div className="bg-gray-950 p-4 rounded-xl shadow-inner border border-gray-700">
                                <h4 className="text-xl font-bold text-yellow-400 mb-3">{player2.name}</h4>
                                <p>Total Battles: {stats2.totalBattles}</p>
                                <p>Ground Kills: {stats2.totalKillsGround}</p>
                                <p>Aircraft Kills: {stats2.totalKillsAircraft}</p>
                                <p>Earned SL: {stats2.totalEarnedSL}</p>
                                <p>Total RP: {stats2.overallTotalRP}</p>
                                <p>Win Rate: {stats2.totalBattles > 0 ? (stats2.wins / stats2.totalBattles * 100).toFixed(2) : 0}%</p>
                                <p>Avg. Activity: {stats2.averageActivity ? stats2.averageActivity.toFixed(2) : 0}%</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-gray-400 text-center">Select two players to compare their stats.</p>
            )}
        </div>
    );
};

export default PlayerComparisonPage; 