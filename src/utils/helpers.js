import { useState, useCallback } from 'react';

// Message types and their configurations
const MESSAGE_TYPES = {
    success: { className: 'success', icon: '✅', duration: 4000 },
    error: { className: 'error', icon: '❌', duration: 6000 },
    warning: { className: 'warning', icon: '⚠️', duration: 5000 },
    info: { className: 'info', icon: 'ℹ️', duration: 4000 }
};

// Message queue to handle multiple messages
let messageQueue = [];
let isShowingMessage = false;

// Enhanced message display function
export const showMessage = (msg, type = 'info', options = {}) => {
    const config = MESSAGE_TYPES[type] || MESSAGE_TYPES.info;
    const duration = options.duration || config.duration;
    
    const message = {
        id: Date.now() + Math.random(),
        text: msg,
        type,
        className: config.className,
        icon: config.icon,
        duration
    };

    messageQueue.push(message);
    
    if (!isShowingMessage) {
        showNextMessage();
    }
};

// Show next message in queue
const showNextMessage = () => {
    if (messageQueue.length === 0) {
        isShowingMessage = false;
        return;
    }

    isShowingMessage = true;
    const message = messageQueue.shift();
    
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.innerHTML = `
            <span class="message-icon">${message.icon}</span>
            <span class="message-text">${message.text}</span>
        `;
        messageBox.className = `message-box ${message.className} animate-in`;
        messageBox.style.display = 'flex';
        
        // Auto-hide after duration
        setTimeout(() => {
            if (messageBox) {
                messageBox.classList.add('animate-out');
                setTimeout(() => {
                    if (messageBox) {
                        messageBox.style.display = 'none';
                        messageBox.classList.remove('animate-in', 'animate-out');
                    }
                    showNextMessage(); // Show next message in queue
                }, 300); // Animation duration
            }
        }, message.duration);
    } else {
        // Fallback to console if message box doesn't exist
        console.log(`${message.icon} ${message.text}`);
        setTimeout(showNextMessage, 100);
    }
};

// Clear all pending messages
export const clearMessages = () => {
    messageQueue = [];
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.style.display = 'none';
    }
    isShowingMessage = false;
};

// Enhanced session storage hook with better error handling and validation
export const useSessionStorage = (key, initialValue, options = {}) => {
    const {
        validate = null, // Custom validation function
        serialize = JSON.stringify, // Custom serialization
        deserialize = JSON.parse, // Custom deserialization
        onError = console.error // Custom error handler
    } = options;

    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = sessionStorage.getItem(key);
            if (item === null) {
                return initialValue;
            }
            
            const parsed = deserialize(item);
            
            // Apply custom validation if provided
            if (validate && !validate(parsed)) {
                console.warn(`Validation failed for session storage key "${key}", using initial value`);
                return initialValue;
            }
            
            return parsed;
        } catch (error) {
            onError(`Error reading from session storage (${key}):`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Apply custom validation if provided
            if (validate && !validate(valueToStore)) {
                throw new Error(`Validation failed for value: ${JSON.stringify(valueToStore)}`);
            }
            
            setStoredValue(valueToStore);
            sessionStorage.setItem(key, serialize(valueToStore));
        } catch (error) {
            onError(`Error writing to session storage (${key}):`, error);
            showMessage(`Failed to save data: ${error.message}`, 'error');
        }
    }, [key, storedValue, validate, serialize, onError]);

    return [storedValue, setValue];
};

// Utility function to format numbers with commas
export const formatNumber = (num, options = {}) => {
    const { decimals = 0, locale = 'en-US' } = options;
    
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }
    
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
};

// Utility function to format currency
export const formatCurrency = (amount, currency = 'SL', options = {}) => {
    const { locale = 'en-US', decimals = 0 } = options;
    
    if (amount === null || amount === undefined || isNaN(amount)) {
        return `0 ${currency}`;
    }
    
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(amount) + ` ${currency}`;
};

// Utility function to format time duration
export const formatDuration = (seconds, options = {}) => {
    const { showSeconds = true, compact = false } = options;
    
    if (!seconds || isNaN(seconds)) {
        return '0:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (compact) {
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    } else {
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
};

// Utility function to calculate percentage
export const calculatePercentage = (value, total, options = {}) => {
    const { decimals = 1, showSymbol = true } = options;
    
    if (!total || total === 0) {
        return showSymbol ? '0%' : 0;
    }
    
    const percentage = (value / total) * 100;
    const formatted = percentage.toFixed(decimals);
    
    return showSymbol ? `${formatted}%` : parseFloat(formatted);
};

// Utility function to debounce function calls
export const debounce = (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
};

// Utility function to throttle function calls
export const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Utility function to deep clone objects
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

// Utility function to check if two objects are equal
export const isEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    
    if (Array.isArray(obj1)) {
        if (obj1.length !== obj2.length) return false;
        for (let i = 0; i < obj1.length; i++) {
            if (!isEqual(obj1[i], obj2[i])) return false;
        }
        return true;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!isEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
};

// Utility function to generate unique IDs
export const generateId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utility function to safely access nested object properties
export const getNestedValue = (obj, path, defaultValue = undefined) => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
        if (result == null || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
};

// Utility function to set nested object properties
export const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[lastKey] = value;
    return obj;
};

// Export all utility functions
export default {
    showMessage,
    clearMessages,
    useSessionStorage,
    formatNumber,
    formatCurrency,
    formatDuration,
    calculatePercentage,
    debounce,
    throttle,
    deepClone,
    isEqual,
    generateId,
    getNestedValue,
    setNestedValue
};