import dayjs, { Dayjs } from 'dayjs'
import { conforms } from 'lodash'

export interface Scheduler {
  SetSchedule: (date: dayjs.Dayjs | undefined) => void;
}

export function calcrateNextPhase (now: Dayjs, config: string): Dayjs | undefined {
  if (config.startsWith('P')) {
    return now.add(dayjs.duration(config))
  } else {
    const [hourStr, minutesStr] = config.split(':')
    const hour = Number.parseInt(hourStr)
    const minutes = Number.parseInt(minutesStr)
    if (hour === Number.NaN && minutes === Number.NaN) {
      return undefined
    }
    const localNow = now.local()
    const today = localNow.set('hours', hour).set('minutes', minutes)
    if (today < localNow) {
      return today.add(1, 'day').utc()
    } else {
      return today.utc()
    }
  }
}
