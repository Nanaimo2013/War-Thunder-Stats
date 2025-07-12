import React from 'react';
import { Home, Users, BarChart2, Award, GitCompare, Info } from 'lucide-react';

// Custom SVG Logo for Navbar Title
const WarThunderLogo = () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8 mr-2 inline-block">
        <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FACC15" /> {/* yellow-400 */}
                <stop offset="100%" stopColor="#EAB308" /> {/* yellow-600 */}
            </linearGradient>
        </defs>
        {/* Shield shape */}
        <path d="M50 5 L95 25 L95 75 L50 95 L5 75 L5 25 Z" fill="url(#gradient1)" stroke="#D97706" strokeWidth="3" />
        {/* Stylized 'W' or 'WT' initial */}
        <text x="50" y="65" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="bold" fill="#1F2937" textAnchor="middle" dominantBaseline="middle">W</text>
    </svg>
);

const Navbar = ({ setCurrentPage, currentPage }) => {
    const navItems = [
        { name: 'Home', page: 'home', icon: <Home size={18} /> },
        { name: 'Stats', page: 'stats', icon: <BarChart2 size={18} /> },
        { name: 'Leaderboard', page: 'leaderboard', icon: <Award size={18} /> },
        { name: 'Compare Players', page: 'compare-players', icon: <GitCompare size={18} /> },
        { name: 'Data Management', page: 'data-management', icon: <Users size={18} /> },
        { name: 'About', page: 'about', icon: <Info size={18} /> },
    ];

    return (
        <nav className="bg-gray-900 text-gray-100 p-4 shadow-xl w-full border-b-2 border-yellow-600">
            <div className="container mx-auto flex flex-wrap justify-between items-center">
                <div className="text-3xl font-extrabold text-yellow-400 tracking-wider flex items-center">
                    <WarThunderLogo />
                    WAR THUNDER STATS
                </div>
                <div className="flex flex-wrap space-x-2 sm:space-x-4 mt-2 md:mt-0">
                    {navItems.map(item => (
                        <button
                            key={item.page}
                            onClick={() => setCurrentPage(item.page)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition duration-300 ease-in-out transform hover:scale-105 hover:bg-yellow-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 flex items-center space-x-2 ${
                                currentPage === item.page ? 'bg-yellow-500 text-gray-900 shadow-md' : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 