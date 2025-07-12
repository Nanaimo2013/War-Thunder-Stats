import React, { useMemo } from 'react';
import { Users, Trophy, BarChart2, DollarSign, FlaskConical } from 'lucide-react';

const HomePage = ({ users }) => {
    const overallStats = useMemo(() => {
        let totalBattles = 0;
        let totalKillsGround = 0;
        let totalKillsAircraft = 0;
        let totalEarnedSL = 0;
        let totalEarnedRP = 0;

        users.forEach(user => {
            user.battles.forEach(battle => {
                totalBattles++;
                totalKillsGround += battle.killsGround || 0;
                totalKillsAircraft += battle.killsAircraft || 0;
                totalEarnedSL += battle.earnedSL || 0;
                totalEarnedRP += battle.totalRP || 0;
            });
        });

        return {
            totalUsers: users.length,
            totalBattles,
            totalKillsGround,
            totalKillsAircraft,
            totalEarnedSL,
            totalEarnedRP
        };
    }, [users]);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-800 rounded-xl shadow-xl m-4 border-2 border-gray-700 animate-fade-in">
            <h2 className="text-5xl font-extrabold text-yellow-400 mb-6 drop-shadow-lg">Welcome, Commander!</h2>
            <p className="text-gray-300 text-xl mb-8 max-w-3xl leading-relaxed">
                Unleash the full potential of your War Thunder battles. Track your performance, analyze detailed statistics,
                and compare your prowess with other players. Dive deep into your combat history and strategize for future victories.
            </p>
            {/* War Thunder themed SVG - simple tank icon */}
            <svg className="w-48 h-48 text-yellow-500 mb-8 animate-bounce-subtle" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 10c0-1.1-.9-2-2-2h-3V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v2H3c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h3v2c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-2h3c1.1 0 2-.9 2-2v-2zm-5 8H8v-2h8v2zm-8-4v-2h8v2H8zM7 6h10v2H7V6z"/>
            </svg>

            <h3 className="text-3xl font-bold text-yellow-400 mb-6 drop-shadow-lg">System-Wide Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mb-8">
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-yellow-600 flex flex-col items-center justify-center transform hover:scale-105 transition duration-300">
                    <Users size={48} className="text-yellow-500 mb-3" />
                    <p className="text-gray-300 text-lg">Total Users</p>
                    <p className="text-yellow-400 text-4xl font-extrabold">{overallStats.totalUsers}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-yellow-600 flex flex-col items-center justify-center transform hover:scale-105 transition duration-300">
                    <Trophy size={48} className="text-yellow-500 mb-3" />
                    <p className="text-gray-300 text-lg">Total Battles Logged</p>
                    <p className="text-yellow-400 text-4xl font-extrabold">{overallStats.totalBattles}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-yellow-600 flex flex-col items-center justify-center transform hover:scale-105 transition duration-300">
                    <BarChart2 size={48} className="text-yellow-500 mb-3" />
                    <p className="text-gray-300 text-lg">Total Kills (Ground)</p>
                    <p className="text-yellow-400 text-4xl font-extrabold">{overallStats.totalKillsGround}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-yellow-600 flex flex-col items-center justify-center transform hover:scale-105 transition duration-300">
                    <BarChart2 size={48} className="text-yellow-500 mb-3" />
                    <p className="text-gray-300 text-lg">Total Kills (Aircraft)</p>
                    <p className="text-yellow-400 text-4xl font-extrabold">{overallStats.totalKillsAircraft}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-yellow-600 flex flex-col items-center justify-center transform hover:scale-105 transition duration-300">
                    <DollarSign size={48} className="text-yellow-500 mb-3" />
                    <p className="text-gray-300 text-lg">Total Earned SL</p>
                    <p className="text-yellow-400 text-4xl font-extrabold">{overallStats.totalEarnedSL.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-yellow-600 flex flex-col items-center justify-center transform hover:scale-105 transition duration-300">
                    <FlaskConical size={48} className="text-yellow-500 mb-3" />
                    <p className="text-gray-300 text-lg">Total Earned RP</p>
                    <p className="text-yellow-400 text-4xl font-extrabold">{overallStats.totalEarnedRP.toLocaleString()}</p>
                </div>
            </div>

            <p className="text-gray-400 text-lg">
                Use the navigation bar above to explore your stats, manage profiles, and more.
            </p>
        </div>
    );
};

export default HomePage; 