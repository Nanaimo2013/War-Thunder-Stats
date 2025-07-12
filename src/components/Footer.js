import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-400 p-4 mt-auto w-full border-t-2 border-yellow-600">
            <div className="container mx-auto text-center text-sm">
                &copy; {new Date().getFullYear()} War Thunder Stats Tracker. All rights reserved.
                <p className="mt-1">Unofficial Fan Project. Not affiliated with Gaijin Entertainment.</p>
            </div>
        </footer>
    );
};

export default Footer; 