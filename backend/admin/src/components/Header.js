import React from 'react';
import { LogOut, User } from 'lucide-react';

const Header = ({ admin, onLogout }) => {
    return (
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-yellow-400">War Thunder Stats Admin</h1>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-300">
                    <User size={20} />
                    <span>Welcome, {admin?.username || 'Admin'}</span>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
