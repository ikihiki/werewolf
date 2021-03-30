import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Dayjs } from 'dayjs'
import { Position } from './player'
import { User, UserId } from './user'
import * as Immutable from 'immutable'
import { OmitByValue, PickByValue, ValuesType } from 'utility-types'

type MessageTemplate = {
  '{{user.Name}} is executed.': { user: User }
  'It\'s morning. (Day {{day}})':{ day: number }
  'Citizen side win!':undefined
  'Werewolf side win!':undefined
  '{{user.Name}} was found dead in a heap.':{ user: User }
  'The morning was uneventful.':undefined
  '{{user.Name}} that was executed was a werewolf.':{ user: User }
  '{{user.Name}} that was executed was a citizen.':{ user: User }
  'You are {{position}}':{ position: Position }
  'It\'s night.':undefined
  'It\'s vote time.':undefined
  'Final Vote. subject are {{ users.Name }}':{ users: User[] }
  'The next phase is {{date}}':{ date: Dayjs }
  'The werewolf game start': undefined
}
export type MessageStrings = keyof MessageTemplate
type HasParamMessage = OmitByValue<MessageTemplate, undefined>
type HasParamTempMessage = {
  [Key in keyof HasParamMessage]:{message:Key, param:HasParamMessage[Key]}
}
type NoParamMessage = PickByValue<MessageTemplate, undefined>
type NoParamTempMessage = {
  [Key in keyof NoParamMessage]:{message:Key, param?:NoParamMessage[Key]}
}
export type Message = ValuesType<HasParamTempMessage> | ValuesType<NoParamTempMessage>

export type MessageTarget = 'All'|'Werewolf'|'Sharer' | UserId[]
export type ChannelId =string
export interface ChannelManager {
    Join:(userIds: UserId[])=>Promise<ChannelId>
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
    (_: RootState, id: ChannelId) => id,
    (state, id) => {
      return Array.from(state.values()).find(channel => channel.Id === id)
    }
  )
}

export function createChannelWithTargetSelector<RootState> (channelsSelector: (state: RootState) => ChannelsState) {
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

export class Channel {
  #id:ChannelId
  get Id () {
    return this.#id
  }

  #target:MessageTarget
  get Target () {
    return this.#target
  }

  #users:UserId[]
  get Users () {
    return this.#users
  }

  constructor (state: ChannelState) {
    this.#id = state.Id
    this.#target = state.Target
    this.#users = state.Users
  }

  isDm (user:UserId) {
    return this.Target instanceof Array && this.Target.length === 1 && this.#target[0] === user
  }
}
