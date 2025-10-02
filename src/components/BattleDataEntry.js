import React, { useState, useEffect } from 'react';
import { Plus, Upload, Eye, Trash2, ChevronDown, ChevronUp, Target, Sword, DollarSign, Zap, Trophy, Clock, Award, Users, FileText, Edit } from 'lucide-react';
import { parseBattleLog } from '../utils/battleParser';
import { showMessage } from '../utils/helpers';
import ItemTypeIcon from './ItemTypeIcon';
import CountryFlag from './CountryFlag';
import VehicleIcon from './VehicleIcon';
import BattlePreviewOverlay from './BattlePreviewOverlay';

const BattleDataEntryComponent = ({ users, selectedUserId, setSelectedUserId, battleDataInput, setBattleDataInput, handleProcessBattleData, loading }) => {
    const [parsedPreviews, setParsedPreviews] = useState([]);
    const [expandedPreviewId, setExpandedPreviewId] = useState(null);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonModalContent, setJsonModalContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayBattle, setOverlayBattle] = useState(null);
    const [editingPreview, setEditingPreview] = useState(null);

    // Function to generate a unique identifier for battle data to detect duplicates
    const generateBattleId = (battleText) => {
        try {
            // Extract session ID and battle time for more accurate duplicate detection
            const sessionMatch = battleText.match(/Session:\s+(.+)/);
            const sessionId = sessionMatch ? sessionMatch[1].trim() : '';
            
            // Extract battle time from detailed actions (use first kill/damage time)
            const timeMatches = battleText.match(/(\d{1,2}:\d{2})\s+/g);
            const battleTime = timeMatches && timeMatches.length > 0 ? timeMatches[0].trim() : '';
            
            // Extract result and mission info for additional uniqueness
            const resultMatch = battleText.match(/(Defeat|Victory) in the \[(.+?)\] (.+?) mission!/);
            const result = resultMatch ? resultMatch[1] : '';
            const missionType = resultMatch ? resultMatch[2] : '';
            const missionName = resultMatch ? resultMatch[3] : '';
            
            // Create a unique identifier based on session + time + mission
            const uniqueParts = [sessionId, battleTime, result, missionType, missionName].filter(Boolean);
            
            if (uniqueParts.length === 0) {
                // Fallback to original method if no identifiable parts found
                const lines = battleText.split('\n').slice(0, 3).join('').replace(/\s+/g, '');
            return btoa(lines).slice(0, 20);
            }
            
            // Create hash from meaningful battle identifiers
            const identifier = uniqueParts.join('|');
            return btoa(identifier).replace(/[+/=]/g, '').slice(0, 30);
            
        } catch (error) {
            // Fallback: use a simple hash function that works with any characters
            const lines = battleText.split('\n').slice(0, 3).join('').replace(/\s+/g, '');
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
                                hash: generateBattleId(log)
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
                                hash: generateBattleId(log)
                            });
                        } catch (e) {
                            newPreviews.push({
                                id: `error-${Date.now()}-${index}`,
                                status: 'error',
                                summary: `Parsing Error ${index + 1}: ${e.message}`,
                                details: null,
                                rawLog: log,
                                hash: generateBattleId(log)
                            });
                        }
                    });

                    // Filter out duplicates based on battle ID and existing user battles
                    setParsedPreviews(prevPreviews => {
                        const existingHashes = new Set(prevPreviews.map(p => p.hash));
                        
                        // Also check against existing battles in the selected user's data
                        const selectedUser = users.find(u => u.id === selectedUserId);
                        const existingUserBattleHashes = new Set();
                        
                        if (selectedUser && selectedUser.battles) {
                            selectedUser.battles.forEach(battle => {
                                if (battle.rawText) {
                                    const battleHash = generateBattleId(battle.rawText);
                                    existingUserBattleHashes.add(battleHash);
                                }
                            });
                        }
                        
                        // Filter out duplicates from both preview and existing user data
                        const uniqueNewPreviews = newPreviews.filter(preview => {
                            return !existingHashes.has(preview.hash) && !existingUserBattleHashes.has(preview.hash);
                        });
                        
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
        setEditingPreview(preview);
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
            <div className="mb-8">
                <label htmlFor="user-select-battle" className="block text-gray-200 text-sm font-semibold mb-3 flex items-center space-x-2">
                    <Users size={16} className="text-yellow-400" />
                    <span>Select User to Add Data To:</span>
                </label>
                <select
                    id="user-select-battle"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="shadow-lg appearance-none border-2 border-gray-600 rounded-xl w-full py-3 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 hover:border-gray-500"
                >
                    <option value="">-- Select a user --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </div>

            <div className="mb-8">
                <label htmlFor="battle-data" className="block text-gray-200 text-sm font-semibold mb-3 flex items-center space-x-2">
                    <FileText size={16} className="text-yellow-400" />
                    <span>Paste Battle Data (multiple entries can be pasted directly):</span>
                </label>
                <div className="relative">
                <textarea
                    id="battle-data"
                    rows="15"
                    value={battleDataInput}
                    onPaste={handlePaste}
                    onChange={(e) => setBattleDataInput(e.target.value)}
                        placeholder="Paste your War Thunder battle log(s) here. The system will automatically detect multiple entries.&#10;&#10;Example:&#10;Victory in the [Conquest #3] Carpathians mission!...&#10;Defeat in the [Domination] Sinai mission!..."
                        className="shadow-lg appearance-none border-2 border-gray-600 rounded-xl w-full py-4 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-y transition-all duration-300 hover:border-gray-500"
                    disabled={isProcessing}
                ></textarea>
                {isProcessing && (
                        <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-3 py-2 text-yellow-400 text-sm flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                            <span>Processing...</span>
                    </div>
                )}
                </div>
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
                                                            <ItemTypeIcon type="warpoints" size="xs" />
                                                            <span>{(preview.details.earnedSL || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <ItemTypeIcon type="rp" size="xs" />
                                                            <span>{(preview.details.totalRP || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Action buttons */}
                                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            {preview.details && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOverlayBattle(preview.details); setOverlayOpen(true); }}
                                                    className="p-3 rounded-xl bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 hover:from-yellow-600/30 hover:to-yellow-500/30 text-yellow-400 border-2 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/25"
                                                    title="Open in Full Overlay"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            {preview.details && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); editPreview(preview); }}
                                                    className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 text-blue-400 border-2 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25"
                                                    title="Edit Battle Data"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deletePreviewBattle(preview.id); }}
                                                className="p-3 rounded-xl bg-gradient-to-r from-red-600/20 to-red-500/20 hover:from-red-600/30 hover:to-red-500/30 text-red-400 border-2 border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                                                title="Remove from list"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            {preview.details && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePreview(preview.id); }}
                                                    className="p-3 rounded-xl bg-gradient-to-r from-gray-600/20 to-gray-500/20 hover:from-gray-600/30 hover:to-gray-500/30 text-gray-300 border-2 border-gray-500/30 hover:border-gray-400/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-gray-500/25"
                                                    title={expandedPreviewId === preview.id ? "Collapse Details" : "Expand Details"}
                                                >
                                                    {expandedPreviewId === preview.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded inline content */}
                                {expandedPreviewId === preview.id && preview.details && (
                                    <div className={`border-t border-gray-600/50 bg-gradient-to-br from-gray-900/60 to-gray-800/60 p-6 battle-preview-dropdown expanded`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {/* Combat Stats */}
                                            <div className="space-y-3 bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                                                <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wide flex items-center space-x-2">
                                                    <Target size={14} className="text-red-400" />
                                                    <span>Combat</span>
                                                </h5>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Target size={14} className="text-red-400" />
                                                            <span className="text-gray-300">Ground Kills</span>
                                                        </div>
                                                        <span className="text-red-400 font-bold text-lg">{preview.details.killsGround || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Sword size={14} className="text-blue-400" />
                                                            <span className="text-gray-300">Air Kills</span>
                                                        </div>
                                                        <span className="text-blue-400 font-bold text-lg">{preview.details.killsAircraft || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Award size={14} className="text-purple-400" />
                                                            <span className="text-gray-300">Assists</span>
                                                        </div>
                                                        <span className="text-purple-400 font-bold text-lg">{preview.details.assists || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700/50">
                                                        <span className="text-gray-300 font-medium">Total Kills</span>
                                                        <span className="text-white font-bold text-lg">{(preview.details.killsGround || 0) + (preview.details.killsAircraft || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Economy */}
                                            <div className="space-y-3 bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                                                <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wide flex items-center space-x-2">
                                                    <DollarSign size={14} className="text-green-400" />
                                                    <span>Economy</span>
                                                </h5>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <ItemTypeIcon type="warpoints" size="sm" />
                                                            <span className="text-gray-300">Silver Lions</span>
                                                        </div>
                                                        <span className="text-green-400 font-bold text-lg">{(preview.details.earnedSL || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <ItemTypeIcon type="rp" size="sm" />
                                                            <span className="text-gray-300">Research Points</span>
                                                        </div>
                                                        <span className="text-cyan-400 font-bold text-lg">{(preview.details.totalRP || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <ItemTypeIcon type="crp" size="sm" />
                                                            <span className="text-gray-300">Crew RP</span>
                                                        </div>
                                                        <span className="text-orange-400 font-bold text-lg">{(preview.details.earnedCRP || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700/50">
                                                        <span className="text-gray-300 font-medium">Reward SL</span>
                                                        <span className="text-yellow-400 font-bold text-lg">{(preview.details.rewardSL || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Performance */}
                                            <div className="space-y-3 bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                                                <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wide flex items-center space-x-2">
                                                    <Zap size={14} className="text-yellow-400" />
                                                    <span>Performance</span>
                                                </h5>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Zap size={14} className="text-yellow-400" />
                                                            <span className="text-gray-300">Activity</span>
                                                        </div>
                                                        <span className="text-yellow-400 font-bold text-lg">{preview.details.activity || 0}%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Clock size={14} className="text-indigo-400" />
                                                            <span className="text-gray-300">Duration</span>
                                                        </div>
                                                        <span className="text-indigo-400 font-bold text-lg">{formatDuration(preview.details.timePlayedRP || 0)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Clock size={14} className="text-blue-400" />
                                                            <span className="text-gray-300">Battle Time</span>
                                                        </div>
                                                        <span className="text-blue-400 font-bold text-lg">{formatTime(preview.details.timestamp)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700/50">
                                                        <span className="text-gray-300 font-medium">Session ID</span>
                                                        <span className="text-gray-400 font-mono text-xs truncate max-w-20" title={preview.details.session}>
                                                            {preview.details.session ? preview.details.session.slice(-8) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mission Info */}
                                            <div className="space-y-3 bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                                                <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wide flex items-center space-x-2">
                                                    <Trophy size={14} className="text-purple-400" />
                                                    <span>Mission</span>
                                                </h5>
                                                <div className="space-y-2">
                                                    <div className="text-sm">
                                                        <div className="text-gray-300 font-medium truncate" title={preview.details.missionName}>
                                                            {preview.details.missionName || 'Unknown Mission'}
                                                        </div>
                                                        <div className="text-gray-400 text-xs mt-1">
                                                            Type: {preview.details.missionType || 'Unknown'}
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-gray-700/50">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-300">Result</span>
                                                            <span className={`font-bold text-lg px-2 py-1 rounded-full ${
                                                                preview.details.result === 'Victory' 
                                                                  ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                                                                  : 'bg-red-600/20 text-red-400 border border-red-500/30'
                                                            }`}>
                                                                {preview.details.result || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons in expanded view */}
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-600/30">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOverlayBattle(preview.details); setOverlayOpen(true); }}
                                                    className="px-6 py-3 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 hover:from-yellow-600/30 hover:to-yellow-500/30 text-yellow-400 border-2 border-yellow-500/30 hover:border-yellow-400/50 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 flex items-center space-x-2"
                                                >
                                                    <Eye size={16} />
                                                    <span>Open Full View</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); viewParsedJson(preview.details); }}
                                                    className="px-6 py-3 bg-gradient-to-r from-gray-600/20 to-gray-500/20 hover:from-gray-600/30 hover:to-gray-500/30 text-gray-300 border-2 border-gray-500/30 hover:border-gray-400/50 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gray-500/25 flex items-center space-x-2"
                                                >
                                                    <FileText size={16} />
                                                    <span>View Raw Data</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); editPreview(preview); }}
                                                    className="px-6 py-3 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 text-blue-400 border-2 border-blue-500/30 hover:border-blue-400/50 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2"
                                                >
                                                    <Edit size={16} />
                                                    <span>Edit Battle</span>
                                                </button>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedPreviewId(null); }}
                                                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                                            >
                                                <ChevronUp size={16} />
                                                <span>Collapse</span>
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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
            >
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <Upload size={24} />
                        <span>Add Battle Data</span>
                    </>
                )}
            </button>

            {/* JSON Modal */}
            {showJsonModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-600 w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] flex flex-col">
                        <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center space-x-2">
                            <FileText size={20} />
                            <span>Parsed Battle Data (JSON)</span>
                        </h3>
                        <pre className="bg-gray-900 text-gray-200 p-4 rounded-md overflow-auto flex-grow text-sm custom-scrollbar border border-gray-700">
                            <code>{jsonModalContent}</code>
                        </pre>
                        <button
                            onClick={() => setShowJsonModal(false)}
                            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Removed standalone JSON modal; raw JSON is in BattlePreviewOverlay */}

            {/* Overlay */}
            <BattlePreviewOverlay
              isOpen={overlayOpen}
              onClose={() => setOverlayOpen(false)}
              battle={overlayBattle}
              context="preview"
              onRemoveFromPreview={overlayBattle ? () => { setParsedPreviews(p => p.filter(x => x.details?.id !== overlayBattle.id)); setOverlayOpen(false); } : undefined}
            />
        </div>
    );
};

export default BattleDataEntryComponent; 