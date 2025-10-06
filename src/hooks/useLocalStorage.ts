import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(storageKey: string, fallbackState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? JSON.parse(storedValue) : fallbackState;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${storageKey}":`, error);
      return fallbackState;
    }
  });

  // Effect to update localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key "${storageKey}":`, error);
    }
  }, [value, storageKey]);

  // Effect to listen for changes from other tabs/windows
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === storageKey && event.newValue) {
      try {
        setValue(JSON.parse(event.newValue));
      } catch (error) {
        console.error(`Error parsing new value from storage for key "${storageKey}":`, error);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);

  return [value, setValue];
}

export default useLocalStorage;