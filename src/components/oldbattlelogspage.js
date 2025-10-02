import React, { useState, useCallback } from 'react';
import { FileText, Trash2, Edit2, Save, XCircle, Eye, ArrowUp, ArrowDown, Calendar, Hash, Map, BadgeCheck, Swords, Plane, Car } from 'lucide-react';
import { showMessage } from '../utils/helpers';
import ItemTypeIcon from './ItemTypeIcon';
import BattlePreviewOverlay from './BattlePreviewOverlay';

const formatDateParts = (dateStr) => {
    if (!dateStr) return { date: 'N/A', time: '' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        return { date: 'Invalid Date', time: '' };
    }
    const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    return { date, time };
};

const BattleLogsPage = ({ users, setUsers, selectedUserId, setSelectedUserId }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingBattleData, setEditingBattleData] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    // removed standalone raw JSON modal; use BattlePreviewOverlay raw tab instead
    const [sortColumn, setSortColumn] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [killsSortType, setKillsSortType] = useState('total'); // 'total', 'air', 'ground'
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayBattle, setOverlayBattle] = useState(null);

    const currentUser = users.find(u => u.id === selectedUserId);
    const battles = currentUser?.battles || [];

    const handleEdit = useCallback((idx) => {
        setEditingIndex(idx);
        const battleToEdit = battles[idx];
        setEditingBattleData({
            result: battleToEdit.result || 'Unknown',
            missionType: battleToEdit.missionType || '',
            missionName: battleToEdit.missionName || '',
            killsAircraft: battleToEdit.killsAircraft || 0,
            killsGround: battleToEdit.killsGround || 0,
            assists: battleToEdit.assists || 0,
            severeDamage: battleToEdit.severeDamage || 0,
            criticalDamage: battleToEdit.criticalDamage || 0,
            damage: battleToEdit.damage || 0,
            earnedSL: battleToEdit.earnedSL || 0,
            earnedCRP: battleToEdit.earnedCRP || 0,
            totalRP: battleToEdit.totalRP || 0,
            activity: battleToEdit.activity || 0,
            session: battleToEdit.session || '',
            timestamp: battleToEdit.timestamp || '',
            rawText: battleToEdit.rawText || ''
        });
        setShowEditModal(true);
    }, [battles]);

    const handleEditSave = useCallback(() => {
        if (!editingBattleData.missionName.trim() || !editingBattleData.timestamp.trim()) {
            showMessage('Mission name and timestamp cannot be empty.', 'error');
            return;
        }
        const updatedUsers = users.map(u => {
            if (u.id !== selectedUserId) return u;
            const newBattles = [...u.battles];
            newBattles[editingIndex] = {
                ...newBattles[editingIndex],
                result: editingBattleData.result,
                missionType: editingBattleData.missionType,
                missionName: editingBattleData.missionName,
                killsAircraft: parseInt(editingBattleData.killsAircraft, 10) || 0,
                killsGround: parseInt(editingBattleData.killsGround, 10) || 0,
                assists: parseInt(editingBattleData.assists, 10) || 0,
                severeDamage: parseInt(editingBattleData.severeDamage, 10) || 0,
                criticalDamage: parseInt(editingBattleData.criticalDamage, 10) || 0,
                damage: parseInt(editingBattleData.damage, 10) || 0,
                earnedSL: parseInt(editingBattleData.earnedSL, 10) || 0,
                earnedCRP: parseInt(editingBattleData.earnedCRP, 10) || 0,
                totalRP: parseInt(editingBattleData.totalRP, 10) || 0,
                activity: parseFloat(editingBattleData.activity) || 0,
                session: editingBattleData.session,
                timestamp: editingBattleData.timestamp,
                rawText: editingBattleData.rawText
            };
            return { ...u, battles: newBattles };
        });
        setUsers(updatedUsers);
        showMessage('Battle log updated!', 'success');
        handleEditCancel();
    }, [editingBattleData, editingIndex, selectedUserId, setUsers, users]);

    const handleEditCancel = useCallback(() => {
        setEditingIndex(null);
        setEditingBattleData({});
        setShowEditModal(false);
    }, []);

    const handleDelete = useCallback((idx) => {
        setShowConfirm(true);
        setDeleteIndex(idx);
    }, []);

    const confirmDelete = useCallback(() => {
        const updatedUsers = users.map(u => {
            if (u.id !== selectedUserId) return u;
            const newBattles = u.battles.filter((_, i) => i !== deleteIndex);
            return { ...u, battles: newBattles };
        });
        setUsers(updatedUsers);
        showMessage('Battle log deleted.', 'success');
        setShowConfirm(false);
        setDeleteIndex(null);
    }, [deleteIndex, selectedUserId, setUsers, users]);

    const cancelDelete = useCallback(() => {
        setShowConfirm(false);
        setDeleteIndex(null);
    }, []);

    // raw JSON actions removed

    const handleSort = useCallback((column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn, sortDirection]);

    const handleKillsSortType = (type) => {
        setKillsSortType(type);
        setSortColumn('kills');
    };

    const getKillsValue = (battle) => {
        if (killsSortType === 'air') return battle.killsAircraft || 0;
        if (killsSortType === 'ground') return battle.killsGround || 0;
        return (battle.killsAircraft || 0) + (battle.killsGround || 0);
    };

    const sortedBattles = [...battles].sort((a, b) => {
        let valA, valB;
        switch (sortColumn) {
            case 'timestamp':
                valA = new Date(a.timestamp || 0).getTime();
                valB = new Date(b.timestamp || 0).getTime();
                break;
            case 'missionName':
                valA = (a.missionName || '').toLowerCase();
                valB = (b.missionName || '').toLowerCase();
                break;
            case 'kills':
                valA = getKillsValue(a);
                valB = getKillsValue(b);
                break;
            case 'result':
                // Sort Victory > Defeat > Unknown by default
                const order = { 'Victory': 2, 'Defeat': 1, 'Unknown': 0 };
                valA = order[a.result] ?? 0;
                valB = order[b.result] ?? 0;
                break;
            case 'sl':
                valA = a.earnedSL || 0;
                valB = b.earnedSL || 0;
                break;
            case 'rp':
                valA = a.totalRP || 0;
                valB = b.totalRP || 0;
                break;
            case 'crp':
                valA = a.earnedCRP || 0;
                valB = b.earnedCRP || 0;
                break;
            default:
                return 0;
        }
        if (valA < valB) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <div className="w-full max-w-7xl bg-gray-800 p-8 rounded-xl shadow-lg mb-8 text-gray-100 border-2 border-gray-700 animate-fade-in mx-auto">
            <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <FileText size={28} className="text-yellow-500" /> <span className="drop-shadow-md">Battle Logs</span>
            </h2>
            <div className="mb-6">
                <label htmlFor="user-select-logs" className="block text-gray-300 text-sm font-bold mb-2">
                    Select User:
                </label>
                <select
                    id="user-select-logs"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                >
                    <option value="">-- Select a user --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </div>
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-xl shadow-xl text-center border border-gray-600 animate-scale-in">
                        <p className="mb-6 text-xl font-semibold text-yellow-400">Are you sure you want to delete this battle log?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDelete}
                                className="px-8 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Delete
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="px-8 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-600 w-11/12 md:w-3/4 lg:w-1/2 max-h-[90vh] flex flex-col animate-scale-in">
                        <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                            <Edit2 size={24} className="text-yellow-500" /> <span className="drop-shadow-md">Edit Battle Log</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 overflow-y-auto custom-scrollbar pr-2">
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-result">Result:</label>
                                <select
                                    id="edit-result"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.result || ''}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, result: e.target.value }))}
                                >
                                    <option value="Victory">Victory</option>
                                    <option value="Defeat">Defeat</option>
                                    <option value="Unknown">Unknown</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-mission-type">Mission Type:</label>
                                <input
                                    type="text"
                                    id="edit-mission-type"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.missionType || ''}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, missionType: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-mission-name">Mission Name:</label>
                                <input
                                    type="text"
                                    id="edit-mission-name"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.missionName || ''}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, missionName: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-timestamp">Timestamp:</label>
                                <input
                                    type="datetime-local"
                                    id="edit-timestamp"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.timestamp ? new Date(editingBattleData.timestamp).toISOString().slice(0, 16) : ''}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, timestamp: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-kills-aircraft">Aircraft Kills:</label>
                                <input
                                    type="number"
                                    id="edit-kills-aircraft"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.killsAircraft}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, killsAircraft: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-kills-ground">Ground Kills:</label>
                                <input
                                    type="number"
                                    id="edit-kills-ground"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.killsGround}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, killsGround: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-assists">Assists:</label>
                                <input
                                    type="number"
                                    id="edit-assists"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.assists}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, assists: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-severe-damage">Severe Damage:</label>
                                <input
                                    type="number"
                                    id="edit-severe-damage"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.severeDamage}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, severeDamage: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-critical-damage">Critical Damage:</label>
                                <input
                                    type="number"
                                    id="edit-critical-damage"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.criticalDamage}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, criticalDamage: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-damage">Damage:</label>
                                <input
                                    type="number"
                                    id="edit-damage"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.damage}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, damage: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-earned-sl">Earned SL:</label>
                                <input
                                    type="number"
                                    id="edit-earned-sl"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.earnedSL}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, earnedSL: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-earned-crp">Earned CRP:</label>
                                <input
                                    type="number"
                                    id="edit-earned-crp"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.earnedCRP}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, earnedCRP: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-total-rp">Total RP:</label>
                                <input
                                    type="number"
                                    id="edit-total-rp"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.totalRP}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, totalRP: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-activity">Activity (%):</label>
                                <input
                                    type="number"
                                    id="edit-activity"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.activity}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, activity: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-session">Session:</label>
                                <input
                                    type="text"
                                    id="edit-session"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBattleData.session}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, session: e.target.value }))}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="edit-raw-text">Raw Log Text:</label>
                                <textarea
                                    id="edit-raw-text"
                                    className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-gray-100 resize-y min-h-[160px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={8}
                                    value={editingBattleData.rawText}
                                    onChange={e => setEditingBattleData(prev => ({ ...prev, rawText: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-end mt-auto pt-4 border-t border-gray-700">
                            <button
                                onClick={handleEditSave}
                                className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-md"
                            >
                                <Save size={18} /> <span>Save</span>
                            </button>
                            <button
                                onClick={handleEditCancel}
                                className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-md"
                            >
                                <XCircle size={18} /> <span>Cancel</span>
                            </button>
                            <button
                                onClick={() => handleShowRaw(editingIndex)}
                                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-md"
                            >
                                <Eye size={18} /> <span>View Raw Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* raw JSON modal removed; handled inside BattlePreviewOverlay */}
            {currentUser && battles.length > 0 ? (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-300 font-semibold">Sort Kills By:</span>
                        <button
                            className={`px-3 py-1 rounded-xl font-bold text-sm transition duration-200 ${killsSortType === 'total' ? 'bg-yellow-500 text-gray-900 shadow' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            onClick={() => handleKillsSortType('total')}
                        >Total</button>
                        <button
                            className={`px-3 py-1 rounded-xl font-bold text-sm transition duration-200 ${killsSortType === 'air' ? 'bg-blue-500 text-gray-900 shadow' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            onClick={() => handleKillsSortType('air')}
                        >Air</button>
                        <button
                            className={`px-3 py-1 rounded-xl font-bold text-sm transition duration-200 ${killsSortType === 'ground' ? 'bg-green-500 text-gray-900 shadow' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            onClick={() => handleKillsSortType('ground')}
                        >Ground</button>
                    </div>
                </div>
            ) : (
                <p className="text-gray-400 text-center mt-8 p-4 bg-gray-700 rounded-lg border border-gray-600 shadow-inner">
                    {selectedUserId ? 'No battle logs found for this user.' : 'Select a user from the dropdown to view their battle logs.'}
                </p>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-lg mt-4">
                <table className="w-full text-sm text-gray-200 table-fixed">
                    <colgroup>
                        <col style={{ width: '48px' }} />
                        <col style={{ width: '180px' }} />
                        <col />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '120px' }} />
                    </colgroup>
                    <thead className="text-yellow-300 bg-gray-700 uppercase shadow-md">
                        <tr className="text-lg font-extrabold">
                            <th scope="col" className="text-center py-3 px-2 align-bottom w-12" aria-sort="none" title="Row index">
                                <div className="flex items-center justify-center gap-1"><Hash size={16} aria-hidden="true" /></div>
                            </th>
                            <th
                                scope="col"
                                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 align-bottom"
                                onClick={() => handleSort('timestamp')}
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} /> <span>Date</span>
                                    {sortColumn === 'timestamp' && (
                                        <span className="ml-1 flex items-center">{sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}</span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 align-bottom"
                                onClick={() => handleSort('missionName')}
                            >
                                <div className="flex items-center gap-2"><Map size={16} /> <span>Mission</span>
                                    {sortColumn === 'missionName' && (
                                        <span className="ml-1 flex items-center">{sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}</span>
                                    )}
                                </div>
                            </th>
                            <th scope="col" className="text-center py-3 px-4 cursor-pointer hover:bg-gray-600 transition-colors duration-200" onClick={() => handleSort('result')}>
                                <div className="flex items-center justify-center gap-2"><BadgeCheck size={16} /> <span>Result</span> {sortColumn==='result' && (<span className="ml-1 flex items-center">{sortDirection==='asc'?<ArrowUp size={16} />:<ArrowDown size={16} />}</span>)}</div>
                            </th>
                            <th
                                scope="col"
                                className="text-center py-3 px-4 cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                                onClick={() => handleSort('kills')}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Swords size={16} /> <span>Kills</span>
                                    {sortColumn === 'kills' && (
                                        <span className="ml-1 flex items-center">{sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}</span>
                                    )}
                                    <span className="ml-2 text-xs font-normal text-gray-300 bg-gray-800 px-2 py-0.5 rounded" title="Kill filter">{killsSortType === 'total' ? 'Total' : killsSortType === 'air' ? 'Air' : 'Ground'}</span>
                                </div>
                            </th>
                            <th scope="col" className="text-center py-3 px-4 cursor-pointer hover:bg-gray-600 transition-colors duration-200" onClick={() => handleSort('sl')} title="Sort by Silver Lions">
                                <div className="flex items-center justify-center gap-2"><ItemTypeIcon type="warpoints" size="xs" /> <span>SL</span> {sortColumn==='sl' && (sortDirection==='asc'?<ArrowUp size={16} />:<ArrowDown size={16} />)}</div>
                            </th>
                            <th scope="col" className="text-center py-3 px-4 cursor-pointer hover:bg-gray-600 transition-colors duration-200" onClick={() => handleSort('rp')} title="Sort by Research Points">
                                <div className="flex items-center justify-center gap-2"><ItemTypeIcon type="rp" size="xs" /> <span>RP</span> {sortColumn==='rp' && (sortDirection==='asc'?<ArrowUp size={16} />:<ArrowDown size={16} />)}</div>
                            </th>
                            <th scope="col" className="text-center py-3 px-4 cursor-pointer hover:bg-gray-600 transition-colors duration-200" onClick={() => handleSort('crp')} title="Sort by Convertible RP">
                                <div className="flex items-center justify-center gap-2"><ItemTypeIcon type="crp" size="xs" /> <span>CRP</span> {sortColumn==='crp' && (sortDirection==='asc'?<ArrowUp size={16} />:<ArrowDown size={16} />)}</div>
                            </th>
                            <th scope="col" className="text-center py-3 px-4 align-bottom" title="Snippet"><div className="flex items-center justify-center gap-2"><Eye size={16} aria-hidden="true" /></div></th>
                            <th className="text-center py-1 px-4 align-bottom" title="Actions">
                                <div className="flex items-center justify-center gap-2">
                                    <span>Actions</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBattles.map((battle, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-700 hover:bg-gray-800 transition-colors duration-150"
                            >
                                <td className="py-3 px-4">{idx + 1}</td>
                                <td className="py-3 px-4">
                                    {(() => { const {date,time} = formatDateParts(battle.timestamp); return (
                                        <div className="leading-tight">
                                            <div className="font-semibold text-gray-100">{date}</div>
                                            <div className="text-xs text-gray-400">{time}</div>
                                        </div>
                                    );})()}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2" title={((battle.killsAircraft||0) >= (battle.killsGround||0)) ? 'Aviation-focused battle' : 'Ground-focused battle'}>
                                        {((battle.killsAircraft||0) >= (battle.killsGround||0)) ? (
                                            <Plane size={16} className="text-blue-300" aria-hidden="true" />
                                        ) : (
                                            <Car size={16} className="text-green-300" aria-hidden="true" />
                                        )}
                                        <span>{battle.missionName || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <BadgeCheck size={16} className={`${battle.result==='Victory' ? 'text-green-400' : battle.result==='Defeat' ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${battle.result === 'Victory' ? 'bg-green-700 text-green-100' : battle.result === 'Defeat' ? 'bg-red-700 text-red-100' : 'bg-gray-700 text-gray-200'}`}>
                                            {battle.result || 'Unknown'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Swords size={16} className="text-gray-300" aria-hidden="true" />
                                        <span className="tabular-nums">{getKillsValue(battle)}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <ItemTypeIcon type="warpoints" size="xs" />
                                        <span className="tabular-nums">{(battle.earnedSL || 0).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <ItemTypeIcon type="rp" size="xs" />
                                        <span className="tabular-nums">{(battle.totalRP || 0).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <ItemTypeIcon type="crp" size="xs" />
                                        <span className="tabular-nums">{(battle.earnedCRP || 0).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 max-w-xs truncate" title={battle.rawText || ''}>
                                    <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                        {(battle.rawText || '').slice(0, 60)}{(battle.rawText || '').length > 60 ? '...' : ''}
                                    </span>
                                </td>
                                <td className="py-3 px-4 flex items-center space-x-2 justify-center">
                                    <button onClick={() => { setOverlayBattle(battle); setOverlayOpen(true); }} className="text-yellow-400 hover:text-yellow-500 transition-colors duration-150" title="View">
                                        <Eye size={20} />
                                    </button>
                                    <button onClick={() => handleEdit(idx)} className="text-blue-400 hover:text-blue-600 transition-colors duration-150" title="Edit">
                                        <Edit2 size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(idx)} className="text-red-400 hover:text-red-600 transition-colors duration-150" title="Delete">
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Overlay */}
            <BattlePreviewOverlay
              isOpen={overlayOpen}
              onClose={() => setOverlayOpen(false)}
              battle={overlayBattle}
              context="logs"
              onEdit={overlayBattle ? () => { const idx = battles.findIndex(b => b === overlayBattle); if (idx >= 0) handleEdit(idx); } : undefined}
              onDelete={overlayBattle ? () => { const idx = battles.findIndex(b => b === overlayBattle); if (idx >= 0) handleDelete(idx); setOverlayOpen(false); } : undefined}
            />
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #374151;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #a78b4f;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d97706;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default BattleLogsPage;
