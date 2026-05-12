const CHAIN_IDS_COOKIE_KEY = 'chain_ids';

export function getChainIdsFromCookie(): number[] {
  if (typeof document === 'undefined') return [];
  const match = document.cookie.match(new RegExp('(^| )' + CHAIN_IDS_COOKIE_KEY + '=([^;]+)'));
  if (match && match[2]) {
    try {
      return match[2]
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
    } catch (e) {
      console.error('Failed to parse chain_ids cookie', e);
      return [];
    }
  }
  return [];
}

export function setChainIdsToCookie(chainIds: number[]): void {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year TTL
  const value = chainIds.join(',');
  document.cookie = `${CHAIN_IDS_COOKIE_KEY}=${value};expires=${date.toUTCString()};path=/;samesite=lax`;
}
