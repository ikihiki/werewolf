import { createUserSelector, setInitialUserState, User, UserId, userSlice, UserState } from './user'
import { Config } from './config'
import { playerSlice, createCitizenStore, createFortuneTellerStore, createKnightStore, createPlayerSelector, createPsychicStore, createPsychoStore, createSharerStore, createSurvivalPlayersSelector, createWerewolfStore, kill, Player, PlayerState, resetNight, setVoteTargets, vote, setInitialPlayerState, createVotingTargetPlayersSelector, PlayerId } from './player'
import { AnyAction, applyMiddleware, CombinedState, combineReducers, createAction, createSlice, createStore, Store } from '@reduxjs/toolkit'
import { CannelFactory, Channel } from './channel'
import createSagaMiddleware from 'redux-saga'
import { fork, put, select, takeEvery } from 'redux-saga/effects'
import groupBy from 'lodash/fp/groupBy'
import { sortBy, takeWhile } from 'lodash'
import { compose } from 'redux'

export type GameId = string;
export type Phase = 'Daytime' | 'Vote' | 'Night';
export interface Scheduler {
  SetSchedule:(date: Date)=>void;
}

interface GameState {
  Phase: Phase
  Days: number
}
const timeOut = createAction('timeOut')
const gameSline = createSlice({
  name: 'game',
  initialState: { Phase: 'Daytime', Days: 1 } as GameState,
  reducers: {
    toDay: (state) => ({ Phase: 'Daytime', Days: state.Days + 1 }),
    toNight: (state) => ({ Phase: 'Night', Days: state.Days }),
    toVote: (state) => ({ Phase: 'Vote', Days: state.Days })
  }
})
export const { toDay, toNight, toVote } = gameSline.actions
interface RootState {
  game: GameState,
  users: UserState[],
  players: PlayerState[]
}

export const usersSelector = (state: RootState) => state.users
export const userSelector = createUserSelector(usersSelector)
export const playersSelector = (state: RootState) => state.players
export const playerSelector = createPlayerSelector(playersSelector)
export const survivalPlayersSelector = createSurvivalPlayersSelector(playersSelector)
export const votingTargetPlayersSeledtor = createVotingTargetPlayersSelector(playersSelector)
export const gameSelector = (state: RootState) => state.game
export const phaseSelector = (state: RootState) => gameSelector(state).Phase
export class Game {
  Config: Config;
  WerewolfChannel: Channel
  ShererChannel: Channel | null
  AllChannel: Channel
  store: Store<RootState, AnyAction>;
  Scheduler:Scheduler
  constructor(players: PlayerState[], users: User[], config:Config, allChannel: Channel, werewolfChannel: Channel, shererChannel: Channel | null, scheduler:Scheduler);
  constructor (state: RootState, _:number, config: Config, allChannel: Channel, werewolfChannel: Channel, shererChannel: Channel | null, scheduler:Scheduler) ;
  constructor (stateOrPlayer:PlayerState[]|RootState, userOrDummy:User[]| number, config: Config, allChannel: Channel, werewolfChannel: Channel, shererChannel: Channel | null, scheduler:Scheduler) {
    this.Config = config
    this.AllChannel = allChannel
    this.WerewolfChannel = werewolfChannel
    this.ShererChannel = shererChannel
    this.Scheduler = scheduler

    const reducer = combineReducers<RootState>({
      players: playerSlice.reducer,
      game: gameSline.reducer,
      users: userSlice.reducer
    })
    const sagaMiddleware = createSagaMiddleware()
    const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
    this.store = createStore(reducer, composeEnhancers(applyMiddleware(sagaMiddleware)))
    if (typeof userOrDummy === 'object') {
      const players = stateOrPlayer as PlayerState[]
      const users = userOrDummy as UserState[]
      this.store.dispatch(setInitialPlayerState({ state: players }))
      this.store.dispatch(setInitialUserState({ state: users }))
    } else {
      this.store.getState()
    }

    function * voteTask () {
      const survivalPlayers: PlayerState[] = yield select(survivalPlayersSelector)
      if (survivalPlayers.every(player => player.VoteTo !== null)) {
        const votedGroup = groupBy<PlayerState>(player => player.VoteTo, survivalPlayers)
        console.log(votedGroup)
        const countGroup = groupBy(v => v.length, votedGroup)
        console.log(countGroup)
      }
    }

    const timeoutTask = function * () {
      const phase:Phase = yield select(phaseSelector)
      if (phase === 'Daytime') {
        const targets:PlayerState[] = yield select(survivalPlayersSelector)
        yield put(setVoteTargets({ targets: targets.map(target => target.Id) }))
        yield put(toVote())
      } else if (phase === 'Vote') {

      }
    }

    const rootTask = function * () {
      yield takeEvery(vote.type, voteTask)
      yield takeEvery(timeOut.type, timeoutTask)
    }

    sagaMiddleware.run(rootTask)
  }

  getPlayerByUserId (user: UserId) {
    const state = this.store.getState().players.find(player => player.User === user)
    if (state === undefined) {
      return undefined
    }

    return new Player(this.store.dispatch, state)
  }

  getPlayerByPlayerId (id: PlayerId) {
    const state = this.store.getState().players.find(player => player.Id === id)
    if (state === undefined) {
      return undefined
    }

    return new Player(this.store.dispatch, state)
  }

  ToNight () {
  }

  ToDay () {
    const killed = this.store.getState().players.find(player => player.IsBited && !player.IsProtected)
    if (killed !== undefined) {
      this.store.dispatch(kill({ target: killed.Id }))
    }
    this.store.dispatch(resetNight())
    this.store.dispatch(toDay())
    this.AllChannel.Send(`朝になりました(${this.store.getState().game.Days}日目)`)
    if (killed !== undefined) {
      this.AllChannel.Send(`${userSelector(this.getState(), killed.User)?.Name}は無残な死体となって発見されました。`)
    }
  }

  ToVote () {
    const targets = survivalPlayersSelector(this.getState())
    this.store.dispatch(setVoteTargets({ targets: targets.map(target => target.Id) }))
    this.store.dispatch(toVote())
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

export const createGame = (users: User[], config: Config, allChannel: Channel, channelFactory: CannelFactory, scheduler:Scheduler): Game => {
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

  return new Game(players, users, config, allChannel, werewolfChannel, sharerfChannel, scheduler)
}
