import React, { useState, useEffect } from 'react';
import { Users, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { showMessage } from '../utils/helpers';

const UserProfileEditor = ({ users, setUsers, selectedUserId, setSelectedUserId }) => {
    const [editingUserId, setEditingUserId] = useState('');
    const [currentUserName, setCurrentUserName] = useState('');
    const [currentUserTitle, setCurrentUserTitle] = useState(''); // New title field
    const [currentUserLevel, setCurrentUserLevel] = useState('');
    const [currentUserGaijinId, setCurrentUserGaijinId] = useState('');
    const [currentUserRank, setCurrentUserRank] = useState('');
    const [currentUserFavVehicle, setCurrentUserFavVehicle] = useState('');
    const [currentUserSquadron, setCurrentUserSquadron] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (editingUserId) {
            const user = users.find(u => u.id === editingUserId);
            if (user) {
                setCurrentUserName(user.name);
                setCurrentUserTitle(user.title || ''); // Load title
                setCurrentUserLevel(user.level || '');
                setCurrentUserGaijinId(user.gaijinId || '');
                setCurrentUserRank(user.rank || '');
                setCurrentUserFavVehicle(user.favoriteVehicle || '');
                setCurrentUserSquadron(user.squadron || '');
            }
        } else {
            setCurrentUserName('');
            setCurrentUserTitle(''); // Clear title
            setCurrentUserLevel('');
            setCurrentUserGaijinId('');
            setCurrentUserRank('');
            setCurrentUserFavVehicle('');
            setCurrentUserSquadron('');
        }
    }, [editingUserId, users]);

    const handleCreateOrUpdateUser = () => {
        if (!currentUserName.trim()) {
            showMessage("User name cannot be empty.", "error");
            return;
        }

        if (editingUserId) {
            // Update existing user
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === editingUserId
                    ? {
                        ...user,
                        name: currentUserName.trim(),
                        title: currentUserTitle.trim(), // Save title
                        level: currentUserLevel.trim(),
                        gaijinId: currentUserGaijinId.trim(),
                        rank: currentUserRank.trim(),
                        favoriteVehicle: currentUserFavVehicle.trim(),
                        squadron: currentUserSquadron.trim()
                    }
                    : user
            ));
            showMessage(`User "${currentUserName.trim()}" updated successfully!`);
        } else {
            // Create new user
            const newUser = {
                id: crypto.randomUUID(),
                name: currentUserName.trim(),
                title: currentUserTitle.trim(), // Save title
                level: currentUserLevel.trim(),
                gaijinId: currentUserGaijinId.trim(),
                rank: currentUserRank.trim(),
                favoriteVehicle: currentUserFavVehicle.trim(),
                squadron: currentUserSquadron.trim(),
                battles: []
            };
            setUsers(prevUsers => [...prevUsers, newUser]);
            setSelectedUserId(newUser.id); // Automatically select the new user
            showMessage(`User "${newUser.name}" created successfully!`);
        }
        // Clear form after action
        setEditingUserId('');
        setCurrentUserName('');
        setCurrentUserTitle(''); // Clear title
        setCurrentUserLevel('');
        setCurrentUserGaijinId('');
        setCurrentUserRank('');
        setCurrentUserFavVehicle('');
        setCurrentUserSquadron('');
    };

    const handleDeleteUser = (userIdToDelete) => {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userIdToDelete));
        if (selectedUserId === userIdToDelete) {
            setSelectedUserId(''); // Deselect if the current user is deleted
        }
        showMessage("User deleted successfully!", "info");
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.gaijinId && user.gaijinId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.title && user.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 mb-8">
            <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <Users size={24} /> <span>Manage User Profiles</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="user-name" className="block text-gray-300 text-sm font-bold mb-2">
                        User Name:
                    </label>
                    <input
                        type="text"
                        id="user-name"
                        value={currentUserName}
                        onChange={(e) => setCurrentUserName(e.target.value)}
                        placeholder="Enter user name"
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    />
                </div>
                <div>
                    <label htmlFor="user-title" className="block text-gray-300 text-sm font-bold mb-2">
                        Title:
                    </label>
                    <input
                        type="text"
                        id="user-title"
                        value={currentUserTitle}
                        onChange={(e) => setCurrentUserTitle(e.target.value)}
                        placeholder="e.g., Ace Pilot, Tank Commander"
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    />
                </div>
                <div>
                    <label htmlFor="user-level" className="block text-gray-300 text-sm font-bold mb-2">
                        Level:
                    </label>
                    <input
                        type="number"
                        id="user-level"
                        value={currentUserLevel}
                        onChange={(e) => setCurrentUserLevel(e.target.value)}
                        placeholder="e.g., 100"
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    />
                </div>
                <div>
                    <label htmlFor="gaijin-id" className="block text-gray-300 text-sm font-bold mb-2">
                        Gaijin ID:
                    </label>
                    <input
                        type="text"
                        id="gaijin-id"
                        value={currentUserGaijinId}
                        onChange={(e) => setCurrentUserGaijinId(e.target.value)}
                        placeholder="e.g., #123456789"
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    />
                </div>
                <div>
                    <label htmlFor="user-rank" className="block text-gray-300 text-sm font-bold mb-2">
                        Rank:
                    </label>
                    <input
                        type="text"
                        id="user-rank"
                        value={currentUserRank}
                        onChange={(e) => setCurrentUserRank(e.target.value)}
                        placeholder="e.g., Major"
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    />
                </div>
                <div>
                    <label htmlFor="fav-vehicle" className="block text-gray-300 text-sm font-bold mb-2">
                        Favorite Vehicle:
                    </label>
                    <input
                        type="text"
                        id="fav-vehicle"
                        value={currentUserFavVehicle}
                        onChange={(e) => setCurrentUserFavVehicle(e.target.value)}
                        placeholder="e.g., M1 Abrams"
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    />
                </div>
                <div>
                    <label htmlFor="squadron" className="block text-gray-300 text-sm font-bold mb-2">
                        Squadron:
                    </label>
                    <input
                        type="text"
                        id="squadron"
                        value={currentUserSquadron}
                        onChange={(e) => setCurrentUserSquadron(e.target.value)}
                        placeholder="e.g., [SQUAD]"
                        className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                    />
                </div>
            </div>

            <button
                onClick={handleCreateOrUpdateUser}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
                {editingUserId ? <Edit size={20} /> : <Plus size={20} />}
                <span>{editingUserId ? 'Update User Profile' : 'Create New User'}</span>
            </button>

            {users.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-4">Existing Users</h3>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search users by name or Gaijin ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-4 pl-10 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar rounded-xl border border-gray-700">
                        <table className="min-w-full bg-gray-900">
                            <thead className="sticky top-0 bg-gray-950">
                                <tr className="text-yellow-400 text-left uppercase text-sm leading-normal">
                                    <th className="py-3 px-6">Name</th>
                                    <th className="py-3 px-6">Title</th>
                                    <th className="py-3 px-6">Level</th>
                                    <th className="py-3 px-6">Gaijin ID</th>
                                    <th className="py-3 px-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800 transition duration-200 ease-in-out">
                                            <td className="py-3 px-6">{user.name}</td>
                                            <td className="py-3 px-6">{user.title || 'N/A'}</td>
                                            <td className="py-3 px-6">{user.level || 'N/A'}</td>
                                            <td className="py-3 px-6">{user.gaijinId || 'N/A'}</td>
                                            <td className="py-3 px-6 flex space-x-2">
                                                <button
                                                    onClick={() => setEditingUserId(user.id)}
                                                    className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-1 px-3 rounded-xl transition duration-300 transform hover:scale-105"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold py-1 px-3 rounded-xl transition duration-300 transform hover:scale-105"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-3 px-6 text-center text-gray-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileEditor;
