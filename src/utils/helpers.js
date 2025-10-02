import { useState, useCallback } from 'react';

// Message types and their configurations
const MESSAGE_TYPES = {
    success: { className: 'success', icon: '✅', duration: 4000 },
    error: { className: 'error', icon: '❌', duration: 6000 },
    warning: { className: 'warning', icon: '⚠️', duration: 5000 },
    info: { className: 'info', icon: 'ℹ️', duration: 4000 }
};

// Notification stack management
let notificationStack = [];
let maxNotifications = 6;

// Enhanced message display function with stack support
export const showMessage = (msg, type = 'info', options = {}) => {
    const config = MESSAGE_TYPES[type] || MESSAGE_TYPES.info;
    const duration = options.duration || config.duration;
    
    // Check for duplicate messages in the last 3 seconds
    const now = Date.now();
    const recentDuplicate = notificationStack.find(notif => 
        notif.text === msg && 
        notif.type === type && 
        (now - notif.timestamp) < 3000
    );
    
    if (recentDuplicate) {
        return; // Don't show duplicate notification
    }
    
    const notification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: msg,
        type,
        className: config.className,
        icon: config.icon,
        duration,
        timestamp: Date.now()
    };

    // Add to stack
    notificationStack.push(notification);
    
    // Remove oldest notification if we exceed the limit
    if (notificationStack.length > maxNotifications) {
        const oldestNotification = notificationStack.shift();
        removeNotificationFromDOM(oldestNotification.id);
    }
    
    // Render the notification stack
    renderNotificationStack();
};

// Render the entire notification stack
const renderNotificationStack = () => {
    // Get or create notification container
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    // Clear existing notifications
    container.innerHTML = '';

    // Render each notification
    notificationStack.forEach((notification, index) => {
        const notificationElement = createNotificationElement(notification, index);
        container.appendChild(notificationElement);
    });
};

// Create individual notification element
const createNotificationElement = (notification, index) => {
    const element = document.createElement('div');
    element.className = `notification ${notification.className}`;
    element.id = notification.id;
    element.style.animationDelay = `${index * 0.1}s`;
    
    // Create notification content
    element.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${notification.icon}</span>
            <span class="notification-text">${notification.text}</span>
        </div>
        <button class="notification-close" onclick="closeNotification('${notification.id}')" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <div class="notification-progress ${notification.className}" id="progress-${notification.id}"></div>
    `;

    // Start progress bar animation
    setTimeout(() => {
        const progressBar = element.querySelector(`#progress-${notification.id}`);
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transition = `width ${notification.duration}ms linear`;
            setTimeout(() => {
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            }, 50);
        }
    }, 100);

    // Auto-hide after duration
    const hideTimeout = setTimeout(() => {
        removeNotification(notification.id);
    }, notification.duration);

    // Store timeout ID
    element.setAttribute('data-timeout', hideTimeout);

    // Add enter animation
    setTimeout(() => {
        element.classList.add('notification-enter-active');
    }, 10);

    return element;
};

// Remove notification from stack and DOM
const removeNotification = (notificationId) => {
    // Find and remove from stack
    const index = notificationStack.findIndex(n => n.id === notificationId);
    if (index !== -1) {
        notificationStack.splice(index, 1);
        removeNotificationFromDOM(notificationId);
        renderNotificationStack(); // Re-render to update positions
    }
};

// Remove notification from DOM with animation
const removeNotificationFromDOM = (notificationId) => {
    const element = document.getElementById(notificationId);
    if (element) {
        // Clear timeout
        const timeoutId = element.getAttribute('data-timeout');
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }

        // Add exit animation
        element.classList.add('notification-exit');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 400); // Animation duration
    }
};

// Global close function for notification close buttons
window.closeNotification = (notificationId) => {
    removeNotification(notificationId);
};

// Clear all pending messages
export const clearMessages = () => {
    // Clear all notifications from stack
    notificationStack.forEach(notification => {
        removeNotificationFromDOM(notification.id);
    });
    notificationStack = [];
    
    // Clear the container
    const container = document.getElementById('notification-container');
    if (container) {
        container.innerHTML = '';
    }
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