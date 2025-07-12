import React from 'react';
import { Info } from 'lucide-react';

const AboutPage = () => (
    <div className="w-full max-w-3xl bg-gray-800 p-8 rounded-xl shadow-xl mb-8 text-gray-100 border-2 border-gray-700 animate-fade-in">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
            <Info size={24} /> <span>About War Thunder Stats Tracker</span>
        </h2>
        <p className="text-gray-300 mb-4 leading-relaxed">
            This application is a dedicated tool for War Thunder enthusiasts to meticulously track and analyze their in-game performance.
            It provides a comprehensive overview of your battle statistics, helping you identify strengths, weaknesses, and areas for improvement.
        </p>
        <p className="text-gray-300 mb-4 leading-relaxed">
            Key features include:
            <ul className="list-disc list-inside ml-4 mt-2 text-gray-300">
                <li>Detailed battle log parsing for various in-game metrics.</li>
                <li>Personalized player profiles with custom information (level, Gaijin ID, favorite vehicle, squadron).</li>
                <li>Visual analytics including charts for win/loss ratio, combat performance, and economic gains.</li>
                <li>A dynamic leaderboard to compare your stats with other local players.</li>
                <li>Player comparison tool to directly pit two players' stats against each other.</li>
                <li>Data management features for easy export and import of your entire dataset, ensuring your progress is always backed up.</li>
            </ul>
        </p>
        <p className="text-gray-300 mb-4 leading-relaxed">
            All your data is securely stored locally within your browser's session storage, meaning your information
            remains private and accessible only on your device. The application is built using React for a dynamic and responsive user interface,
            and styled with Tailwind CSS to provide a sleek, military-inspired aesthetic that complements the War Thunder theme.
        </p>
        <p className="text-gray-400 text-sm mt-6 border-t border-gray-700 pt-4">
            Disclaimer: This is an unofficial fan-made tool and is not affiliated with, endorsed, or sponsored by Gaijin Entertainment.
            War Thunder and its associated logos are trademarks of Gaijin Entertainment.
        </p>
    </div>
);

export default AboutPage; 