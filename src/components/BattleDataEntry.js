import React, { useState, useEffect } from 'react';
import { Plus, Upload, Eye, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
        return btoa(lines).slice(0, 20); // Base64 encode and take first 20 chars
    };

    // Function to validate battle data format
    const validateBattleData = (battleText) => {
        const trimmed = battleText.trim();
        
        // Check if it's empty
        if (!trimmed) {
            return { isValid: false, error: "Battle data is empty" };
        }

        // Check if it starts with Victory or Defeat
        if (!trimmed.match(/^(Victory|Defeat) in the \[/)) {
            return { isValid: false, error: "Battle data must start with 'Victory' or 'Defeat' in the [mission]" };
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
            
            // Add a 2-second processing delay
            setTimeout(() => {
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
                        
                        if (uniqueNewPreviews.length === 0) {
                            showMessage("All entries are duplicates or invalid.", "error");
                        } else if (uniqueNewPreviews.length < newPreviews.length) {
                            showMessage(`${newPreviews.length - uniqueNewPreviews.length} duplicate entries were filtered out.`, "info");
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
            }, 2000); // 2-second processing delay
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

    const handleAddBattleData = () => {
        const successfulPreviews = parsedPreviews.filter(p => p.status === 'success');
        if (successfulPreviews.length > 0) {
            handleProcessBattleData(successfulPreviews.map(p => p.details));
            // Clear the previews after successful processing
            setParsedPreviews([]);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 mb-8">
            <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center space-x-2">
                <Plus size={24} /> <span>Add New Battle Data</span>
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
                        <option key={user.id} value={user.id}>{user.username}</option>
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
                <div className="mb-6 bg-gray-900 p-4 rounded-xl shadow-inner border border-gray-700">
                    <h4 className="text-xl font-semibold text-yellow-300 mb-3 flex items-center space-x-2">
                        <Eye size={20} /> <span>Battle Data Preview ({parsedPreviews.length} entries)</span>
                    </h4>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {parsedPreviews.map((preview, index) => (
                            <div key={preview.id} className={`p-3 my-2 rounded-lg ${preview.status === 'error' ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-200'} shadow-md`}>
                                <div className="w-full flex justify-between items-center font-medium">
                                    <span className="flex-grow text-left">
                                        <span className="font-bold mr-2">#{index + 1}:</span> {preview.summary}
                                    </span>
                                    <div className="flex space-x-2 ml-4">
                                        {preview.details && (
                                            <button
                                                onClick={() => viewParsedJson(preview.details)}
                                                className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-yellow-400 transition duration-200"
                                                title="View Raw Data"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deletePreviewBattle(preview.id)}
                                            className="p-1 rounded-full bg-red-700 hover:bg-red-600 text-white transition duration-200"
                                            title="Remove from list"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => togglePreview(preview.id)}
                                            className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition duration-200"
                                            title={expandedPreviewId === preview.id ? "Collapse" : "Expand"}
                                        >
                                            {expandedPreviewId === preview.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </div>
                                {expandedPreviewId === preview.id && preview.details && (
                                    <div className="mt-3 text-sm text-gray-300 border-t border-gray-700 pt-3">
                                        <p>Result: <span className={`font-semibold ${preview.details.result === 'Victory' ? 'text-green-400' : 'text-red-400'}`}>{preview.details.result}</span></p>
                                        <p>Mission: {preview.details.missionName} ({preview.details.missionType})</p>
                                        <p>Ground Kills: {preview.details.killsGround}</p>
                                        <p>Aircraft Kills: {preview.details.killsAircraft}</p>
                                        <p>Earned SL: {preview.details.earnedSL.toLocaleString()}</p>
                                        <p>Earned RP: {preview.details.totalRP.toLocaleString()}</p>
                                        <p>Activity: {preview.details.activity}%</p>
                                        <p>Session ID: {preview.details.session}</p>
                                        <p>Timestamp: {new Date(preview.details.timestamp).toLocaleString()}</p>
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