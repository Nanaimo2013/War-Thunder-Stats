import React, { useState, useEffect } from 'react';
import { Plus, Upload, Eye, Trash2, ChevronDown, ChevronUp, Target, Sword, DollarSign, Zap, Trophy, Clock, Award, Users, FileText, Edit } from 'lucide-react';
import { parseBattleLog } from '../utils/battleParser';
import { showMessage } from '../utils/helpers';

const BattleDataEntryComponent = ({ users, selectedUserId, setSelectedUserId, battleDataInput, setBattleDataInput, handleProcessBattleData, loading }) => {
    const [parsedPreviews, setParsedPreviews] = useState([]);
    const [expandedPreviewId, setExpandedPreviewId] = useState(null);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonModalContent, setJsonModalContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Function to generate a unique hash for battle data to detect duplicates
    const generateBattleHash = (battleText) => {
        // Create a simple hash based on the first few lines that should be unique
        const lines = battleText.split('\n').slice(0, 3).join('').replace(/\s+/g, '');
        try {
            // Try btoa first, but fall back to a safer method if it fails
            return btoa(lines).slice(0, 20);
        } catch (error) {
            // Fallback: use a simple hash function that works with any characters
            let hash = 0;
            for (let i = 0; i < lines.length; i++) {
                const char = lines.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(36).slice(0, 20);
        }
    };

    // Function to validate battle data format
    const validateBattleData = (battleText) => {
        const trimmed = battleText.trim();
        
        // Check if it's empty
        if (!trimmed) {
            return { isValid: false, error: "Battle data is empty" };
        }

        // Check if it contains Victory or Defeat anywhere in the text (more flexible)
        if (!trimmed.match(/(Victory|Defeat) in the \[/)) {
            return { isValid: false, error: "Battle data must contain 'Victory' or 'Defeat' in the [mission]" };
        }

        // Check if it contains at least some of the required sections
        // Different battle logs may have different combinations of these sections
        const possibleSections = [
            'Destruction of',
            'Critical damage to the enemy',
            'Damage to the enemy',
            'Severe damage to the enemy',
            'Assistance in destroying the enemy',
            'Earned:',
            'Activity:',
            'Total:',
            'Activity Time',
            'Time Played',
            'Reward for',
            'Damaged Vehicles:',
            'Session:'
        ];
        
        const foundSections = possibleSections.filter(section => trimmed.includes(section));
        
        // Require at least 3 of the possible sections to be present
        if (foundSections.length < 3) {
            return { 
                isValid: false, 
                error: `Battle data must contain at least 3 valid sections. Found: ${foundSections.join(', ')}` 
            };
        }

        // Additional check: must have either "Earned:" or "Total:" section
        if (!trimmed.includes('Earned:') && !trimmed.includes('Total:')) {
            return { 
                isValid: false, 
                error: "Battle data must contain 'Earned:' or 'Total:' section" 
            };
        }

        return { isValid: true, error: null };
    };

    const handlePaste = (e) => {
        const pastedText = e.clipboardData.getData('text');
        setBattleDataInput(pastedText);
    };

    useEffect(() => {
        if (battleDataInput.trim() && !isProcessing) {
            setIsProcessing(true);
            
            // Process immediately without delay for better performance
            (() => {
                try {
                    // Split by common battle log start patterns (Victory/Defeat in the [...])
                    const logs = battleDataInput.split(/(?=(?:Defeat|Victory) in the \[.+?\] .+? mission!)/g)
                                                .filter(log => log.trim() !== '');
                    
                    const newPreviews = [];
                    
                    logs.forEach((log, index) => {
                        // Validate the battle data first
                        const validation = validateBattleData(log);
                        
                        if (!validation.isValid) {
                            newPreviews.push({
                                id: `error-${Date.now()}-${index}`,
                                status: 'error',
                                summary: `Validation Error ${index + 1}: ${validation.error}`,
                                details: null,
                                rawLog: log,
                                hash: generateBattleHash(log)
                            });
                            return;
                        }

                        try {
                            const parsed = parseBattleLog(log);
                            newPreviews.push({
                                id: parsed.id,
                                status: 'success',
                                summary: `${parsed.result} in ${parsed.missionName || 'Unknown Mission'} (Kills: ${parsed.killsGround + parsed.killsAircraft}, SL: ${parsed.earnedSL}, RP: ${parsed.totalRP})`,
                                details: parsed,
                                rawLog: log,
                                hash: generateBattleHash(log)
                            });
                        } catch (e) {
                            newPreviews.push({
                                id: `error-${Date.now()}-${index}`,
                                status: 'error',
                                summary: `Parsing Error ${index + 1}: ${e.message}`,
                                details: null,
                                rawLog: log,
                                hash: generateBattleHash(log)
                            });
                        }
                    });

                    // Filter out duplicates based on battle hash
                    setParsedPreviews(prevPreviews => {
                        const existingHashes = new Set(prevPreviews.map(p => p.hash));
                        const uniqueNewPreviews = newPreviews.filter(preview => !existingHashes.has(preview.hash));
                        
                        // Consolidate notification logic to show only one message
                        const validEntries = newPreviews.filter(p => p.status === 'success');
                        const duplicateEntries = newPreviews.length - uniqueNewPreviews.length;
                        const successCount = uniqueNewPreviews.filter(p => p.status === 'success').length;
                        const errorCount = uniqueNewPreviews.filter(p => p.status === 'error').length;
                        
                        // Show only one consolidated message
                        if (uniqueNewPreviews.length === 0 && validEntries.length > 0) {
                            showMessage("All entries are duplicates.", "warning");
                        } else if (uniqueNewPreviews.length === 0 && validEntries.length === 0) {
                            showMessage("All entries are duplicates or invalid.", "error");
                        } else if (successCount > 0) {
                            let message = `${successCount} new battle(s) ready to add.`;
                            if (duplicateEntries > 0) {
                                message += ` (${duplicateEntries} duplicate(s) filtered out)`;
                            }
                            if (errorCount > 0) {
                                message += ` (${errorCount} invalid entry(s) skipped)`;
                            }
                            showMessage(message, "success");
                        } else if (errorCount > 0) {
                            showMessage(`${errorCount} invalid entries found.`, "error");
                        }
                        
                        return [...prevPreviews, ...uniqueNewPreviews];
                    });

                    // Clear the input field after processing
                    setBattleDataInput('');
                    
                } catch (error) {
                    showMessage(`Processing error: ${error.message}`, "error");
                } finally {
                    setIsProcessing(false);
                }
            })(); // Execute immediately
        }
    }, [battleDataInput, isProcessing]);

    const togglePreview = (id) => {
        setExpandedPreviewId(prevId => (prevId === id ? null : id));
    };

    const deletePreviewBattle = (idToDelete) => {
        setParsedPreviews(prevPreviews => prevPreviews.filter(preview => preview.id !== idToDelete));
        showMessage("Battle preview removed.", "info");
    };

    const viewParsedJson = (details) => {
        setJsonModalContent(JSON.stringify(details, null, 2));
        setShowJsonModal(true);
    };

    const editPreview = (preview) => {
        // For now, just show a message - could be expanded to open an edit modal
        showMessage("Edit functionality coming soon!", "info");
    };

    // Function to format time in 12-hour format
    const formatTime = (timestamp) => {
        if (!timestamp) return 'Unknown';
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } catch (error) {
            return 'Invalid Time';
        }
    };

    // Function to format duration in a more readable way
    const formatDuration = (minutes) => {
        if (!minutes || minutes === 0) return '0 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    };

    const handleAddBattleData = () => {
        const successfulPreviews = parsedPreviews.filter(p => p.status === 'success');
        if (successfulPreviews.length > 0) {
            handleProcessBattleData(successfulPreviews.map(p => p.details));
            // Clear the previews after successful processing
            setParsedPreviews([]);
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl border border-gray-600 mb-8 animate-fade-in">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent mb-6 flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Plus size={28} className="text-yellow-400" />
                </div>
                <span>Add New Battle Data</span>
            </h3>
            <div className="mb-6">
                <label htmlFor="user-select-battle" className="block text-gray-300 text-sm font-bold mb-2">
                    Select User to Add Data To:
                </label>
                <select
                    id="user-select-battle"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300"
                >
                    <option value="">-- Select a user --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </div>

            <div className="mb-6">
                <label htmlFor="battle-data" className="block text-gray-300 text-sm font-bold mb-2">
                    Paste Battle Data (multiple entries can be pasted directly):
                </label>
                <textarea
                    id="battle-data"
                    rows="15"
                    value={battleDataInput}
                    onPaste={handlePaste}
                    onChange={(e) => setBattleDataInput(e.target.value)}
                    placeholder="Paste your War Thunder battle log(s) here. The system will automatically detect multiple entries.&#10;Example:&#10;Victory in the [Conquest #3] Carpathians mission!...&#10;Defeat in the [Domination] Sinai mission!..."
                    className="shadow appearance-none border border-gray-600 rounded-xl w-full py-2 px-3 bg-gray-900 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-y transition duration-300"
                    disabled={isProcessing}
                ></textarea>
                {isProcessing && (
                    <div className="mt-2 text-yellow-400 text-sm flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                        <span>Processing battle data...</span>
                    </div>
                )}
            </div>

            {parsedPreviews.length > 0 && (
                <div className="mb-8 bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-inner border border-gray-600 hover-lift">
                    <h4 className="text-2xl font-bold text-yellow-300 mb-6 flex items-center space-x-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Eye size={24} className="text-yellow-400" />
                        </div>
                        <span>Battle Data Preview ({parsedPreviews.length} entries)</span>
                    </h4>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-4">
                        {parsedPreviews.map((preview, index) => (
                            <div
                              key={preview.id}
                              className={`group relative rounded-xl border-2 transition-all duration-300 hover-lift ${
                                preview.status === 'error' 
                                  ? 'bg-red-900/50 border-red-600/50 hover:border-red-400 hover:shadow-red-500/20' 
                                  : 'bg-gradient-to-br from-gray-800/90 to-gray-700/90 border-gray-600/50 hover:border-yellow-500/70 hover:shadow-lg hover:shadow-yellow-500/20'
                              }`}
                            >
                                {/* Main preview content - NOT clickable */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                preview.status === 'error' 
                                                  ? 'bg-red-600 text-white' 
                                                  : 'bg-yellow-600 text-gray-900'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    {preview.details && (
                                                        <>
                                                            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                                                preview.details.result === 'Victory' 
                                                                  ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                                                                  : 'bg-red-600/20 text-red-400 border border-red-500/30'
                                                            }`}>
                                                                {preview.details.result}
                                                            </span>
                                                            <span className="text-gray-300 text-sm">
                                                                {preview.details.missionName || 'Unknown Mission'}
                                                            </span>
                                                        </>
                                                    )}
                                                    {preview.status === 'error' && (
                                                        <span className="text-red-400 text-sm font-medium">
                                                            {preview.summary}
                                                        </span>
                                                    )}
                                                </div>
                                                {preview.details && (
                                                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                                                        <div className="flex items-center space-x-1">
                                                            <Target size={12} className="text-red-400" />
                                                            <span>{preview.details.killsGround || 0}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Sword size={12} className="text-blue-400" />
                                                            <span>{preview.details.killsAircraft || 0}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <DollarSign size={12} className="text-green-400" />
                                                            <span>{(preview.details.earnedSL || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Zap size={12} className="text-purple-400" />
                                                            <span>{(preview.details.totalRP || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Action buttons */}
                                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            {preview.details && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); viewParsedJson(preview.details); }}
                                                    className="p-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30 transition-all duration-200 hover:scale-105"
                                                    title="View Raw Data"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deletePreviewBattle(preview.id); }}
                                                className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 transition-all duration-200 hover:scale-105"
                                                title="Remove from list"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {preview.details && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePreview(preview.id); }}
                                                    className="p-2 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 border border-gray-500/30 transition-all duration-200 hover:scale-105"
                                                    title={expandedPreviewId === preview.id ? "Collapse" : "Expand"}
                                                >
                                                    {expandedPreviewId === preview.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded inline content */}
                                {expandedPreviewId === preview.id && preview.details && (
                                    <div className="border-t border-gray-600/50 bg-gray-900/50 p-4 animate-fade-in">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {/* Combat Stats */}
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Combat</h5>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Target size={12} className="text-red-400" />
                                                            <span className="text-gray-300">Ground</span>
                                                        </div>
                                                        <span className="text-red-400 font-medium">{preview.details.killsGround || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Sword size={12} className="text-blue-400" />
                                                            <span className="text-gray-300">Air</span>
                                                        </div>
                                                        <span className="text-blue-400 font-medium">{preview.details.killsAircraft || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Award size={12} className="text-purple-400" />
                                                            <span className="text-gray-300">Assists</span>
                                                        </div>
                                                        <span className="text-purple-400 font-medium">{preview.details.assists || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Economy */}
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Economy</h5>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <DollarSign size={12} className="text-green-400" />
                                                            <span className="text-gray-300">SL</span>
                                                        </div>
                                                        <span className="text-green-400 font-medium">{(preview.details.earnedSL || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Zap size={12} className="text-purple-400" />
                                                            <span className="text-gray-300">RP</span>
                                                        </div>
                                                        <span className="text-purple-400 font-medium">{(preview.details.totalRP || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Trophy size={12} className="text-orange-400" />
                                                            <span className="text-gray-300">CRP</span>
                                                        </div>
                                                        <span className="text-orange-400 font-medium">{(preview.details.earnedCRP || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Performance */}
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Performance</h5>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Zap size={12} className="text-yellow-400" />
                                                            <span className="text-gray-300">Activity</span>
                                                        </div>
                                                        <span className="text-yellow-400 font-medium">{preview.details.activity || 0}%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Clock size={12} className="text-indigo-400" />
                                                            <span className="text-gray-300">Time</span>
                                                        </div>
                                                        <span className="text-indigo-400 font-medium">{preview.details.timePlayedRP || 0}min</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-1">
                                                            <Trophy size={12} className="text-amber-400" />
                                                            <span className="text-gray-300">Reward</span>
                                                        </div>
                                                        <span className="text-amber-400 font-medium">{(preview.details.rewardSL || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mission Info */}
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mission</h5>
                                                <div className="space-y-1">
                                                    <div className="text-sm">
                                                        <div className="text-gray-300 truncate" title={preview.details.missionName}>
                                                            {preview.details.missionName || 'Unknown'}
                                                        </div>
                                                        <div className="text-gray-400 text-xs">
                                                            {preview.details.missionType || 'Unknown Type'}
                                                        </div>
                                                    </div>
                                                    {preview.details.session && (
                                                        <div className="text-xs text-gray-400 truncate" title={preview.details.session}>
                                                            Session: {preview.details.session}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons in expanded view */}
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600/30">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); viewParsedJson(preview.details); }}
                                                    className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                                                >
                                                    View Raw Data
                                                </button>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedPreviewId(null); }}
                                                className="px-3 py-1 bg-gray-700/50 hover:bg-gray-700 text-gray-400 text-xs rounded-md transition-colors duration-200"
                                            >
                                                Collapse
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleAddBattleData}
                disabled={loading || isProcessing || !selectedUserId || parsedPreviews.length === 0 || parsedPreviews.some(p => p.status === 'error')}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
                {loading ? 'Processing...' : <><Upload size={20} /> <span>Add Battle Data</span></>}
            </button>

            {/* JSON Modal */}
            {showJsonModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-600 w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] flex flex-col">
                        <h3 className="text-xl font-bold text-yellow-400 mb-4">Parsed Battle Data (JSON)</h3>
                        <pre className="bg-gray-900 text-gray-200 p-4 rounded-md overflow-auto flex-grow text-sm custom-scrollbar">
                            <code>{jsonModalContent}</code>
                        </pre>
                        <button
                            onClick={() => setShowJsonModal(false)}
                            className="mt-4 px-6 py-2 bg-red-700 text-white rounded-xl hover:bg-red-800 transition duration-300 transform hover:scale-105"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BattleDataEntryComponent;
