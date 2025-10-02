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
        timestamp: now
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
        onError = null // Custom error handler
    } = options;

    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = sessionStorage.getItem(key);
            if (item === null) {
                return initialValue;
            }
            
            const parsedValue = deserialize(item);
            
            // Validate if validator provided
            if (validate && !validate(parsedValue)) {
                console.warn(`Invalid value for key "${key}":`, parsedValue);
                if (onError) onError(new Error(`Validation failed for key "${key}"`));
                return initialValue;
            }
            
            return parsedValue;
        } catch (error) {
            console.error(`Error reading sessionStorage key "${key}":`, error);
            if (onError) onError(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Validate before storing
            if (validate && !validate(valueToStore)) {
                throw new Error(`Validation failed for key "${key}"`);
            }
            
            setStoredValue(valueToStore);
            sessionStorage.setItem(key, serialize(valueToStore));
        } catch (error) {
            console.error("Error writing to session storage:", error);
            if (onError) onError(error);
        }
    }, [key, storedValue, serialize, validate, onError]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error("Error removing from session storage:", error);
            if (onError) onError(error);
        }
    }, [key, initialValue, onError]);

    return [storedValue, setValue, removeValue];
};

// Enhanced localStorage hook with better error handling and validation
export const useLocalStorage = (key, initialValue, options = {}) => {
    const {
        validate = null, // Custom validation function
        serialize = JSON.stringify, // Custom serialization
        deserialize = JSON.parse, // Custom deserialization
        onError = null // Custom error handler
    } = options;

    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return initialValue;
            }
            
            const parsedValue = deserialize(item);
            
            // Validate if validator provided
            if (validate && !validate(parsedValue)) {
                console.warn(`Invalid value for key "${key}":`, parsedValue);
                if (onError) onError(new Error(`Validation failed for key "${key}"`));
                return initialValue;
            }
            
            return parsedValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            if (onError) onError(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Validate before storing
            if (validate && !validate(valueToStore)) {
                throw new Error(`Validation failed for key "${key}"`);
            }
            
            setStoredValue(valueToStore);
            localStorage.setItem(key, serialize(valueToStore));
        } catch (error) {
            console.error("Error writing to local storage:", error);
            if (onError) onError(error);
        }
    }, [key, storedValue, serialize, validate, onError]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Error removing from local storage:", error);
            if (onError) onError(error);
        }
    }, [key, initialValue, onError]);

    return [storedValue, setValue, removeValue];
};

// Utility function to format numbers with commas
export const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString();
};

// Utility function to format currency
export const formatCurrency = (amount, currency = 'USD') => {
    if (typeof amount !== 'number') return amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Utility function to format percentages
export const formatPercentage = (value, decimals = 1) => {
    if (typeof value !== 'number') return value;
    return `${value.toFixed(decimals)}%`;
};

// Utility function to format time duration
export const formatDuration = (seconds) => {
    if (typeof seconds !== 'number') return seconds;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
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
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
};

// Utility function to check if two objects are deeply equal
export const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
};

// Utility function to generate a random ID
export const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Utility function to capitalize first letter of a string
export const capitalize = (str) => {
    if (typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Utility function to truncate text
export const truncate = (str, length = 50, suffix = '...') => {
    if (typeof str !== 'string') return str;
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
};

// Utility function to check if a value is empty
export const isEmpty = (value) => {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

// Utility function to get nested object property safely
export const getNestedProperty = (obj, path, defaultValue = undefined) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let key of keys) {
        if (current == null || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
};

// Utility function to set nested object property safely
export const setNestedProperty = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (let key of keys) {
        if (current[key] == null || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[lastKey] = value;
    return obj;
};