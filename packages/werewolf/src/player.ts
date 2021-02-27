import { AnyAction, createSelector, createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit'
import { User, UserId } from './user'

export type Camp = 'Werewolf Side' | 'Citizen Side';
export type Position = 'Werewolf' | 'Psycho' | 'Citizen' | 'FortuneTeller' | 'Knight' | 'Psychic' | 'Sharer';
export type PlayerId = string;
export interface Report {
  target: PlayerId
  camp: Camp
}
export interface PlayerState {
  Id: PlayerId;
  UserId: UserId;
  IsSurvival: boolean;
  Camp: Camp;
  Position: Position;
  IsBited: boolean;
  IsProtected: boolean;
  VoteTo: PlayerId | null;
  IsVotingTarget: boolean;
  CamingOut: Position | null;
  Reports: Report[]
}
interface SetInitialPlayerStatePayload {
  state: PlayerState[]
}

export function createPlayerSelector<RootState> (playersSelector: (state: RootState) => PlayerState[]) {
  return createSelector(
    (state: RootState) => playersSelector(state),
    (_: RootState, id: PlayerId) => id,
    (state, id) => state.find(player => player.Id === id))
}

export function createSurvivalPlayersSelector<RootState> (playersSelector: (state: RootState) => PlayerState[]) {
  return createSelector(
    (state: RootState) => playersSelector(state),
    (state) => state.filter(player => player.IsSurvival))
}

export function createVotingTargetPlayersSelector<RootState> (playersSelector: (state: RootState) => PlayerState[]) {
  return createSelector(
    (state: RootState) => playersSelector(state),
    (state) => state.filter(player => player.IsVotingTarget))
}

export function createPlayersWithPositionSelector<RootState> (playersSelector: (state: RootState) => PlayerState[]) {
  return createSelector(
    (state: RootState) => playersSelector(state),
    (_: RootState, position: Position) => position,
    (state, position) => state.filter(player => player.Position === position))
}

export const playerSlice = createSlice({
  name: 'players',
  initialState: [] as PlayerState[],
  reducers: {
    setInitialPlayerState: (state, action: PayloadAction<SetInitialPlayerStatePayload>) => action.payload.state,
    bite: (state, action: PayloadAction<{ target: PlayerId }>): PlayerState[] =>
      state.map(item => ({ ...item, IsBited: item.Id === action.payload.target })),

    escort: (state, action: PayloadAction<{ target: PlayerId }>): PlayerState[] =>
      state.map(item => ({ ...item, IsProtected: item.Id === action.payload.target })),

    vote: (state, action: PayloadAction<{ player: PlayerId, target: PlayerId }>): PlayerState[] =>
      state.map(item => item.Id === action.payload.player ? { ...item, VoteTo: action.payload.target } : item),

    camingOut: (state, action: PayloadAction<{ player: PlayerId, position: Position }>): PlayerState[] =>
      state.map(item => item.Id === action.payload.player ? { ...item, CamingOut: action.payload.position } : item),

    report: (state, action: PayloadAction<{ player: PlayerId, report: Report }>): PlayerState[] =>
      state.map(item => item.Id === action.payload.player ? { ...item, Reports: [...item.Reports, action.payload.report] } : item),

    kill: (state, action: PayloadAction<{ target: PlayerId }>): PlayerState[] =>
      state.map(item => item.Id === action.payload.target ? { ...item, IsSurvival: false } : item),

    execute: (state, action: PayloadAction<{ target: PlayerId }>): PlayerState[] =>
      state.map(item => item.Id === action.payload.target ? { ...item, IsSurvival: false } : item),

    resetNight: (state): PlayerState[] =>
      state.map(item => ({ ...item, IsBited: false, IsProtected: false, IsVotingTarget: false })),

    resetVote: (state): PlayerState[] =>
      state.map(item => ({ ...item, VoteTo: null })),

    setVoteTargets: (state, action: PayloadAction<{ targets: PlayerId[] }>): PlayerState[] =>
      state.map(item => ({ ...item, IsVotingTarget: action.payload.targets.find(id => item.Id === id) !== undefined }))
  }
})

export const { setInitialPlayerState, bite, escort, vote, camingOut, report, kill, execute, resetNight, resetVote, setVoteTargets } = playerSlice.actions

export class Player {
  Id: PlayerId;
  User: UserId;
  IsSurvival: boolean;
  Camp: Camp;
  Position: Position;
  CamingOutPosition: Position | null;
  IsVotingTarget: boolean;
  #dispach: Dispatch<AnyAction>
  constructor (dispach: Dispatch<AnyAction>, state: PlayerState) {
    this.Id = state.Id
    this.User = state.UserId
    this.IsSurvival = state.IsSurvival
    this.Camp = state.Camp
    this.Position = state.Position
    this.CamingOutPosition = state.CamingOut
    this.IsVotingTarget = state.IsVotingTarget
    this.#dispach = dispach
  }

  Bite (target: Player): void {
    if (!this.IsSurvival) {
      throw new Error('You are already dead')
    }
    if (this.Position !== 'Werewolf') {
      throw new Error('You are not werewolf')
    }
    this.#dispach(bite({ target: target.Id }))
  }

  Escort (target: Player): void {
    if (!this.IsSurvival) {
      throw new Error('You are already dead')
    }
    if (this.Position !== 'Knight') {
      throw new Error('You are not Knight')
    }
    this.#dispach(escort({ target: target.Id }))
  }

  Fortune (target: Player): Camp {
    if (!this.IsSurvival) {
      throw new Error('You are already dead')
    }
    if (this.Position !== 'FortuneTeller') {
      throw new Error('You are not Knight')
    }
    return target.Camp
  }

  Vote (target: Player): void {
    if (!this.IsSurvival) {
      throw new Error('You are already dead')
    }
    if (!target.IsVotingTarget) {
      throw new Error('Target is not voting target')
    }
    this.#dispach(vote({ player: this.Id, target: target.Id }))
  }

  CamingOut (position: Position): void {
    if (!this.IsSurvival) {
      throw new Error('You are already dead')
    }
    this.#dispach(camingOut({ player: this.Id, position: position }))
  }

  Report (reportData: Report): void {
    if (!this.IsSurvival) {
      throw new Error('You are already dead')
    }
    this.#dispach(report({ player: this.Id, report: reportData }))
  }
}

function createPlayerStore (playerId: PlayerId, user: User): PlayerState {
  return {
    Id: playerId,
    UserId: user.Id,
    IsBited: false,
    IsSurvival: true,
    CamingOut: null,
    IsProtected: false,
    IsVotingTarget: false,
    VoteTo: null,
    Reports: [] as Report[]
  } as PlayerState
}

export function createWerewolfStore (playerId: PlayerId, user: User): PlayerState {
  return {
    ...createPlayerStore(playerId, user),
    Camp: 'Werewolf Side',
    Position: 'Werewolf'
  }
}

export function createPsychoStore (playerId: PlayerId, user: User): PlayerState {
  return {
    ...createPlayerStore(playerId, user),
    Camp: 'Werewolf Side',
    Position: 'Psycho'
  }
}

export function createCitizenStore (playerId: PlayerId, user: User): PlayerState {
  return {
    ...createPlayerStore(playerId, user),
    Camp: 'Citizen Side',
    Position: 'Citizen'
  }
}

export function createFortuneTellerStore (playerId: PlayerId, user: User): PlayerState {
  return {
    ...createPlayerStore(playerId, user),
    Camp: 'Citizen Side',
    Position: 'FortuneTeller'
  }
}

export function createKnightStore (playerId: PlayerId, user: User): PlayerState {
  return {
    ...createPlayerStore(playerId, user),
    Camp: 'Citizen Side',
    Position: 'Knight'
  }
}

export function createPsychicStore (playerId: PlayerId, user: User): PlayerState {
  return {
    ...createPlayerStore(playerId, user),
    Camp: 'Citizen Side',
    Position: 'Psychic'
  }
}

export function createSharerStore (playerId: PlayerId, user: User): PlayerState {
  return {
    ...createPlayerStore(playerId, user),
    Camp: 'Citizen Side',
    Position: 'Sharer'
  }
}
