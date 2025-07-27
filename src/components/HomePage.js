import React, { useMemo } from 'react';
import { Users, Trophy, BarChart2, DollarSign, FlaskConical, Target, TrendingUp, Award, Zap, Shield, Star, Activity, Target as TargetIcon, Sword } from 'lucide-react';
import { formatNumber, formatCurrency } from '../utils/helpers';

const HomePage = ({ users }) => {
    const overallStats = useMemo(() => {
        let totalBattles = 0;
        let totalKillsGround = 0;
        let totalKillsAircraft = 0;
        let totalEarnedSL = 0;
        let totalEarnedRP = 0;
        let totalVictories = 0;
        let totalDefeats = 0;
        let totalAssists = 0;
        let totalActivity = 0;

        users.forEach(user => {
            if (user.battles && user.battles.length > 0) {
                user.battles.forEach(battle => {
                    totalBattles++;
                    totalKillsGround += battle.killsGround || 0;
                    totalKillsAircraft += battle.killsAircraft || 0;
                    totalEarnedSL += battle.earnedSL || 0;
                    totalEarnedRP += battle.totalRP || 0;
                    totalAssists += battle.assists || 0;
                    totalActivity += battle.activity || 0;
                    
                    if (battle.result === 'Victory') totalVictories++;
                    if (battle.result === 'Defeat') totalDefeats++;
                });
            }
        });

        const winRate = totalBattles > 0 ? (totalVictories / totalBattles) * 100 : 0;
        const avgActivity = totalBattles > 0 ? totalActivity / totalBattles : 0;

        return {
            totalUsers: users.length,
            totalBattles,
            totalKillsGround,
            totalKillsAircraft,
            totalEarnedSL,
            totalEarnedRP,
            totalVictories,
            totalDefeats,
            totalAssists,
            winRate,
            avgActivity
        };
    }, [users]);

    const StatCard = ({ icon: Icon, title, value, subtitle, color = "yellow", delay = 0, gradient = false }) => (
        <div 
            className={`${gradient ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gray-800'} p-6 rounded-2xl shadow-2xl border-2 border-${color}-600/50 flex flex-col items-center justify-center transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:border-${color}-500 hover:bg-gray-700/50 animate-fade-in backdrop-blur-sm`}
            style={{ animationDelay: `${delay * 100}ms` }}
        >
            <div className={`p-4 rounded-full bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 mb-4 backdrop-blur-sm`}>
                <Icon size={48} className={`text-${color}-400 drop-shadow-lg`} />
            </div>
            <p className="text-gray-300 text-lg font-semibold mb-2 text-center">{title}</p>
            <p className={`text-${color}-400 text-4xl font-black mb-2 drop-shadow-lg`}>{value}</p>
            {subtitle && <p className="text-gray-500 text-sm text-center">{subtitle}</p>}
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
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
                <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-orange-400/40 rounded-full animate-ping"></div>
                <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-yellow-400/20 rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/2 w-1.5 h-1.5 bg-orange-500/25 rounded-full animate-bounce"></div>
            </div>

            {/* Hero Section */}
            <div className="relative w-full min-h-screen flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-950"></div>
                <div className="relative w-full max-w-7xl mx-auto px-6 py-20">
                    <div className="text-center">
                        <div className="mb-8 animate-fade-in">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full mb-6 backdrop-blur-sm border border-yellow-500/30">
                                <Shield size={48} className="text-yellow-400 drop-shadow-lg" />
                            </div>
                            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 mb-6 drop-shadow-2xl animate-fade-in">
                                Welcome, Commander!
                            </h1>
                        </div>
                        
                        <p className="text-gray-300 text-xl md:text-2xl lg:text-3xl mb-12 max-w-5xl mx-auto leading-relaxed animate-fade-in font-light" style={{ animationDelay: '200ms' }}>
                            Unleash the full potential of your War Thunder battles. Track your performance, analyze detailed statistics,
                            and compare your prowess with other players. Dive deep into your combat history and strategize for future victories.
                        </p>
                        
                        {/* Animated Tank Icon */}
                        <div className="relative mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
                            <div className="w-64 h-64 mx-auto relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <svg className="w-full h-full text-yellow-400 animate-bounce-subtle drop-shadow-2xl" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 10c0-1.1-.9-2-2-2h-3V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v2H3c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h3v2c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-2h3c1.1 0 2-.9 2-2v-2zm-5 8H8v-2h8v2zm-8-4v-2h8v2H8zM7 6h10v2H7V6z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Preview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
                            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm">Active Users</p>
                                <p className="text-blue-400 text-2xl font-bold">{overallStats.totalUsers}</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm">Total Battles</p>
                                <p className="text-yellow-400 text-2xl font-bold">{formatNumber(overallStats.totalBattles)}</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm">Win Rate</p>
                                <p className="text-green-400 text-2xl font-bold">{overallStats.winRate.toFixed(1)}%</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
                                <p className="text-gray-400 text-sm">Avg Activity</p>
                                <p className="text-purple-400 text-2xl font-bold">{overallStats.avgActivity.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="relative w-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-20">
                <div className="w-full max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: '800ms' }}>
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6 drop-shadow-2xl">
                            System-Wide Statistics
                        </h2>
                        <p className="text-gray-400 text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed">
                            Comprehensive overview of all tracked battles and player performance across the platform
                        </p>
                    </div>

                    {/* Primary Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        <StatCard 
                            icon={Users} 
                            title="Active Users" 
                            value={overallStats.totalUsers}
                            subtitle="Registered Players"
                            color="blue"
                            delay={0}
                            gradient={true}
                        />
                        <StatCard 
                            icon={Trophy} 
                            title="Total Battles" 
                            value={formatNumber(overallStats.totalBattles)}
                            subtitle="Combat Engagements"
                            color="yellow"
                            delay={1}
                            gradient={true}
                        />
                        <StatCard 
                            icon={Target} 
                            title="Win Rate" 
                            value={`${overallStats.winRate.toFixed(1)}%`}
                            subtitle={`${overallStats.totalVictories} victories`}
                            color="green"
                            delay={2}
                            gradient={true}
                        />
                        <StatCard 
                            icon={Activity} 
                            title="Avg Activity" 
                            value={`${overallStats.avgActivity.toFixed(1)}%`}
                            subtitle="Battle Participation"
                            color="purple"
                            delay={3}
                            gradient={true}
                        />
                    </div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        <StatCard 
                            icon={TargetIcon} 
                            title="Ground Kills" 
                            value={formatNumber(overallStats.totalKillsGround)}
                            subtitle="Enemy Vehicles Destroyed"
                            color="red"
                            delay={4}
                        />
                        <StatCard 
                            icon={Sword} 
                            title="Air Kills" 
                            value={formatNumber(overallStats.totalKillsAircraft)}
                            subtitle="Enemy Aircraft Shot Down"
                            color="sky"
                            delay={5}
                        />
                        <StatCard 
                            icon={Award} 
                            title="Total Assists" 
                            value={formatNumber(overallStats.totalAssists)}
                            subtitle="Team Support Actions"
                            color="orange"
                            delay={6}
                        />
                    </div>

                    {/* Economy Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        <StatCard 
                            icon={DollarSign} 
                            title="Total SL Earned" 
                            value={formatCurrency(overallStats.totalEarnedSL, 'SL', { decimals: 0 })}
                            subtitle="Silver Lions Accumulated"
                            color="emerald"
                            delay={7}
                        />
                        <StatCard 
                            icon={FlaskConical} 
                            title="Total RP Earned" 
                            value={formatNumber(overallStats.totalEarnedRP)}
                            subtitle="Research Points Gained"
                            color="cyan"
                            delay={8}
                        />
                    </div>

                    {/* Call to Action */}
                    <div className="text-center animate-fade-in" style={{ animationDelay: '1000ms' }}>
                        <div className="bg-gradient-to-r from-yellow-600/10 via-orange-600/10 to-yellow-600/10 p-12 rounded-3xl border-2 border-yellow-500/30 backdrop-blur-sm shadow-2xl">
                            <h3 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-6 flex items-center justify-center">
                                <Zap size={36} className="mr-4 text-yellow-500" />
                                Ready to Dominate?
                            </h3>
                            <p className="text-gray-300 text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
                                Use the navigation bar above to explore detailed statistics, manage user profiles, 
                                view leaderboards, and export your battle data.
                            </p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <div className="flex items-center space-x-3 text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                    <Shield size={24} className="text-yellow-500" />
                                    <span className="font-semibold">Enhanced Export System</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                    <BarChart2 size={24} className="text-yellow-500" />
                                    <span className="font-semibold">Detailed Analytics</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                    <Users size={24} className="text-yellow-500" />
                                    <span className="font-semibold">Multi-User Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-fade-in {
                    animation: fadeIn 1s ease-out forwards;
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default HomePage; 