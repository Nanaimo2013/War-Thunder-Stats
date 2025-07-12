import { useState } from 'react';

// Helper function for displaying messages
export const showMessage = (msg, type = 'info') => {
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.textContent = msg;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        setTimeout(() => {
            if (messageBox) {
                messageBox.style.display = 'none';
            }
        }, 4000);
    }
};

// Custom hook for session storage
export const useSessionStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error("Error reading from session storage:", error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            sessionStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error("Error writing to session storage:", error);
        }
    };

    return [storedValue, setValue];
};