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
  createCitizenStore,
  createFortuneTellerStore,
  createKnightStore,
  createPlayerSelector,
  createPsychicStore,
  createPsychoStore,
  createSharerStore,
  createSurvivalPlayersSelector,
  createWerewolfStore,
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
  CombinedState,
  combineReducers,
  createAction,
  createSlice,
  createStore,
  Store,
  PayloadAction,
  createSelector
} from '@reduxjs/toolkit'
import { ChannelManager, MessageTarget, Message } from './channel'
import createSagaMiddleware from 'redux-saga'
import { all, call, fork, put, select, takeEvery } from 'redux-saga/effects'
import groupBy from 'lodash/fp/groupBy'
import { max, maxBy, sortBy, takeWhile } from 'lodash'
import { Action, compose } from 'redux'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)


export type GameId = string;
export type Phase = 'Daytime' | 'Vote' | 'Night' | 'GameOver';
export interface Scheduler {
  SetSchedule: (date: dayjs.Dayjs) => void;
}

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
    sendMessage: (state, action: PayloadAction<{ target: MessageTarget, message: Message }>) => state,
    setSchedule: (state, actiion:PayloadAction<{date:dayjs.Dayjs}>) => state
  }
})
export const {
  setConfig,
  toDay,
  toNight,
  toVote,
  toGameOver,
  sendMessage,
  setSchedule
} = gameSline.actions
interface RootState {
  game: GameState;
  users: UserState[];
  players: PlayerState[];
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
export class Game {
  #channelManager: ChannelManager;
  #scheduler: Scheduler;

  store: Store<RootState, AnyAction>;
  constructor(
    players: PlayerState[],
    users: User[],
    config: Config,
    channelManager: ChannelManager,
    scheduler: Scheduler
  );

  constructor(
    state: RootState,
    _1: number,
    _2: number,
    channelManager: ChannelManager,
    scheduler: Scheduler
  );

  constructor (
    stateOrPlayer: PlayerState[] | RootState,
    userOrDummy: User[] | number,
    configOrDummy: Config | number,
    channelManager: ChannelManager,
    scheduler: Scheduler
  ) {
    this.#channelManager = channelManager
    this.#scheduler = scheduler

    const isNewGame = typeof userOrDummy === 'object'

    const reducer = combineReducers<RootState>({
      players: playerSlice.reducer,
      game: gameSline.reducer,
      users: userSlice.reducer
    })
    const sagaMiddleware = createSagaMiddleware()
    const composeEnhancers =
      (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
    this.store = createStore(
      reducer,
      composeEnhancers(applyMiddleware(sagaMiddleware))
    )

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
      const maxCount = max(Array.from(countGroup.keys()).map(count=>Number.parseInt(count)))
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
        yield put(setSchedule({ date: dayjs().add(dayjs.duration(config.voteLength))}))
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

    const messageTask = function * (action: ReturnType<typeof sendMessage>) {
      channelManager.Send(action.payload.target, action.payload.message)
    }

    const setScheduleTask = function * (action: ReturnType<typeof setSchedule>) {
      scheduler.SetSchedule(action.payload.date)
      yield put(sendMessage({target:'All', message:{message:'The next phase is {{date}}', param: {date:action.payload.date}}}))
    }
    const rootTask = function * () {
      yield takeEvery(vote.type, voteTask)
      yield takeEvery(timeOut.type, timeoutTask)
      yield takeEvery(sendMessage.type, messageTask)
      yield takeEvery(setSchedule.type, setScheduleTask)
    }

    sagaMiddleware.run(rootTask)

    if (isNewGame) {
      const players = stateOrPlayer as PlayerState[]
      const users = userOrDummy as UserState[]
      const config = configOrDummy as Config
      this.store.dispatch(setConfig(config))
      this.store.dispatch(setInitialPlayerState({ state: players }))
      this.store.dispatch(setInitialUserState({ state: users }))

      const werewolfUserIds = players.filter(player => player.Position === 'Werewolf').map(player => player.UserId)
      this.store.dispatch(sendMessage({ target: werewolfUserIds, message: { message: 'You are {{position}}', param: { position: 'Werewolf' } } }))
      const sharerUserIds = players.filter(player => player.Position === 'Sharer').map(player => player.UserId)
      this.store.dispatch(sendMessage({ target: sharerUserIds, message: { message: 'You are {{position}}', param: { position: 'Sharer' } } }))
      const otherPlayers = players.filter(player => player.Position !== 'Sharer' && player.Position !== 'Werewolf')
      for (const player of otherPlayers) {
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
}

function getRandomInt (max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

export const createGame = (
  users: User[],
  config: Config,
  channelManager: ChannelManager,
  scheduler: Scheduler
): Game => {
  const gameId = Date.now().toString()
  const players: PlayerState[] = []
  const unselectedUsers = [...users]
  const selectUser = () => {
    const number = getRandomInt(unselectedUsers.length - 1)
    return unselectedUsers.splice(number, 1)[0]
  }
  for (let i = 0; i < config.numberOfWerewolf; i++) {
    const user = selectUser()
    players.push(createWerewolfStore(`${gameId}-${user.Id}`, user))
  }
  for (let i = 0; i < config.numberOfPsycho; i++) {
    const user = selectUser()
    players.push(createPsychoStore(`${gameId}-${user.Id}`, user))
  }
  for (let i = 0; i < config.numberOfFortuneTeller; i++) {
    const user = selectUser()
    players.push(createFortuneTellerStore(`${gameId}-${user.Id}`, user))
  }
  for (let i = 0; i < config.numberOfKnight; i++) {
    const user = selectUser()
    players.push(createKnightStore(`${gameId}-${user.Id}`, user))
  }
  for (let i = 0; i < config.numberOfPsychic; i++) {
    const user = selectUser()
    players.push(createPsychicStore(`${gameId}-${user.Id}`, user))
  }
  for (let i = 0; i < config.numberOfSharer; i++) {
    const user = selectUser()
    players.push(createSharerStore(`${gameId}-${user.Id}`, user))
  }
  for (const user of unselectedUsers) {
    players.push(createCitizenStore(`${gameId}-${user.Id}`, user))
  }

  return new Game(
    players,
    users,
    config,
    channelManager,
    scheduler
  )
}

export const storeGame = (
  state: RootState,
  channelManager: ChannelManager,
  scheduler: Scheduler
) => {
  return new Game(
    state,
    0,
    0,
    channelManager,
    scheduler
  )
}
