import { Config } from './config'
import { Game, GameId } from './game'
import { Scheduler } from './scheduler'
import { ChannelId, ChannelManager } from './channel'
import { Camp, createCitizenStore, createFortuneTellerStore, createKnightStore, createPsychicStore, createPsychoStore, createSharerStore, createWerewolfStore, PlayerState, Position } from './player'
import { User, UserId } from './user'
import { ErrorMessage } from './error'
import { Logger } from 'pino'

export type ShuffleFunc = (users: User[]) => User[]

function shuffle<T>([...array]: Array<T>): Array<T> {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export const createGame = (
  users: User[],
  config: Config,
  channelManager: ChannelManager,
  scheduler: Scheduler,
  allChannelId: ChannelId,
  shuffleFunc?: ShuffleFunc,
  gameId?: GameId
): Game => {
  gameId = gameId || Date.now().toString()
  const players: PlayerState[] = []
  shuffleFunc = shuffleFunc || shuffle
  const shuffledUsers = shuffleFunc([...users])
  // werewolf
  for (let i = 0; i < config.numberOfWerewolf; i++) {
    const user = shuffledUsers.pop()
    if (!user) {
      throw new Error('なんか役職のプレイヤーがおらん')
    }
    players.push(createWerewolfStore(`${gameId}-${user.Id}`, user))
  }
  // fortune teller
  for (let i = 0; i < config.numberOfFortuneTeller; i++) {
    const user = shuffledUsers.pop()
    if (!user) {
      throw new Error('なんか役職のプレイヤーがおらん')
    } players.push(createFortuneTellerStore(`${gameId}-${user.Id}`, user))
  }
  // psycho
  for (let i = 0; i < config.numberOfPsycho; i++) {
    const user = shuffledUsers.pop()
    if (!user) {
      throw new Error('なんか役職のプレイヤーがおらん')
    }
    players.push(createPsychoStore(`${gameId}-${user.Id}`, user))
  }
  // psychic
  for (let i = 0; i < config.numberOfPsychic; i++) {
    const user = shuffledUsers.pop()
    if (!user) {
      throw new Error('なんか役職のプレイヤーがおらん')
    }
    players.push(createPsychicStore(`${gameId}-${user.Id}`, user))
  }
  // knight
  for (let i = 0; i < config.numberOfKnight; i++) {
    const user = shuffledUsers.pop()
    if (!user) {
      throw new Error('なんか役職のプレイヤーがおらん')
    }
    players.push(createKnightStore(`${gameId}-${user.Id}`, user))
  }
  // sharer
  for (let i = 0; i < config.numberOfSharer; i++) {
    const user = shuffledUsers.pop()
    if (!user) {
      throw new Error('なんか役職のプレイヤーがおらん')
    }
    players.push(createSharerStore(`${gameId}-${user.Id}`, user))
  }
  // citizen
  for (const user of shuffledUsers) {
    players.push(createCitizenStore(`${gameId}-${user.Id}`, user))
  }

  return new Game(
    channelManager,
    scheduler,
    players,
    users,
    config,
    allChannelId,
    gameId
  )
}

export const storeGame = (context: GameContext): Game => {
  const state = context.stateManager.loadState()
  if (state === undefined) {
    throw Error('Game is not started.' as ErrorMessage)
  }

  return new Game(
    context.channelManager,
    context.scheduler,
    state
  )
}

export interface StateManager {
  loadState(): string | undefined
  saveState(state: string): void
  pushAction(actions: any[]): void
}

export interface GameContext {
  stateManager: StateManager;
  channelManager: ChannelManager;
  scheduler: Scheduler;
  logger: Logger;
}


export const bite = (context: GameContext, channelId: ChannelId, user: UserId, targetUser: UserId): void => {
  const game = storeGame(context)
  const channel = game.getChannel(channelId)
  if (channel?.Target !== 'Werewolf') {
    throw new Error('Wrong channel.' as ErrorMessage)
  }
  if (!game.isNight()) {
    throw new Error("It's not night, so I can't run it." as ErrorMessage)
  }
  const player = game.getPlayerByUserId(user)
  if (player === undefined) {
    throw new Error("Couldn't find the player." as ErrorMessage)
  }
  const targetPlayer = game.getPlayerByUserId(targetUser)
  if (targetPlayer === undefined) {
    throw new Error("Couldn't find the target." as ErrorMessage)
  }
  player.Bite(targetPlayer)
  game.checkError()
  context.stateManager.saveState(game.getSerializedState())

}

export const fortune = (context: GameContext, channelId: ChannelId, user: UserId, targetUser: UserId): string => {
  const game = storeGame(context)
  const channel = game.getChannel(channelId)
  if (channel?.isDm(user) !== true) {
    throw new Error('Wrong channel.' as ErrorMessage)
  }
  if (!game.isNight()) {
    throw new Error("It's not night, so I can't run it." as ErrorMessage)
  }
  const player = game.getPlayerByUserId(user)
  if (player === undefined) {
    throw new Error("Couldn't find the player." as ErrorMessage)
  }
  const targetPlayer = game.getPlayerByUserId(targetUser)
  if (targetPlayer === undefined) {
    throw new Error("Couldn't find the target." as ErrorMessage)
  }
  return player.Fortune(targetPlayer)
}

export const escort = (context: GameContext, channelId: ChannelId, user: UserId, targetUser: UserId): void => {
  const game = storeGame(context)
  const channel = game.getChannel(channelId)
  if (channel?.isDm(user) !== true) {
    throw new Error('Wrong channel.' as ErrorMessage)
  }
  if (!game.isNight()) {
    throw new Error("It's not night, so I can't run it." as ErrorMessage)
  }
  const player = game.getPlayerByUserId(user)
  if (player === undefined) {
    throw new Error("Couldn't find the player." as ErrorMessage)
  }
  const targetPlayer = game.getPlayerByUserId(targetUser)
  if (targetPlayer === undefined) {
    throw new Error("Couldn't find the target." as ErrorMessage)
  }
  player.Escort(targetPlayer)
  game.checkError()
  context.stateManager.saveState(game.getSerializedState())
}

export const comingOut = (context: GameContext, channelId: ChannelId, user: UserId, position: Position, targetUser?: UserId, camp?: Camp): void => {
  const game = storeGame(context)
  const channel = game.getChannel(channelId)
  if (channel?.Target !== 'All') {
    throw new Error('Wrong channel.' as ErrorMessage)
  }
  if (game.isNight()) {
    throw new Error("It's night, so I can't run it." as ErrorMessage)
  }
  const player = game.getPlayerByUserId(user)
  if (player === undefined) {
    throw new Error("Couldn't find the player." as ErrorMessage)
  }
  player.ComingOut(position)
  if (targetUser !== undefined && camp !== undefined) {
    const targetPlayer = game.getPlayerByUserId(targetUser)
    if (targetPlayer === undefined) {
      throw new Error("Couldn't find the target." as ErrorMessage)
    }
    player.Report({ target: targetPlayer.Id, camp: camp })
  }
  game.checkError()
  context.stateManager.saveState(game.getSerializedState())
}

export const report = (context: GameContext, channelId: ChannelId, user: UserId, targetUser: UserId, camp: Camp): void => {
  const game = storeGame(context)
  const channel = game.getChannel(channelId)
  if (channel?.Target !== 'All') {
    throw new Error('Wrong channel.' as ErrorMessage)
  }
  if (game.isNight()) {
    throw new Error("It's night, so I can't run it." as ErrorMessage)
  }
  const player = game.getPlayerByUserId(user)
  if (player === undefined) {
    throw new Error("Couldn't find the player." as ErrorMessage)
  }
  const targetPlayer = game.getPlayerByUserId(targetUser)
  if (targetPlayer === undefined) {
    throw new Error("Couldn't find the target." as ErrorMessage)
  }
  player.Report({ target: targetPlayer.Id, camp: camp })
  game.checkError()
  context.stateManager.saveState(game.getSerializedState())
}

export const vote = (context: GameContext, channelId: ChannelId, user: UserId, targetUser: UserId): void => {
  const game = storeGame(context)
  const channel = game.getChannel(channelId)
  if (channel?.Target !== 'All') {
    throw new Error('Wrong channel.' as ErrorMessage)
  }
  if (!game.isVoteTime()) {
    throw new Error("It's not vote time, so I can't run it." as ErrorMessage)
  }
  const player = game.getPlayerByUserId(user)
  if (player === undefined) {
    throw new Error("Couldn't find the player." as ErrorMessage)
  }
  const targetPlayer = game.getPlayerByUserId(targetUser)
  if (targetPlayer === undefined) {
    throw new Error("Couldn't find the target." as ErrorMessage)
  }
  player.Vote(targetPlayer)
  game.checkError()
  context.stateManager.saveState(game.getSerializedState())
}

export const timeout = (context: GameContext): void => {
  const game = storeGame(context)
  game.TimeOut()
  game.checkError()
  context.stateManager.saveState(game.getSerializedState())
}
