import { createSelector, createSlice } from '@reduxjs/toolkit'

export type UserId = string;

export interface UserState {
  Id: UserId;
  Name: string
}

export function createUserSlice (users: UserState[]) {
  return createSlice({
    name: 'users',
    initialState: users,
    reducers: {
    }
  })
}
export function createUserSelector<RootState> (usersSelector: (state: RootState) => UserState[]) {
  return createSelector(
    (state: RootState) => usersSelector(state),
    (_: RootState, id: UserId) => id,
    (state, id) => state.find(user => user.Id === id))
}

export class User {
  Id: UserId;
  Name: string
  constructor (id: UserId, name: string) {
    this.Id = id
    this.Name = name
  }
}
