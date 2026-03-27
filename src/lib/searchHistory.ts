const STORAGE_KEY = "minprice_search_history";
const MAX_ITEMS = 10;

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(term: string): void {
  const history = getSearchHistory();
  const filtered = history.filter((t) => t.toLowerCase() !== term.toLowerCase());
  filtered.unshift(term);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}

export function removeSearchHistoryItem(term: string): void {
  const history = getSearchHistory().filter((t) => t !== term);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
