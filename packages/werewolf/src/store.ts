import { Camp, Position, PlayerId } from './model/player'
import { UserId } from './model/user'

import { createSlice, createAction, PayloadAction, createSelector } from '@reduxjs/toolkit'
import { createStore, combineReducers } from 'redux'

interface KillPlayerPayload {
  target: PlayerId
}
export const killPlayer = createAction<KillPlayerPayload>('killPlayer')
interface PlayerStore {
  Id: PlayerId;
  User: UserId;
  IsSurvival: boolean;
  Camp: Camp;
  Position: Position;
}

const players = createSlice({
  name: 'players',
  initialState: [] as PlayerStore[],
  reducers: {
    killPlayer: (state, action: PayloadAction<KillPlayerPayload>) =>
      state.map(item => item.Id === action.payload.target ? { ...item, IsSurvival: false } as PlayerStore : item)
  }
})

const reducer = combineReducers({
  players: players.reducer
})

export const store = createStore(reducer)
type StateType = ReturnType<typeof store.getState>

export const playerSelector = createSelector((state: StateType) => state.players, (res) => res)

