import { AnyAction, createAction, createSelector, createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit'
import { User, UserId } from './user'

export type Camp = 'Werewolf Side' | 'Citizen Side';
export type Position = 'Werewolf' | 'Psycho' | 'Citizen' | 'FortuneTeller' | 'Knight' | 'Psychic' | 'Sharer';
export type PlayerId = string;

interface BitePayload {
  target: PlayerId
}
const bite = createAction<BitePayload>('bite')

interface EscortPayload {
  target: PlayerId
}
const escort = createAction<EscortPayload>('escort')
interface VotePayload {
  player: PlayerId
  target: PlayerId
}
export const vote = createAction<VotePayload>('vote')
interface CamingOutPayload {
  player: PlayerId
  position: Position
}
const camingOut = createAction<CamingOutPayload>('camingOut')

export interface Report {
  target: PlayerId
  position: Position
}
interface ReportPayload {
  player: PlayerId
  report: Report
}
const report = createAction<ReportPayload>('report')
interface KillPayload {
  target: PlayerId
}
export const kill = createAction<KillPayload>('kill')
interface ExecutePayload {
  target: PlayerId
}
export const execute = createAction<ExecutePayload>('execute')
export const resetNight = createAction('resetNight')
export const resetVote = createAction('resetVote')
interface SetVoteTargetsPayload {
  targets: PlayerId[]
}
export const setVoteTargets = createAction<SetVoteTargetsPayload>('setVoteTargets')

export interface PlayerState {
  Id: PlayerId;
  User: UserId;
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

export function createPlayersSlice (initialState: PlayerState[]) {
  return createSlice({
    name: 'players',
    initialState: initialState,
    reducers: {
      bite: (state, action: PayloadAction<BitePayload>) =>
        state.map(item => ({ ...item, IsBited: item.Id === action.payload.target })),
      escort: (state, action: PayloadAction<EscortPayload>) =>
        state.map(item => ({ ...item, IsProtected: item.Id === action.payload.target })),
      vote: (state, action: PayloadAction<VotePayload>) =>
        state.map(item => item.User === action.payload.player ? { ...item, VoteTo: action.payload.target } : item),
      camingOut: (state, action: PayloadAction<CamingOutPayload>) =>
        state.map(item => item.User === action.payload.player ? { ...item, CamingOut: action.payload.position } : item),
      report: (state, action: PayloadAction<ReportPayload>) =>
        state.map(item => item.User === action.payload.player ? { ...item, Reports: [...item.Reports, action.payload.report] } : item),
      kill: (state, action: PayloadAction<KillPayload>) =>
        state.map(item => item.User === action.payload.target ? { ...item, IsSurvival: false } : item),
      execute: (state, action: PayloadAction<ExecutePayload>) =>
        state.map(item => item.User === action.payload.target ? { ...item, IsSurvival: false } : item),
      resetNight: (state) =>
        state.map(item => ({ ...item, IsBited: false, IsProtected: false, IsVotingTarget: false })),
      resetVote: (state) =>
        state.map(item => ({ ...item, VoteTo: null })),
      setVoteTargets: (state, action: PayloadAction<SetVoteTargetsPayload>) =>
        state.map(item => ({ ...item, IsVotingTarget: action.payload.targets.find(id => item.Id === id) !== undefined }))
    }
  })
}

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
    this.User = state.User
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
    User: user.Id,
    IsBited: false,
    IsSurvival: false,
    CamingOut: null,
    IsProtected: false,
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
