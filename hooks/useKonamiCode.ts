import { useEffect, useState } from "react";

/**
 * Konami Code: ↑ ↑ ↓ ↓ ← → ← → P M
 * Used to unlock admin super mode
 */
const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "p",
  "m",
];

export function useKonamiCode(onSuccess: () => void) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key === "ArrowUp" || 
                  event.key === "ArrowDown" || 
                  event.key === "ArrowLeft" || 
                  event.key === "ArrowRight" 
        ? event.key 
        : event.key.toLowerCase();

      setKeys((prev) => {
        const newKeys = [...prev, key];
        
        // Keep only last 10 keys
        if (newKeys.length > KONAMI_CODE.length) {
          newKeys.shift();
        }

        // Check if matches Konami code
        if (newKeys.length === KONAMI_CODE.length) {
          if (newKeys.join(",") === KONAMI_CODE.join(",")) {
            console.log("🎮 Konami Code Activated! Admin Mode Unlocked!");
            onSuccess();
            setKeys([]); // Reset
            return [];
          }
        }

        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onSuccess]);
}
