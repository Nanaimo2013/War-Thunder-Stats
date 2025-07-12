import React from 'react';
import { Users, Upload, Download } from 'lucide-react';
import { showMessage } from '../utils/helpers';
import UserProfileEditor from './UserProfileEditor';
import BattleDataEntryComponent from './BattleDataEntry';

const DataManagementPage = ({ users, setUsers, selectedUserId, setSelectedUserId, battleDataInput, setBattleDataInput, handleProcessBattleData, loading, backupData, restoreData, addUser, deleteUser, editUserProfile }) => {
    const handleExportData = () => {
        if (backupData) {
            backupData();
        } else {
            showMessage("Backup function not available.", "error");
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
                // Basic validation: Check if it's an array and contains user data (support both old 'name' and new 'username' format)
                if (Array.isArray(importedData) && importedData.every(user => (user.username || user.name) && Array.isArray(user.battles))) {
                    if (restoreData) {
                        restoreData(importedData);
                    } else {
                        showMessage("Restore function not available.", "error");
                    }
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
                addUser={addUser}
                deleteUser={deleteUser}
                editUserProfile={editUserProfile}
                loading={loading}
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
                <div className="mb-6 bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                    <h4 className="text-xl font-semibold text-yellow-300 mb-3">Export Data</h4>
                    <p className="text-gray-300 mb-4">
                        Download all your saved user and battle data to your computer as a JSON file for safekeeping.
                    </p>
                    <button
                        onClick={handleExportData}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                        <Download size={20} /> <span>Export Data to PC</span>
                    </button>
                </div>

                <div className="mb-6 bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                    <h4 className="text-xl font-semibold text-yellow-300 mb-3">Import Data</h4>
                    <p className="text-gray-300 mb-4">
                        Upload a previously exported JSON file to restore your data. <span className="font-bold text-red-400">This will overwrite your current data.</span>
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
            </div>
        </div>
    );
};

export default DataManagementPage; 