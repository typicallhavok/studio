// Create: src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false); // Start with false to avoid hydration mismatch
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize theme from what's already set by the script or localStorage
  useEffect(() => {
    const initialize = () => {
      // Check if dark class is already on the document (set by the script)
      const isDarkFromScript = document.documentElement.classList.contains('dark');
      
      // Also check localStorage as backup
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let shouldBeDark = isDarkFromScript;
      
      // If script didn't set it, fall back to localStorage or system preference
      if (!savedTheme) {
        shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
      }
      
      setIsDarkMode(shouldBeDark);
      setIsLoaded(true);
      
      // Ensure the class is applied (in case script failed)
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };

    // Wait for next tick to ensure script has run
    setTimeout(initialize, 0);
  }, []);

  // Apply theme changes when user toggles
  useEffect(() => {
    if (!isLoaded) return; // Don't apply during initial load
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, isLoaded]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return { isDarkMode, toggleTheme, isLoaded };
}