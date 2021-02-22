import { createUserSelector, createUserSlice, User, UserState } from './user'
import { Config } from './config'
import { createCitizenStore, createFortuneTellerStore, createKnightStore, createPlayerSelector, createPlayersSlice, createPsychicStore, createPsychoStore, createSharerStore, createSurvivalPlayersSelector, createWerewolfStore, kill, Player, PlayerState, resetNight, setVoteTargets, vote } from './player'
import { AnyAction, applyMiddleware, CombinedState, combineReducers, createAction, createSlice, createStore, Store } from '@reduxjs/toolkit'
import { store } from '../store'
import { CannelFactory, Channel } from './channel'
import createSagaMiddleware from 'redux-saga'
import { fork, put, select, takeEvery } from 'redux-saga/effects'
import groupBy from 'lodash/fp/groupBy'
import { sortBy } from 'lodash'

export type GameId = string;
export type Phase = 'Daytime' | 'Vote' | 'Night';

interface GameState {
  Phase: Phase
  Days: number
}
const toDay = createAction('toDay')
const toNight = createAction('toNight')
const toVote = createAction('toVote')
const timeOut = createAction('timeOut')
const gameSline = createSlice({
  name: 'game',
  initialState: { Phase: 'Daytime', Days: 1 } as GameState,
  reducers: {
    toDay: (state) => ({ Phase: 'Daytime', Days: state.Days + 1 }),
    toNight: (state) => ({ Phase: 'Daytime', Days: state.Days }),
    toVote: (state) => ({ Phase: 'Daytime', Days: state.Days })
  }
})

interface RootState {
  game: GameState,
  users: UserState[],
  players: PlayerState[]
}

const usersSelector = (state: RootState) => state.users
const userSelector = createUserSelector(usersSelector)
const playersSelector = (state: RootState) => state.players
const playerSelector = createPlayerSelector(playersSelector)
const survivalPlayersSelector = createSurvivalPlayersSelector(playersSelector)
const gameSelector = (state: RootState) => state.game
export class Game {
  Config: Config;
  WerewolfChannel: Channel
  ShererChannel: Channel | null
  AllChannel: Channel
  #store: Store<RootState, AnyAction>;

  constructor (store: Store<RootState, AnyAction>, config: Config, allChannel: Channel, werewolfChannel: Channel, shererChannel: Channel | null) {
    this.#store = store
    this.Config = config
    this.AllChannel = allChannel
    this.WerewolfChannel = werewolfChannel
    this.ShererChannel = shererChannel
  }

  getPlayerByUser (user: User) {
    const state = this.#store.getState().players.find(player => player.User === user.Id)
    if (state === undefined) {
      return undefined
    }

    return new Player(this.#store.dispatch, state)
  }

  ToNight () {
  }

  ToDay () {
    const killed = this.#store.getState().players.find(player => player.IsBited && !player.IsProtected)
    if (killed !== undefined) {
      this.#store.dispatch(kill({ target: killed.Id }))
    }
    this.#store.dispatch(resetNight())
    this.#store.dispatch(toDay())
    this.AllChannel.Send(`朝になりました(${this.#store.getState().game.Days}日目)`)
    if (killed !== undefined) {
      this.AllChannel.Send(`${userSelector(this.getState(), killed.User)?.Name}は無残な死体となって発見されました。`)
    }
  }

  ToVote () {
    const targets = survivalPlayersSelector(this.getState())
    this.#store.dispatch(setVoteTargets({ targets: targets.map(target => target.Id) }))
    this.#store.dispatch(toVote())
  }

  TimeOut (): void {
    this.#store.dispatch(timeOut())
  }

  getState () {
    return this.#store.getState()
  }
}

function getRandomInt (max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

function * voteTask () {
  const survivalPlayers: PlayerState[] = yield select(survivalPlayersSelector)
  if (survivalPlayers.every(player => player.VoteTo !== null)) {
    const votedGroup = groupBy<PlayerState>(player => player.VoteTo, survivalPlayers)
    const countGroup = groupBy(v => v.length, votedGroup)
  }
}

function * rootTask () {
  yield takeEvery(vote.type, voteTask)
}

export const createGame = (users: User[], config: Config, allChannel: Channel, channelFactory: CannelFactory): Game => {
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

  const werewolfChannel = channelFactory(players.filter(player => player.Position === 'Werewolf').map(player => player.User), 'Werewolf')

  let sharerfChannel = null
  if (config.numberOfSharer > 0) {
    sharerfChannel = channelFactory(players.filter(player => player.Position === 'Sharer').map(player => player.User), 'Sherer')
  }

  const palayerSlice = createPlayersSlice(players)
  const userSlice = createUserSlice(users.map(user => ({ Id: user.Id, Name: user.Name } as UserState)))
  const reducer = combineReducers<RootState>({
    players: palayerSlice.reducer,
    game: gameSline.reducer,
    users: userSlice.reducer
  })
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(reducer, applyMiddleware(sagaMiddleware))

  return new Game(store, config, allChannel, werewolfChannel, sharerfChannel)
}
