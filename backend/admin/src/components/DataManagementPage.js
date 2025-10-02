import React, { useState } from 'react';
import { Users, Upload, Download, FileText, Settings } from 'lucide-react';
import { showMessage } from '../utils/helpers';
import UserProfileEditor from './UserProfileEditor';
import BattleDataEntryComponent from './BattleDataEntry';

const DataManagementPage = ({ users, setUsers, selectedUserId, setSelectedUserId, battleDataInput, setBattleDataInput, handleProcessBattleData, loading }) => {
    const [exportFormat, setExportFormat] = useState('v2'); // 'v1' or 'v2'
    const [exportNotes, setExportNotes] = useState('');
    const [exportCategories, setExportCategories] = useState(['all']); // ['all', 'users', 'battles', 'stats']

    // Generate unique filename with timestamp and counter
    const generateFilename = (format, notes = '') => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
        const timestamp = `${dateStr}_${timeStr}`;
        
        let filename = `war_thunder_stats_backup_${format.toUpperCase()}_${timestamp}`;
        
        if (notes.trim()) {
            const cleanNotes = notes.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 30);
            filename += `_${cleanNotes}`;
        }
        
        return `${filename}.json`;
    };

    // V1 Export (current format - single line JSON)
    const handleExportDataV1 = () => {
        try {
            const data = sessionStorage.getItem('warThunderUsers');
            if (!data) {
                showMessage("No data to export.", "error");
                return;
            }
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = generateFilename('v1');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMessage("Data exported successfully in V1 format!");
        } catch (error) {
            console.error("Error exporting data:", error);
            showMessage("Failed to export data.", "error");
        }
    };

    // V2 Export (improved format - organized and readable)
    const handleExportDataV2 = () => {
        try {
            const data = sessionStorage.getItem('warThunderUsers');
            if (!data) {
                showMessage("No data to export.", "error");
                return;
            }

            const usersData = JSON.parse(data);
            const exportDate = new Date().toISOString();

            // Create V2 backup structure
            const v2Backup = {
                metadata: {
                    version: "2.0",
                    exportDate: exportDate,
                    exportFormat: "v2",
                    notes: exportNotes.trim() || null,
                    categories: exportCategories,
                    totalUsers: usersData.length,
                    totalBattles: usersData.reduce((sum, user) => sum + (user.battles?.length || 0), 0),
                    application: "War Thunder Stats Tracker",
                    compatibility: {
                        v1: true,
                        v2: true
                    }
                },
                summary: {
                    users: usersData.map(user => ({
                        id: user.id,
                        name: user.name,
                        title: user.title,
                        level: user.level,
                        rank: user.rank,
                        squadron: user.squadron,
                        battleCount: user.battles?.length || 0,
                        totalEarnedSL: user.battles?.reduce((sum, battle) => sum + (battle.earnedSL || 0), 0) || 0,
                        totalEarnedRP: user.battles?.reduce((sum, battle) => sum + (battle.totalRP || 0), 0) || 0,
                        victories: user.battles?.filter(battle => battle.result === 'Victory').length || 0,
                        defeats: user.battles?.filter(battle => battle.result === 'Defeat').length || 0
                    }))
                },
                data: {
                    users: exportCategories.includes('all') || exportCategories.includes('users') ? usersData : [],
                    battles: exportCategories.includes('all') || exportCategories.includes('battles') ? 
                        usersData.flatMap(user => 
                            (user.battles || []).map(battle => ({
                                ...battle,
                                userId: user.id,
                                userName: user.name
                            }))
                        ) : [],
                    stats: exportCategories.includes('all') || exportCategories.includes('stats') ? 
                        usersData.map(user => ({
                            userId: user.id,
                            userName: user.name,
                            stats: calculateUserStats(user.battles || [])
                        })) : []
                },
                categories: {
                    missionTypes: getUniqueValues(usersData, 'battles', 'missionType'),
                    missionNames: getUniqueValues(usersData, 'battles', 'missionName'),
                    vehicles: getUniqueVehicles(usersData),
                    awards: getUniqueAwards(usersData)
                }
            };

            const jsonString = JSON.stringify(v2Backup, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = generateFilename('v2', exportNotes);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMessage("Data exported successfully in V2 format!");
        } catch (error) {
            console.error("Error exporting data:", error);
            showMessage("Failed to export data.", "error");
        }
    };

    // Helper function to calculate user stats
    const calculateUserStats = (battles) => {
        if (!battles || battles.length === 0) return {};
        
        const totalBattles = battles.length;
        const victories = battles.filter(b => b.result === 'Victory').length;
        const defeats = battles.filter(b => b.result === 'Defeat').length;
        const winRate = totalBattles > 0 ? (victories / totalBattles * 100).toFixed(2) : 0;
        
        const totalKills = battles.reduce((sum, b) => sum + (b.killsAircraft || 0) + (b.killsGround || 0), 0);
        const totalAssists = battles.reduce((sum, b) => sum + (b.assists || 0), 0);
        const totalEarnedSL = battles.reduce((sum, b) => sum + (b.earnedSL || 0), 0);
        const totalEarnedRP = battles.reduce((sum, b) => sum + (b.totalRP || 0), 0);
        
        return {
            totalBattles,
            victories,
            defeats,
            winRate: parseFloat(winRate),
            totalKills,
            totalAssists,
            totalEarnedSL,
            totalEarnedRP,
            averageKills: totalBattles > 0 ? (totalKills / totalBattles).toFixed(2) : 0,
            averageAssists: totalBattles > 0 ? (totalAssists / totalBattles).toFixed(2) : 0,
            averageEarnedSL: totalBattles > 0 ? Math.round(totalEarnedSL / totalBattles) : 0,
            averageEarnedRP: totalBattles > 0 ? Math.round(totalEarnedRP / totalBattles) : 0
        };
    };

    // Helper function to get unique values from battles
    const getUniqueValues = (users, battleField, valueField) => {
        const values = new Set();
        users.forEach(user => {
            if (user[battleField]) {
                user[battleField].forEach(battle => {
                    if (battle[valueField]) {
                        values.add(battle[valueField]);
                    }
                });
            }
        });
        return Array.from(values).sort();
    };

    // Helper function to get unique vehicles
    const getUniqueVehicles = (users) => {
        const vehicles = new Set();
        users.forEach(user => {
            if (user.battles) {
                user.battles.forEach(battle => {
                    if (battle.damagedVehicles) {
                        battle.damagedVehicles.forEach(vehicle => vehicles.add(vehicle));
                    }
                });
            }
        });
        return Array.from(vehicles).sort();
    };

    // Helper function to get unique awards
    const getUniqueAwards = (users) => {
        const awards = new Set();
        users.forEach(user => {
            if (user.battles) {
                user.battles.forEach(battle => {
                    if (battle.detailedAwards) {
                        battle.detailedAwards.forEach(award => awards.add(award.award));
                    }
                });
            }
        });
        return Array.from(awards).sort();
    };

    const handleExportData = () => {
        if (exportFormat === 'v1') {
            handleExportDataV1();
        } else {
            handleExportDataV2();
        }
    };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) {
            showMessage("No file selected.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Handle V2 format
                if (importedData.metadata && importedData.metadata.version === "2.0") {
                    if (importedData.data && importedData.data.users) {
                        sessionStorage.setItem('warThunderUsers', JSON.stringify(importedData.data.users));
                        setUsers(importedData.data.users);
                        showMessage(`V2 data imported successfully! ${importedData.metadata.totalUsers} users, ${importedData.metadata.totalBattles} battles. Page will reload to apply changes.`);
                        window.location.reload();
                        return;
                    }
                }
                
                // Handle V1 format (backward compatibility)
                if (Array.isArray(importedData) && importedData.every(user => user.id && user.name && Array.isArray(user.battles))) {
                    sessionStorage.setItem('warThunderUsers', JSON.stringify(importedData));
                    setUsers(importedData);
                    showMessage("V1 data imported successfully! Page will reload to apply changes.");
                    window.location.reload();
                } else {
                    showMessage("Invalid file format. Please import a valid War Thunder stats JSON.", "error");
                }
            } catch (error) {
                console.error("Error importing data:", error);
                showMessage("Failed to import data. Ensure it's a valid JSON file.", "error");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-xl shadow-lg mb-8 text-gray-100 border-2 border-gray-700 animate-fade-in">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <Users size={24} /> <span>Data Management & Profiles</span>
            </h2>

            <UserProfileEditor
                users={users}
                setUsers={setUsers}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
            />

            <BattleDataEntryComponent
                users={users}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                battleDataInput={battleDataInput}
                setBattleDataInput={setBattleDataInput}
                handleProcessBattleData={handleProcessBattleData}
                loading={loading}
            />

            <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 mb-8">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                    <Upload size={24} /> <Download size={24} className="ml-1" /> <span>Backup and Restore Data</span>
                </h3>
                
                {/* Export Settings */}
                <div className="mb-6 bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                    <h4 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center space-x-2">
                        <Settings size={20} /> <span>Export Settings</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-300 text-sm font-bold mb-2">Export Format:</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="v2"
                                        checked={exportFormat === 'v2'}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className="text-gray-300">V2 (Recommended)</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="v1"
                                        checked={exportFormat === 'v1'}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className="text-gray-300">V1 (Legacy)</span>
                                </label>
                            </div>
                        </div>
                        
                        {exportFormat === 'v2' && (
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Export Categories:</label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'users', 'battles', 'stats'].map(category => (
                                        <label key={category} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={exportCategories.includes(category)}
                                                onChange={(e) => {
                                                    if (category === 'all') {
                                                        setExportCategories(e.target.checked ? ['all'] : []);
                                                    } else {
                                                        setExportCategories(prev => {
                                                            const newCats = prev.filter(c => c !== 'all');
                                                            if (e.target.checked) {
                                                                return [...newCats, category];
                                                            } else {
                                                                return newCats.filter(c => c !== category);
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="mr-1"
                                            />
                                            <span className="text-gray-300 text-sm capitalize">{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {exportFormat === 'v2' && (
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2">Export Notes (Optional):</label>
                            <input
                                type="text"
                                value={exportNotes}
                                onChange={(e) => setExportNotes(e.target.value)}
                                placeholder="e.g., Pre-update backup, Major changes, etc."
                                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={50}
                            />
                        </div>
                    )}
                </div>

                <div className="mb-6 bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                    <h4 className="text-xl font-semibold text-yellow-300 mb-3">Export Data</h4>
                    <p className="text-gray-300 mb-4">
                        {exportFormat === 'v2' 
                            ? "Download your data in the new V2 format with better organization, categories, and metadata."
                            : "Download all your saved user and battle data to your computer as a JSON file for safekeeping."
                        }
                    </p>
                    <button
                        onClick={handleExportData}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                        <Download size={20} /> <span>Export Data to PC ({exportFormat.toUpperCase()})</span>
                    </button>
                </div>

                <div className="mb-6 bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                    <h4 className="text-xl font-semibold text-yellow-300 mb-3">Import Data</h4>
                    <p className="text-gray-300 mb-4">
                        Upload a previously exported JSON file to restore your data. Supports both V1 and V2 formats. <span className="font-bold text-red-400">This will overwrite your current data.</span>
                    </p>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="block w-full text-sm text-gray-300
                                   file:mr-4 file:py-2 file:px-4
                                   file:rounded-xl file:border-0
                                   file:text-sm file:font-semibold
                                   file:bg-green-700 file:text-white
                                   hover:file:bg-green-800
                                   transition duration-300 ease-in-out"
                    />
                </div>

                {/* Format Comparison */}
                <div className="bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                    <h4 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center space-x-2">
                        <FileText size={20} /> <span>Format Comparison</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h5 className="font-bold text-blue-400 mb-2">V1 Format (Legacy)</h5>
                            <ul className="text-gray-300 space-y-1">
                                <li>• Single-line JSON</li>
                                <li>• Basic data structure</li>
                                <li>• Smaller file size</li>
                                <li>• Less readable</li>
                                <li>• No metadata</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-bold text-green-400 mb-2">V2 Format (Recommended)</h5>
                            <ul className="text-gray-300 space-y-1">
                                <li>• Formatted, readable JSON</li>
                                <li>• Organized categories</li>
                                <li>• Metadata and notes</li>
                                <li>• Summary statistics</li>
                                <li>• Better organization</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagementPage;
