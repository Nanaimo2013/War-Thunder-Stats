import React, { useState, useEffect } from 'react';
import './App.css';

// Import utilities
import { useSessionStorage, showMessage } from './utils/helpers';
import { calculateStats } from './utils/statsCalculator';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import StatsPage from './components/StatsPage';
import LeaderboardPage from './components/LeaderboardPage';
import PlayerComparisonPage from './components/PlayerComparisonPage';
import DataManagementPage from './components/DataManagementPage';
import AboutPage from './components/AboutPage';

// Main App Component
const App = () => {
    const [users, setUsers] = useSessionStorage('warThunderUsers', []);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [battleDataInput, setBattleDataInput] = useState('');
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState('home'); // 'home', 'data-management', 'stats', 'leaderboard', 'compare-players', 'about'

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [modalMessage, setModalMessage] = useState('');

    // Initialize selectedUserId if users exist
    useEffect(() => {
        if (users.length > 0 && !selectedUserId) {
            setSelectedUserId(users[0].id);
        }
    }, [users, selectedUserId]);

    // Recalculate stats whenever selected user or their battles change
    useEffect(() => {
        if (selectedUserId && users.length > 0) {
            const currentUser = users.find(u => u.id === selectedUserId);
            if (currentUser && currentUser.battles) {
                setStats(calculateStats(currentUser.battles));
            } else {
                setStats({});
            }
        } else {
            setStats({});
        }
    }, [selectedUserId, users]);

    // Process and save battle data
    const addBattlesToUser = (battlesToAdd) => {
        if (!selectedUserId) {
            showMessage("Please select a user to add battle data to.", "error");
            return;
        }

        if (battlesToAdd.length === 0) {
            showMessage("No valid battle data found to add.", "error");
            return;
        }

        setModalMessage(`Are you sure you want to add ${battlesToAdd.length} battle(s) to this user?`);
        setConfirmAction(() => () => {
            setLoading(true);
            try {
                setUsers(prevUsers => {
                    const updatedUsers = prevUsers.map(user =>
                        user.id === selectedUserId
                            ? { ...user, battles: [...(user.battles || []), ...battlesToAdd] }
                            : user
                    );
                    return updatedUsers;
                });

                setBattleDataInput(''); // Clear the main App's input state if it was used
                showMessage(`${battlesToAdd.length} battle(s) added successfully!`);
            } catch (error) {
                console.error("Error processing battle data:", error);
                showMessage("Failed to process battle data. Ensure the format is correct.", "error");
            } finally {
                setLoading(false);
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        if (confirmAction) {
            confirmAction();
        }
    };

    const handleCancel = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage users={users} />;
            case 'data-management':
                return (
                    <DataManagementPage
                        users={users}
                        setUsers={setUsers}
                        selectedUserId={selectedUserId}
                        setSelectedUserId={setSelectedUserId}
                        battleDataInput={battleDataInput} // This is now just for triggering parsing in child
                        setBattleDataInput={setBattleDataInput} // This is now just for triggering parsing in child
                        handleProcessBattleData={addBattlesToUser} // Pass the new function
                        loading={loading}
                    />
                );
            case 'stats':
                return (
                    <StatsPage
                        users={users}
                        selectedUserId={selectedUserId}
                        setSelectedUserId={setSelectedUserId}
                        stats={stats}
                        battles={users.find(u => u.id === selectedUserId)?.battles || []}
                    />
                );
            case 'leaderboard':
                return <LeaderboardPage users={users} />;
            case 'compare-players':
                return <PlayerComparisonPage users={users} />;
            case 'about':
                return <AboutPage />;
            default:
                return <HomePage users={users} />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-950 font-inter text-gray-100">
            <div id="message-box" className="hidden"></div> {/* Message box for showMessage */}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-xl shadow-xl text-center border border-gray-600">
                        <p className="mb-6 text-xl font-semibold text-yellow-400">{modalMessage}</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleConfirm}
                                className="px-8 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-8 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar setCurrentPage={setCurrentPage} currentPage={currentPage} />

            <main className="flex-grow w-full flex flex-col items-center p-4">
                {renderPage()}
            </main>

            <Footer />
        </div>
    );
};

export default App; 