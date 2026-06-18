const COOKIE_KEY = 'adult_confirmed';

export function getAdultConfirmed(): boolean {
  const match = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY + '=([^;]+)'));
  return match?.[2] === 'true';
}

export function setAdultConfirmed(): void {
  const date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_KEY}=true;expires=${date.toUTCString()};path=/;samesite=lax`;
}
