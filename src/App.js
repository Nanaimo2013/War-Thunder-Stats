import React, { useState, useEffect } from 'react';
import './App.css';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import StatsPage from './components/StatsPage';
import LeaderboardPage from './components/LeaderboardPage';
import PlayerComparisonPage from './components/PlayerComparisonPage';
import DataManagementPage from './components/DataManagementPage';
import AboutPage from './components/AboutPage';

const API_URL = 'http://localhost:4000/api';

const App = () => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [battles, setBattles] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [modalMessage, setModalMessage] = useState('');
    const [battleDataInput, setBattleDataInput] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [compareResults, setCompareResults] = useState([]);

    // Fetch all users on load
    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch battles and stats when selected user changes
    useEffect(() => {
        if (selectedUserId) {
            fetchBattles(selectedUserId);
            fetchStats(selectedUserId);
        } else {
            setBattles([]);
            setStats({});
        }
    }, [selectedUserId]);

    // Fetch users
    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
                if (data.users.length > 0 && !selectedUserId) {
                    setSelectedUserId(data.users[0].id);
                }
            }
        } catch (err) {
            alert('Failed to fetch users.');
        }
    };

    // Fetch users with battles data for homepage
    const fetchUsersWithBattles = async () => {
        try {
            const res = await fetch(`${API_URL}/users-with-battles`);
            const data = await res.json();
            if (data.success) {
                return data.users;
            }
        } catch (err) {
            console.error('Failed to fetch users with battles:', err);
            return [];
        }
    };

    // Fetch battles for a user
    const fetchBattles = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/users/${userId}/battles`);
            const data = await res.json();
            if (data.success) setBattles(data.battles);
        } catch (err) {
            setBattles([]);
        }
    };

    // Fetch stats for a user
    const fetchStats = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/users/${userId}/stats`);
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (err) {
            setStats({});
        }
    };

    // Add a new user
    const addUser = async (username) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (data.success) {
                await fetchUsers();
            } else {
                alert(data.message || 'Failed to add user.');
            }
        } catch (err) {
            alert('Failed to add user.');
        }
        setLoading(false);
    };

    // Delete a user
    const deleteUser = async (userId) => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
            await fetchUsers();
            if (selectedUserId === userId) setSelectedUserId('');
        } catch (err) {
            alert('Failed to delete user.');
        }
        setLoading(false);
    };

    // Edit user profile
    const editUserProfile = async (userId, profile) => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/users/${userId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            await fetchUsers();
        } catch (err) {
            alert('Failed to update profile.');
        }
        setLoading(false);
    };

    // Add a battle
    const addBattle = async (userId, battle) => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/users/${userId}/battles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(battle)
            });
            await fetchBattles(userId);
            await fetchStats(userId);
        } catch (err) {
            alert('Failed to add battle.');
        }
        setLoading(false);
    };

    // Delete a battle
    const deleteBattle = async (userId, battleId) => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/users/${userId}/battles/${battleId}`, { method: 'DELETE' });
            await fetchBattles(userId);
            await fetchStats(userId);
        } catch (err) {
            alert('Failed to delete battle.');
        }
        setLoading(false);
    };

    // Leaderboard
    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_URL}/leaderboard`);
            const data = await res.json();
            if (data.success) setLeaderboard(data.leaderboard);
        } catch (err) {
            setLeaderboard([]);
        }
    };

    // Player comparison
    const comparePlayers = async (usernames) => {
        try {
            const res = await fetch(`${API_URL}/compare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames })
            });
            const data = await res.json();
            if (data.success) setCompareResults(data.results);
        } catch (err) {
            setCompareResults([]);
        }
    };

    // Backup: Download all users and battles as JSON
    const backupData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/backup`);
            const data = await res.json();
            if (data.success) {
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `war_thunder_stats_backup_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showMessage("Data exported successfully!");
            } else {
                alert(data.message || 'Failed to export data.');
            }
        } catch (err) {
            alert('Failed to export data.');
        }
        setLoading(false);
    };

    // Restore/Import: Upload users and battles from JSON
    const restoreData = async (jsonData) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: jsonData })
            });
            const data = await res.json();
            if (data.success) {
                await fetchUsers(); // Refresh the users list
                showMessage("Data imported successfully!");
            } else {
                alert(data.message || 'Failed to import data.');
            }
        } catch (err) {
            alert('Failed to import data.');
        }
        setLoading(false);
    };

    // Add battle data (from DataManagementPage)
    const addBattlesToUser = async (battlesToAdd) => {
        if (!selectedUserId) {
            alert('Please select a user to add battle data to.');
            return;
        }
        if (!battlesToAdd.length) {
            alert('No valid battle data found to add.');
            return;
        }
        setModalMessage(`Are you sure you want to add ${battlesToAdd.length} battle(s) to this user?`);
        setConfirmAction(() => async () => {
            setLoading(true);
            try {
                for (const battle of battlesToAdd) {
                    await addBattle(selectedUserId, battle);
                }
                setBattleDataInput('');
                alert(`${battlesToAdd.length} battle(s) added successfully!`);
            } catch (err) {
                alert('Failed to process battle data.');
            }
            setLoading(false);
            setShowConfirmModal(false);
        });
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        if (confirmAction) confirmAction();
    };
    const handleCancel = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage />;
            case 'data-management':
                return (
                    <DataManagementPage
                        users={users}
                        setUsers={setUsers}
                        selectedUserId={selectedUserId}
                        setSelectedUserId={setSelectedUserId}
                        battleDataInput={battleDataInput}
                        setBattleDataInput={setBattleDataInput}
                        handleProcessBattleData={addBattlesToUser}
                        loading={loading}
                        backupData={backupData}
                        restoreData={restoreData}
                        addUser={addUser}
                        deleteUser={deleteUser}
                        editUserProfile={editUserProfile}
                    />
                );
            case 'stats':
                return (
                    <StatsPage
                        users={users}
                        selectedUserId={selectedUserId}
                        setSelectedUserId={setSelectedUserId}
                        stats={stats}
                        battles={battles}
                    />
                );
            case 'leaderboard':
                return <LeaderboardPage users={users} fetchLeaderboard={fetchLeaderboard} leaderboard={leaderboard} />;
            case 'compare-players':
                return <PlayerComparisonPage users={users} comparePlayers={comparePlayers} compareResults={compareResults} />;
            case 'about':
                return <AboutPage />;
            default:
                return <HomePage users={users} />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-950 font-inter text-gray-100">
            <div id="message-box" className="hidden"></div>
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