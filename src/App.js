import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';

// Import utilities
import { useSessionStorage, showMessage } from './utils/helpers';
import { calculateStats } from './utils/statsCalculator';
import { preloadCommonAssets } from './utils/assetManager';
import { StyleInjector } from './styles/wtTheme';

// Layout (always loaded)
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy-loaded pages
const HomePage           = lazy(() => import('./components/HomePage'));
const StatsPage          = lazy(() => import('./components/StatsPage'));
const LeaderboardPage    = lazy(() => import('./components/LeaderboardPage'));
const PlayerComparisonPage = lazy(() => import('./components/PlayerComparisonPage'));
const DataManagementPage = lazy(() => import('./components/DataManagementPage'));
const AboutPage          = lazy(() => import('./components/AboutPage'));
const BattleLogsPage     = lazy(() => import('./components/BattleLogsPage'));

function PageFallback() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,0.18)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'wt-spin 0.65s linear infinite' }} />
            <span style={{ color: '#475569', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Loading…</span>
        </div>
    );
}

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
        // Preload common UI assets (flags, item types, base vehicle icons)
        try { preloadCommonAssets(); } catch (e) { /* no-op */ }
    }, []);

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
                return <HomePage users={users} setCurrentPage={setCurrentPage} />;
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
            case 'battle-logs':
                return <BattleLogsPage users={users} setUsers={setUsers} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} />;
            case 'about':
                return <AboutPage />;
            default:
                return <HomePage users={users} setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div className="wt-page">
            <StyleInjector />

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="wt-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="wt-modal" style={{ maxWidth: 420 }}>
                        <p style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 24, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                            {modalMessage}
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button className="wt-btn wt-btn-ghost" onClick={handleCancel}>Cancel</button>
                            <button className="wt-btn wt-btn-success" onClick={handleConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar setCurrentPage={setCurrentPage} currentPage={currentPage} />

            <main style={{ flex: 1, width: '100%' }}>
                <Suspense fallback={<PageFallback />}>
                    {renderPage()}
                </Suspense>
            </main>

            <Footer />
        </div>
    );
};

export default App; 