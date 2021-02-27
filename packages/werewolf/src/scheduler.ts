import dayjs from 'dayjs'

export interface Scheduler {
  SetSchedule: (date: dayjs.Dayjs) => void;
}
