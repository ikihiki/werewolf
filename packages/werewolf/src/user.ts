import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'

export type UserId = string;

export interface UserState {
  Id: UserId;
  Name: string
}
interface SetInitialUserStatePayload{
  state: UserState[]
}
export const userSlice = createSlice({
  name: 'users',
  initialState: [] as UserState[],
  reducers: {
    setInitialUserState: (state, action: PayloadAction<SetInitialUserStatePayload>) => action.payload.state
  }
})
export const { setInitialUserState } = userSlice.actions
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
