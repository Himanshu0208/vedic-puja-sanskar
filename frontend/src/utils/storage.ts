export const getStoredItem = <T>(key: string): T | null => {
  if(typeof window === 'undefined') return null;

  const data = localStorage.getItem(key);

  if(!data) return null;

  try {
    return JSON.parse(data) as T;
  } catch {
    console.log("Failed to parse: ", key, "from local storage");
    return null;
  }
};

export const setStoredItem = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeStoredItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};