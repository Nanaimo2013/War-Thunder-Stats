import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/users', label: 'User Management', icon: Users },
        { path: '/battles', label: 'Battle Logs', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="bg-gray-800 w-64 p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-6">Admin Panel</h2>
            <nav>
                <ul>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        
                        return (
                            <li key={item.path} className="mb-2">
                                <Link
                                    to={item.path}
                                    className={`flex items-center p-3 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-yellow-400 text-gray-900'
                                            : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    <Icon size={20} className="mr-3" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
