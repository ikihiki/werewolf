import {
  createUserSelector,
  setInitialUserState,
  stateToUser,
  User,
  UserId,
  userSlice,
  UserState
} from './user'
import { Config } from './config'
import {
  playerSlice,
  createPlayerSelector,
  createSurvivalPlayersSelector,
  kill,
  Player,
  PlayerState,
  resetNight,
  setVoteTargets,
  vote,
  setInitialPlayerState,
  createVotingTargetPlayersSelector,
  PlayerId,
  execute,
  resetVote,
  Camp,
  createPlayersWithPositionSelector
} from './player'
import {
  AnyAction,
  applyMiddleware,
  combineReducers,
  createAction,
  createSlice,
  createStore,
  Store,
  PayloadAction,
  createSelector
} from '@reduxjs/toolkit'
import { ChannelManager, channelSline, createChannelWithTargetSelector, ChannelState, addChannel, ChannelId, sendMessage, createChannelSelector, Channel, MessageTarget } from './channel'
import createSagaMiddleware, { SagaMiddleware } from 'redux-saga'
import { all, call, put, select, takeEvery } from 'redux-saga/effects'
import groupBy from 'lodash/fp/groupBy'
import { chunk, max } from 'lodash'
import { compose } from 'redux'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { calcrateNextPhase, Scheduler } from './scheduler'

import Immutable from 'immutable'
import { GameContext } from './service'
import P from 'pino'

dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export type GameId = string;
export type Phase = 'BeforeGame'|'Daytime' | 'Vote' | 'Night' | 'GameOver';
interface GameState {
  Id: GameId;
  Phase: Phase;
  Days: number;
  NextPhase: dayjs.Dayjs | undefined,
  Config: Config;
}
const timeOut = createAction('timeOut')
const gameSline = createSlice({
  name: 'game',
  initialState: { Phase: 'BeforeGame', Days: 0 } as GameState,
  reducers: {
    setGameId: (state, action:PayloadAction<GameId>) => ({
      ...state,
      Id: action.payload
    }),
    setConfig: (state, action: PayloadAction<Config>) => ({
      ...state,
      Config: action.payload
    }),
    toDay: (state) => ({ ...state, Phase: 'Daytime', Days: state.Days + 1 }),
    toNight: (state) => ({ ...state, Phase: 'Night' }),
    toVote: (state) => ({ ...state, Phase: 'Vote' }),
    toGameOver: (state, _action: PayloadAction<Camp>) => ({
      ...state,
      Phase: 'GameOver'
    }),
    setSchedule: (state, actiion:PayloadAction<{date:dayjs.Dayjs | undefined}>) => ({ ...state, NextPhase: actiion.payload.date })
  }
})
export const {
  setGameId,
  setConfig,
  toDay,
  toNight,
  toVote,
  toGameOver,
  setSchedule
} = gameSline.actions

export interface RootState {
  game: ReturnType<typeof gameSline.reducer>;
  users: ReturnType<typeof userSlice.reducer>;
  players: ReturnType<typeof playerSlice.reducer>;
  channels: ReturnType<typeof channelSline.reducer>;
}

export const usersSelector = (state: RootState) => state.users
export const userSelector = createUserSelector(usersSelector)
export const playersSelector = (state: RootState) => state.players
export const playerSelector = createPlayerSelector(playersSelector)
export const survivalPlayersSelector = createSurvivalPlayersSelector(
  playersSelector
)
export const votingTargetPlayersSeledtor = createVotingTargetPlayersSelector(
  playersSelector
)
export const playersWithPositionSelector = createPlayersWithPositionSelector(playersSelector)
export const userWithPlayerIdSelector = createSelector(
  (state: RootState) => state,
  (_: RootState, id: PlayerId) => id,
  (state, id) => {
    const player = playerSelector(state, id)
    if (player) {
      return userSelector(state, player.UserId)
    } else {
      return undefined
    }
  })
export const gameSelector = (state: RootState) => state.game
export const phaseSelector = (state: RootState) => gameSelector(state).Phase
export const configSelector = (state: RootState) => gameSelector(state).Config
export const channelsSelector = (state:RootState) => state.channels
export const channelSelector = createChannelSelector(channelsSelector)
export const channelWithTargetSelector = createChannelWithTargetSelector(channelsSelector)

const judgeWin = function * () {
  const survivalPlayers: PlayerState[] = yield select(
    survivalPlayersSelector
  )
  const werewolfCount = survivalPlayers.filter(
    (player) => player.Position === 'Werewolf'
  ).length
  const werewolfSideCount = survivalPlayers.filter(
    (player) => player.Camp === 'Werewolf Side'
  ).length
  const citizenSideCount = survivalPlayers.filter(
    (player) => player.Camp === 'Citizen Side'
  ).length
  if (werewolfCount === 0) {
    yield put(toGameOver('Citizen Side'))
    yield put(sendMessage({ target: 'All', message: { message: 'Citizen side win!' } }))
    return true
  } else if (werewolfSideCount >= citizenSideCount) {
    yield put(toGameOver('Werewolf Side'))
    yield put(sendMessage({ target: 'All', message: { message: 'Werewolf side win!' } }))
    return true
  } else {
    return false
  }
}
function * totalVote (context: GameContext) {
  const survivalPlayers: PlayerState[] = yield select(
    survivalPlayersSelector
  )
  const votedGroup = new Map(
    Object.entries(
      groupBy<PlayerState>((player) => player.VoteTo, survivalPlayers)
    )
  )
  context.logger.debug('votedGroup: %o', votedGroup)
  const votedCount = new Map(
    Array.from(votedGroup.entries()).map(([key, players]) => [
      key,
      players.length
    ])
  )
  context.logger.debug('votedCount: %o', votedCount)
  const countGroup = new Map(
    Object.entries(
      groupBy(
        (entry) => entry.count,
        Array.from(votedCount.entries()).map(([key, count]) => ({
          key,
          count
        }))
      )
    )
  )
  context.logger.debug('countGroup: %o', countGroup)
  const maxCount = max(Array.from(countGroup.keys()).map(count => Number.parseInt(count)))
  if (maxCount === undefined) {
    return
  }
  const targets = countGroup.get(maxCount?.toString())
  if (targets?.length === 1 && targets[0].key !== 'null') {
    const target = survivalPlayers.find(
      (player) => player.Id === targets[0].key
    )
    if (target) {
      yield put(resetVote())
      yield put(execute({ target: target.Id }))
      const executedUser = stateToUser(yield select(userSelector, target.UserId))
      if (!executedUser) {
        throw new Error('何故かユーザーが見つからない!')
      }
      yield put(sendMessage({ target: 'All', message: { message: '{{user.Name}} is executed.', param: { user: executedUser } } }))
      if (yield call(judgeWin)) {
        return
      }
      yield put(toNight())
      const psychics:PlayerState[] = yield select(playersWithPositionSelector, 'Psychic')
      for (const psychic of psychics) {
        if (target.Position === 'Werewolf') {
          yield put(sendMessage({ target: [psychic.UserId], message: { message: '{{user.Name}} that was executed was a werewolf.', param: { user: executedUser } } }))
        } else {
          yield put(sendMessage({ target: [psychic.UserId], message: { message: '{{user.Name}} that was executed was a citizen.', param: { user: executedUser } } }))
        }
      }
      const config: Config = yield select(configSelector)
      const nextPhase = calcrateNextPhase(dayjs().utc(), config.nightLength)
      if (nextPhase === undefined) {
        throw new Error('voteLength is invalid')
      }
      yield put(setSchedule({ date: nextPhase }))
    }
  } else if (targets && (targets.length > 1 || targets[0].key === 'null')) {
    const voteTargetPlayerId =
      targets[0].key !== 'null'
        ? targets
          ?.filter((target) => target.key !== 'null')
          .map((target) => target.key)
        : ((yield select(survivalPlayersSelector)) as PlayerState[]).map(player => player.Id)
    if (voteTargetPlayerId.length < 2 || voteTargetPlayerId.find(playerId => playerId == null) !== undefined) {
      throw new Error('Something worng')
    }
    yield put(setVoteTargets({ targets: voteTargetPlayerId }))
    yield put(resetVote())
    const targetUsers: UserState[] = yield all(
      voteTargetPlayerId.map((playerId) =>
        select(userWithPlayerIdSelector, playerId)
      )
    )
    yield put(sendMessage({ target: 'All', message: { message: 'Final Vote. subject are {{ users.Name }}', param: { users: targetUsers } } }))
    const config: Config = yield select(configSelector)
    const nextPhase = calcrateNextPhase(dayjs().utc(), config.finalVoteLength)
    if (nextPhase === undefined) {
      throw new Error('voteLength is invalid')
    }
    yield put(setSchedule({ date: nextPhase }))
  }
}

function * voteTask (context:GameContext) {
  const survivalPlayers: PlayerState[] = yield select(
    survivalPlayersSelector
  )
  if (survivalPlayers.every((player) => player.VoteTo !== null)) {
    yield call(totalVote, context)
  }
}

const timeoutTask = function * (context:GameContext) {
  const phase: Phase = yield select(phaseSelector)
  if (phase === 'Daytime') {
    const targets: PlayerState[] = yield select(survivalPlayersSelector)
    yield put(
      setVoteTargets({ targets: targets.map((target) => target.Id) })
    )
    yield put(toVote())
    yield put(sendMessage({ target: 'All', message: { message: 'It\'s vote time.' } }))
    const config: Config = yield select(configSelector)
    const nextPhase = calcrateNextPhase(dayjs().utc(), config.voteLength)
    if (nextPhase === undefined) {
      throw new Error('voteLength is invalid')
    }
    yield put(setSchedule({ date: nextPhase }))
  } else if (phase === 'Vote') {
    yield call(totalVote, context)
  } else if (phase === 'Night') {
    const survivalPlayers: PlayerState[] = yield select(
      survivalPlayersSelector
    )
    const killed = survivalPlayers.find(
      (player) => player.IsBited && !player.IsProtected
    )
    if (killed !== undefined) {
      yield put(kill({ target: killed.Id }))
    }
    yield put(resetNight())
    if (yield call(judgeWin)) {
      return
    }
    yield put(toDay())
    const game: GameState = yield select(gameSelector)
    yield put(sendMessage({ target: 'All', message: { message: 'It\'s morning. (Day {{day}})', param: { day: game.Days } } }))
    if (killed !== undefined) {
      const killedUser = stateToUser(yield select(userSelector, killed.UserId))
      if (!killedUser) {
        throw new Error('何故かユーザーが見つからない!')
      }
      yield put(sendMessage({ target: 'All', message: { message: '{{user.Name}} was found dead in a heap.', param: { user: killedUser } } }))
    } else {
      yield put(sendMessage({ target: 'All', message: { message: 'The morning was uneventful.' } }))
    }
    const config: Config = yield select(configSelector)
    const nextPhase = calcrateNextPhase(dayjs().utc(), config.dayLength)
    if (nextPhase === undefined) {
      throw new Error('voteLength is invalid')
    }
    yield put(setSchedule({ date: nextPhase }))
  }
}

export const sendMessageTask = function * (context:GameContext, action: ReturnType<typeof sendMessage>) {
  const channel:ChannelState = yield select(channelWithTargetSelector, action.payload.target)
  context.channelManager.Send(channel.Id, action.payload.message)
}

const gameoverTask = function * () {
  yield put(setSchedule({ date: undefined }))
}

const setScheduleTask = function * (context:GameContext, action: ReturnType<typeof setSchedule>) {
  context.scheduler.SetSchedule(action.payload.date)
  if (action.payload.date !== undefined) {
    yield put(sendMessage({ target: 'All', message: { message: 'The next phase is {{date}}', param: { date: action.payload.date } } }))
  }
}
const rootTask = function * (context: GameContext) {
  yield takeEvery(vote.type, voteTask, context)
  yield takeEvery(timeOut.type, timeoutTask, context)
  yield takeEvery(sendMessage.type, sendMessageTask, context)
  yield takeEvery(setSchedule.type, setScheduleTask, context)
  yield takeEvery(toGameOver.type, gameoverTask)
}

function parseState (value:string):RootState {
  const json = JSON.parse(value)
  return {
    game: {
      Config: json.game.Config,
      Days: json.game.Days,
      Id: json.game.Id,
      NextPhase: json.game.NextPhase === undefined || json.game.NextPhase === null ? undefined : dayjs(json.game.NextPhase),
      Phase: json.game.Phase
    },
    players: json.players,
    users: json.users,
    channels: Immutable.Map(Object.entries(json.channels).map(([key, value]) => key === 'All' || key === 'Werewolf' || key === 'Sharer' ? [key as MessageTarget, value as ChannelState] : [[key], value as ChannelState]))
  }
}

function serializeState (state:RootState):string {
  return JSON.stringify(state)
}

interface ErrorData{
  error: Error,
  errorInfo: any
}

export class Game {
  store: Store<RootState, AnyAction>
  #context: GameContext
  #errors: ErrorData[] = []
  constructor(
    context:GameContext,
    players: PlayerState[],
    users: User[],
    config: Config,
    allChannelId:ChannelId,
    gameId: GameId
  );

  constructor(
    context: GameContext,
    stateText: string
  );

  constructor (
    context: GameContext,
    stateOrPlayer: PlayerState[] | string,
    users?: User[],
    config?: Config,
    allChannelId?:ChannelId,
    gameId?: GameId
  ) {
    this.#context = context
    const isNewGame = typeof users === 'object'
    const reducer = combineReducers<RootState>({
      players: playerSlice.reducer,
      game: gameSline.reducer,
      users: userSlice.reducer,
      channels: channelSline.reducer
    })
    const sagaMiddleware = createSagaMiddleware({ onError: (err, info) => this.#errors.push({ error: err, errorInfo: info }) })
    const composeEnhancers =
      typeof window === 'undefined' ? compose : (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
    this.store = createStore(
      reducer,
      composeEnhancers(applyMiddleware(sagaMiddleware))
    )
    sagaMiddleware.run(rootTask, context)

    if (users && config && allChannelId && stateOrPlayer instanceof Array) {
      const players = stateOrPlayer as PlayerState[]
      gameId = gameId || Date.now().toString()
      this.store.dispatch(setGameId(gameId))
      this.store.dispatch(setConfig(config))
      this.store.dispatch(setInitialPlayerState({ state: players }))
      this.store.dispatch(setInitialUserState({ state: users.map(user => ({ Id: user.Id, Name: user.Name } as UserState)) }))
      this.store.dispatch(addChannel({ id: allChannelId, target: 'All', users: users.map(user => user.Id) }))
    } else if (typeof stateOrPlayer === 'string') {
      const state = parseState(stateOrPlayer)
      for (const key in state) {
        (this.store.getState() as any)[key] = (state as any)[key]
      }
    } else {
      throw new Error('arg is wrong')
    }
  }

  async startGame ():Promise<void> {
    const players = playersSelector(this.getState())
    const werewolfUserIds = players.filter(player => player.Position === 'Werewolf').map(player => player.UserId)
    const werewolfChannelId = await this.#context.channelManager.Join(werewolfUserIds)
    this.store.dispatch(addChannel({ id: werewolfChannelId, target: 'Werewolf', users: werewolfUserIds }))
    this.store.dispatch(sendMessage({ target: 'Werewolf', message: { message: 'You are {{position}}', param: { position: 'Werewolf' } } }))

    const sharerUserIds = players.filter(player => player.Position === 'Sharer').map(player => player.UserId)
    if (sharerUserIds.length > 0) {
      const groups = chunk(sharerUserIds, 2)
      for (const group of groups) {
        const shererChannelId = await this.#context.channelManager.Join(group)
        this.store.dispatch(addChannel({ id: shererChannelId, target: 'Sharer', users: sharerUserIds }))
        this.store.dispatch(sendMessage({ target: 'Sharer', message: { message: 'You are {{position}}', param: { position: 'Sharer' } } }))
      }
    }

    const fortuneTellers = players.filter(player => player.Position === 'FortuneTeller')
    for (const fortuneTeller of fortuneTellers) {
      const channelId = await this.#context.channelManager.Join([
        fortuneTeller.UserId
      ])
      this.store.dispatch(
        addChannel({
          id: channelId,
          target: [fortuneTeller.UserId],
          users: [fortuneTeller.UserId]
        })
      )
      this.store.dispatch(
        sendMessage({
          target: [fortuneTeller.UserId],
          message: {
            message: 'You are {{position}}',
            param: { position: fortuneTeller.Position }
          }
        })
      )
      const whites = this.#context.shuffleFunc?.(
        players
          .filter(player => player.Position !== 'Werewolf' && player.Id !== fortuneTeller.Id)
          .map(player => userWithPlayerIdSelector(this.getState(), player.Id))
          .filter((user): user is User => user !== undefined)
      )
      if (whites == null || whites.length < 1) {
        throw new Error('white not found')
      }
      this.store.dispatch(
        sendMessage({
          target: [fortuneTeller.UserId],
          message: {
            message: '{{user.Name}} is {{camp}}',
            param: { user: whites[0], camp: 'Citizen Side' }
          }
        })
      )
    }

    const otherPlayers = players.filter(player => player.Position !== 'Sharer' && player.Position !== 'Werewolf' && player.Position !== 'FortuneTeller')
    for (const player of otherPlayers) {
      const channelId = await this.#context.channelManager.Join([player.UserId])
      this.store.dispatch(addChannel({ id: channelId, target: [player.UserId], users: [player.UserId] }))
      this.store.dispatch(sendMessage({ target: [player.UserId], message: { message: 'You are {{position}}', param: { position: player.Position } } }))
    }
    const config = gameSelector(this.getState()).Config
    this.store.dispatch(sendMessage({ target: 'All', message: { message: 'The werewolf game start' } }))
    this.store.dispatch(toDay())
    const nextPhase = calcrateNextPhase(dayjs().utc(), config.dayLength)
    if (nextPhase === undefined) {
      throw new Error('voteLength is invalid')
    }
    this.store.dispatch(setSchedule({ date: nextPhase }))
  }

  getPlayerByUserId (user: UserId) {
    const state = this.store
      .getState()
      .players.find((player) => player.UserId === user)
    if (state === undefined) {
      return undefined
    }

    return new Player(this.store.dispatch, state)
  }

  getPlayerByPlayerId (id: PlayerId) {
    const state = this.store
      .getState()
      .players.find((player) => player.Id === id)
    if (state === undefined) {
      return undefined
    }

    return new Player(this.store.dispatch, state)
  }

  TimeOut (): void {
    this.store.dispatch(timeOut())
  }

  getState ():RootState {
    return this.store.getState()
  }

  isNight ():boolean {
    return gameSelector(this.getState()).Phase === 'Night'
  }

  isVoteTime ():boolean {
    return gameSelector(this.getState()).Phase === 'Vote'
  }

  isGameOver ():boolean {
    return this.getState().game.Phase === 'GameOver'
  }

  getChannel (id:ChannelId): Channel | undefined {
    const state = channelSelector(this.getState(), id)
    if (state === undefined) {
      return undefined
    } else {
      return new Channel(state)
    }
  }

  getSerializedState (): string {
    return serializeState(this.getState())
  }

  checkError ():void {
    if (this.#errors.length > 0) {
      throw [...this.#errors]
    }
  }
}
