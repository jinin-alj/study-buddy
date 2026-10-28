/** Whole minutes left before the session's time cap, never below zero. */
export function minutesLeft(endsAt: string, nowMilliseconds: number): number {
  const remaining = Date.parse(endsAt) - nowMilliseconds;
  if (Number.isNaN(remaining) || remaining <= 0) {
    return 0;
  }
  return Math.ceil(remaining / 60000);
}
