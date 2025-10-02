import React from 'react';
import { Heart, Shield, Zap, Github, ExternalLink, Star, Award, Users, BarChart2, TrendingUp } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="w-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-300 border-t-2 border-yellow-600/50 shadow-2xl relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-500/20 rounded-full animate-ping"></div>
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-orange-500/30 rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-yellow-600/25 rounded-full animate-bounce"></div>
                <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-orange-400/40 rounded-full animate-ping"></div>
            </div>

            <div className="relative w-full max-w-7xl mx-auto px-6 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* App Info */}
                    <div className="text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse"></div>
                                <div className="relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-3 rounded-full border border-yellow-500/30">
                                    <Shield size={32} className="text-yellow-400 drop-shadow-lg" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 ml-4 drop-shadow-lg">
                                War Thunder Stats
                            </h3>
                        </div>
                        <p className="text-gray-400 mb-6 leading-relaxed text-lg">
                            Advanced battle statistics tracker for War Thunder players. 
                            Analyze your performance, track progress, and dominate the battlefield.
                        </p>
                        <div className="flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-500">
                            <span>Made with</span>
                            <Heart size={16} className="text-red-500 animate-pulse" />
                            <span>for the War Thunder community</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="text-center">
                        <h4 className="text-xl font-bold text-yellow-400 mb-6 flex items-center justify-center">
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-2 rounded-full mr-3">
                                <Zap size={20} className="text-yellow-400" />
                            </div>
                            Quick Links
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#home" className="text-gray-400 hover:text-yellow-400 transition-all duration-300 hover:scale-105 inline-block bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 hover:border-yellow-500/50 hover:bg-gray-700/50">
                                    <div className="flex items-center space-x-2">
                                        <Shield size={16} />
                                        <span>Home Dashboard</span>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="#stats" className="text-gray-400 hover:text-yellow-400 transition-all duration-300 hover:scale-105 inline-block bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 hover:border-yellow-500/50 hover:bg-gray-700/50">
                                    <div className="flex items-center space-x-2">
                                        <BarChart2 size={16} />
                                        <span>Battle Statistics</span>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="#leaderboard" className="text-gray-400 hover:text-yellow-400 transition-all duration-300 hover:scale-105 inline-block bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 hover:border-yellow-500/50 hover:bg-gray-700/50">
                                    <div className="flex items-center space-x-2">
                                        <Award size={16} />
                                        <span>Leaderboard</span>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="#profiles" className="text-gray-400 hover:text-yellow-400 transition-all duration-300 hover:scale-105 inline-block bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50 hover:border-yellow-500/50 hover:bg-gray-700/50">
                                    <div className="flex items-center space-x-2">
                                        <Users size={16} />
                                        <span>User Profiles</span>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Features */}
                    <div className="text-center">
                        <h4 className="text-xl font-bold text-yellow-400 mb-6 flex items-center justify-center">
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-2 rounded-full mr-3">
                                <Star size={20} className="text-yellow-400" />
                            </div>
                            Features
                        </h4>
                        <ul className="space-y-3">
                            <li className="text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                <div className="flex items-center space-x-2">
                                    <TrendingUp size={16} className="text-green-400" />
                                    <span>Advanced Analytics</span>
                                </div>
                            </li>
                            <li className="text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                <div className="flex items-center space-x-2">
                                    <Shield size={16} className="text-blue-400" />
                                    <span>Data Export</span>
                                </div>
                            </li>
                            <li className="text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                <div className="flex items-center space-x-2">
                                    <Users size={16} className="text-purple-400" />
                                    <span>Multi-User Support</span>
                                </div>
                            </li>
                            <li className="text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                <div className="flex items-center space-x-2">
                                    <BarChart2 size={16} className="text-orange-400" />
                                    <span>Real-time Stats</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Info */}
                    <div className="text-center lg:text-right">
                        <h4 className="text-xl font-bold text-yellow-400 mb-6">Legal & Information</h4>
                        <div className="space-y-3 text-sm">
                            <p className="text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                &copy; {currentYear} War Thunder Stats Tracker
                            </p>
                            <p className="text-gray-500 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                Unofficial Fan Project
                            </p>
                            <p className="text-gray-500 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                                Not affiliated with Gaijin Entertainment
                            </p>
                            <div className="flex items-center justify-center lg:justify-end space-x-3 mt-6">
                                <a 
                                    href="https://github.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-yellow-400 transition-all duration-300 p-3 rounded-xl hover:bg-gray-700/50 border border-gray-700/50 hover:border-yellow-500/50 transform hover:scale-110"
                                    title="View on GitHub"
                                >
                                    <Github size={24} />
                                </a>
                                <a 
                                    href="https://warthunder.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-yellow-400 transition-all duration-300 p-3 rounded-xl hover:bg-gray-700/50 border border-gray-700/50 hover:border-yellow-500/50 transform hover:scale-110"
                                    title="Official War Thunder Website"
                                >
                                    <ExternalLink size={24} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700/50 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-sm text-gray-500 flex flex-wrap justify-center md:justify-start space-x-4">
                            <span className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700/50">Version 2.0</span>
                            <span className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700/50">Enhanced Export System</span>
                            <span className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700/50">Advanced Analytics</span>
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700/50">
                            Built with React & Tailwind CSS
                        </div>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 1s ease-out forwards;
                }
            `}</style>
        </footer>
    );
};

export default Footer; 