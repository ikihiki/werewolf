import {
  createUserSelector,
  setInitialUserState,
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
import { ChannelManager, MessageTarget, Message, channelSline, createChannelSelector, ChannelState, addChannel, ChannelId, sendMessage } from './message'
import createSagaMiddleware from 'redux-saga'
import { all, call, put, select, takeEvery } from 'redux-saga/effects'
import groupBy from 'lodash/fp/groupBy'
import { max } from 'lodash'
import { compose } from 'redux'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { Scheduler } from './scheduler'

dayjs.extend(duration)

export type GameId = string;
export type Phase = 'Daytime' | 'Vote' | 'Night' | 'GameOver';
interface GameState {
  Phase: Phase;
  Days: number;
  Config: Config;
}
const timeOut = createAction('timeOut')
const gameSline = createSlice({
  name: 'game',
  initialState: { Phase: 'Daytime', Days: 1 } as GameState,
  reducers: {
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
    setSchedule: (state, actiion:PayloadAction<{date:dayjs.Dayjs}>) => state
  }
})
export const {
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
function * totalVote () {
  const survivalPlayers: PlayerState[] = yield select(
    survivalPlayersSelector
  )
  const votedGroup = new Map(
    Object.entries(
      groupBy<PlayerState>((player) => player.VoteTo, survivalPlayers)
    )
  )
  console.log(votedGroup)
  const votedCount = new Map(
    Array.from(votedGroup.entries()).map(([key, players]) => [
      key,
      players.length
    ])
  )
  console.log(votedCount)
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
  console.log(countGroup)
  const maxCount = max(Array.from(countGroup.keys()).map(count => Number.parseInt(count)))
  if (maxCount === undefined) {
    return
  }
  const targets = countGroup.get(maxCount?.toString())
  if (targets?.length === 1) {
    const target = survivalPlayers.find(
      (player) => player.Id === targets[0].key
    )
    if (target) {
      yield put(resetVote())
      yield put(execute({ target: target.Id }))
      const users: UserState[] = yield select(usersSelector)
      const name = users.find((user) => user.Id === target.UserId)?.Name
      yield put(sendMessage({ target: 'All', message: { message: '{{name}} is executed.', param: { name: name! } } }))
      if (yield call(judgeWin)) {
        return
      }
      yield put(toNight())
      const psychics:PlayerState[] = yield select(playersWithPositionSelector, 'Psychic')
      for (const psychic of psychics) {
        if (target.Position === 'Werewolf') {
          yield put(sendMessage({ target: [psychic.UserId], message: { message: '{{name}} that was executed was a werewolf.', param: { name: name! } } }))
        } else {
          yield put(sendMessage({ target: [psychic.UserId], message: { message: '{{name}} that was executed was a citizen.', param: { name: name! } } }))
        }
      }
      const config:Config = yield select(configSelector)
      yield put(setSchedule({ date: dayjs().add(dayjs.duration(config.nightLength)) }))
    }
  } else if (targets && targets.length > 1) {
    yield put(
      setVoteTargets({ targets: targets?.map((target) => target.key) })
    )
    yield put(resetVote())
    const targetUsers: UserState[] = yield all(targets.map(target => select(userWithPlayerIdSelector, target.key)))
    yield put(sendMessage({ target: 'All', message: { message: 'Final Vote. subject are {{ names }}', param: { names: targetUsers.map(user => user.Name).join(',') } } }))
    const config:Config = yield select(configSelector)
    yield put(setSchedule({ date: dayjs().add(dayjs.duration(config.finalVoteLength)) }))
  }
}

function * voteTask () {
  const survivalPlayers: PlayerState[] = yield select(
    survivalPlayersSelector
  )
  if (survivalPlayers.every((player) => player.VoteTo !== null)) {
    yield call(totalVote)
  }
}

const timeoutTask = function * () {
  const phase: Phase = yield select(phaseSelector)
  if (phase === 'Daytime') {
    const targets: PlayerState[] = yield select(survivalPlayersSelector)
    yield put(
      setVoteTargets({ targets: targets.map((target) => target.Id) })
    )
    yield put(toVote())
    yield put(sendMessage({ target: 'All', message: { message: 'It\'s vote time.' } }))
    const config:Config = yield select(configSelector)
    yield put(setSchedule({ date: dayjs().add(dayjs.duration(config.voteLength)) }))
  } else if (phase === 'Vote') {
    yield call(totalVote)
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
      const users: UserState[] = yield select(usersSelector)
      const name = users.find((user) => user.Id === killed.UserId)?.Name
      yield put(sendMessage({ target: 'All', message: { message: '{{name}} was found dead in a heap.', param: { name: name! } } }))
    } else {
      yield put(sendMessage({ target: 'All', message: { message: 'The morning was uneventful.' } }))
    }
    const config:Config = yield select(configSelector)
    yield put(setSchedule({ date: dayjs().add(dayjs.duration(config.dayLength)) }))
  }
}

export function * sendMessageTask (messageTransmitter: ChannelManager, action: ReturnType<typeof sendMessage>) {
  const channel:ChannelState = yield select(channelSelector, action.payload.target)
  messageTransmitter.Send(channel.Id, action.payload.message)
}

const setScheduleTask = function * (scheduler: Scheduler, action: ReturnType<typeof setSchedule>) {
  scheduler.SetSchedule(action.payload.date)
  yield put(sendMessage({ target: 'All', message: { message: 'The next phase is {{date}}', param: { date: action.payload.date } } }))
}
const rootTask = function * (messageTransmitter: ChannelManager, scheduler: Scheduler) {
  yield takeEvery(vote.type, voteTask)
  yield takeEvery(timeOut.type, timeoutTask)
  yield takeEvery(sendMessage.type, sendMessageTask, messageTransmitter)
  yield takeEvery(setSchedule.type, setScheduleTask, scheduler)
}

export class Game {
  store: Store<RootState, AnyAction>;
  constructor(
    channelManager: ChannelManager,
    scheduler: Scheduler,
    players: PlayerState[],
    users: User[],
    config: Config,
    allChannelId:ChannelId
  );

  constructor(
    channelManager: ChannelManager,
    scheduler: Scheduler,
    state: RootState
  );

  constructor (
    channelManager: ChannelManager,
    scheduler: Scheduler,
    stateOrPlayer: PlayerState[] | RootState,
    users?: User[],
    config?: Config,
    allChannelId?:ChannelId
  ) {
    const isNewGame = typeof users === 'object'

    const reducer = combineReducers<RootState>({
      players: playerSlice.reducer,
      game: gameSline.reducer,
      users: userSlice.reducer,
      channels: channelSline.reducer
    })
    const sagaMiddleware = createSagaMiddleware()
    const composeEnhancers =
      typeof window === 'undefined' ? compose : (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
    this.store = createStore(
      reducer,
      composeEnhancers(applyMiddleware(sagaMiddleware))
    )
    sagaMiddleware.run(rootTask, channelManager, scheduler)

    if (users && config && allChannelId) {
      const players = stateOrPlayer as PlayerState[]
      this.store.dispatch(setConfig(config))
      this.store.dispatch(setInitialPlayerState({ state: players }))
      this.store.dispatch(setInitialUserState({ state: users.map(user => ({ Id: user.Id, Name: user.Name } as UserState)) }))
      this.store.dispatch(addChannel({ id: allChannelId, target: 'All', users: users.map(user => user.Id) }))

      const werewolfUserIds = players.filter(player => player.Position === 'Werewolf').map(player => player.UserId)
      const werewolfChannelId = channelManager.Join(werewolfUserIds)
      this.store.dispatch(addChannel({ id: werewolfChannelId, target: 'Werewolf', users: werewolfUserIds }))
      this.store.dispatch(sendMessage({ target: 'Werewolf', message: { message: 'You are {{position}}', param: { position: 'Werewolf' } } }))

      const sharerUserIds = players.filter(player => player.Position === 'Sharer').map(player => player.UserId)
      const shererChannelId = channelManager.Join(sharerUserIds)
      this.store.dispatch(addChannel({ id: shererChannelId, target: 'Sherer', users: sharerUserIds }))
      this.store.dispatch(sendMessage({ target: 'Sherer', message: { message: 'You are {{position}}', param: { position: 'Sharer' } } }))

      const otherPlayers = players.filter(player => player.Position !== 'Sharer' && player.Position !== 'Werewolf')
      for (const player of otherPlayers) {
        const channelId = channelManager.Join([player.UserId])
        this.store.dispatch(addChannel({ id: channelId, target: [player.UserId], users: [player.UserId] }))
        this.store.dispatch(sendMessage({ target: [player.UserId], message: { message: 'You are {{position}}', param: { position: player.Position } } }))
      }
      this.store.dispatch(setSchedule({ date: dayjs().add(dayjs.duration(config.dayLength)) }))
    } else {
      for (const key in stateOrPlayer) {
        (this.store.getState() as any)[key] = (stateOrPlayer as any)[key]
      }
    }
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

  getState () {
    return this.store.getState()
  }

  isNight () {
    return gameSelector(this.getState()).Phase === 'Night'
  }

  isVoteTime () {
    return gameSelector(this.getState()).Phase === 'Vote'
  }
}
