import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Dayjs } from 'dayjs'
import { Position } from './player'
import { UserId } from './user'
import * as Immutable from 'immutable'
import { select } from 'redux-saga/effects'
import { strict } from 'assert'

export type Message =
    {
        message: '{{name}} is executed.'
        param: { name: string }
    }
    |{
        message: 'It\'s morning. (Day {{day}})'
        param: { day: number }
    }
    |{
        message: 'Citizen side win!'
        param?: undefined
    }
    |{
        message: 'Werewolf side win!'
        param?: undefined
    }
    |{
        message: '{{name}} was found dead in a heap.'
        param: { name: string }
    }
    |{
        message: 'The morning was uneventful.'
        param?: undefined
    }
    |{
        message: '{{name}} that was executed was a werewolf.'
        param: { name: string }
    }
    |{
        message: '{{name}} that was executed was a citizen.'
        param: { name: string }
    }
    |{
        message: 'You are {{position}}'
        param: { position: Position }
    }
    |{
        message: 'It\'s night.',
        param?: undefined
    }
    |{
        message: 'It\'s vote time.',
        param?: undefined
    }
    |{
        message: 'Final Vote. subject are {{ names }}'
        param: { names: string }
    }
    |{
        message: 'The next phase is {{date}}'
        param: { date: Dayjs }
    }
export type MessageTarget = 'All'|'Werewolf'|'Sherer' | UserId[]
export type ChannelId =string
export interface ChannelManager {
    Join:(userIds: UserId[])=>ChannelId
    Send: (id: ChannelId, message: Message) => void
}

export interface ChannelState {
    Id:ChannelId
    Target: MessageTarget
    Users:UserId[]
}
export type ChannelsState = Immutable.Map<MessageTarget, ChannelState>

export const channelSline = createSlice({
  name: 'channel',
  initialState: Immutable.Map<MessageTarget, ChannelState>() as ChannelsState,
  reducers: {
    addChannel: (state, action:PayloadAction<{id:ChannelId, target: MessageTarget, users:UserId[] }>) => state.set(action.payload.target, { Id: action.payload.id, Target: action.payload.target, Users: action.payload.users }),
    sendMessage: (state, action: PayloadAction<{ target: MessageTarget, message: Message }>) => state
  }
})

export const { addChannel, sendMessage } = channelSline.actions

function arrayEqual<Element> (a:Element[], b:Element[]):boolean {
  if (!Array.isArray(a)) return false
  if (!Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}
export function createChannelSelector<RootState> (channelsSelector: (state: RootState) => ChannelsState) {
  return createSelector(
    (state: RootState) => channelsSelector(state),
    (_: RootState, target: MessageTarget) => target,
    (state, target) => {
      if (typeof target === 'string') {
        return state.get(target)
      } else {
        const key = Array.from(state.keys()).find((key) => key instanceof Array && arrayEqual(key, target))
        if (!key) {
          return undefined
        }
        return state.get(key)
      }
    }
  )
}
