import { dateKey, mulberry32, seedFromDate } from './rng'

export function createDailyRun(date = new Date()) {
  return {
    date: dateKey(date),
    startingLevel: 3,
    rng: mulberry32(seedFromDate(date)),
  }
}
