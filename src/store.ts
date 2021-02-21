import { Camp, Position, PlayerId } from "./model/player";
import { UserId } from "./model/user";

import { createSlice, createAction, PayloadAction } from '@reduxjs/toolkit'
import { createStore, combineReducers } from 'redux'
 
const killPlayer = createAction<{target: PlayerId}>('killPlayer');
interface PlayerStore
{
    Id: PlayerId;
    User: UserId;
    IsSurvival: boolean;
    Camp: Camp;
    Position: Position;
}

const counter = createSlice({
  name: 'players',
  initialState: {} as PlayerStore,
  reducers: {
    killPlayer: (state) => state + 1,
    decrement: (state) => state - 1,
    multiply: {
      reducer: (state, action: PayloadAction<number>) => state * action.payload,
      prepare: (value?: number) => ({ payload: value || 2 }), // fallback if the payload is a falsy value
    },
  },
  // "builder callback API", recommended for TypeScript users
  extraReducers: (builder) => {
    builder.addCase(incrementBy, (state, action) => {
      return state + action.payload
    })
    builder.addCase(decrementBy, (state, action) => {
      return state - action.payload
    })
  },
})



interface UserStore{

}

type ChannelId = string;
type ChannelType = "All"| "Werewolf" | "Sherer"|"User"

interface ChannelStore{
    Id: ChannelId
    Type: ChannelType;
    Users: UserId[];
}



interface RootStore{
    Players: PlayerStore[];

}