import React from 'react';
import { Settings } from 'lucide-react';

const SystemSettings = () => {
    return (
        <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-xl shadow-lg mb-8 text-gray-100 border-2 border-gray-700">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <Settings size={24} /> <span>System Settings</span>
            </h2>
            <p className="text-gray-300">System settings will be implemented here.</p>
        </div>
    );
};

export default SystemSettings;
