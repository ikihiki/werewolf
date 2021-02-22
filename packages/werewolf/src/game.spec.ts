import { createGame } from './game'
import { User } from './user'
import { Config } from './config'

describe('createGame', () => {
  it('create', () => {
    const users = []
    for (let i = 1; i < 29; i++) {
      users.push(new User(`User${i}`))
    }
    const config: Config = {
      numberOfWerewolf: 6,
      numberOfPsycho: 5,
      numberOfFortuneTeller: 4,
      numberOfKnight: 3,
      numberOfPsychic: 1,
      numberOfSharer: 2
    }
    const game = createGame(users, config)
    expect(game.Players.filter(player => player.Position === 'Werewolf').length).toBe(6)
    expect(game.Players.filter(player => player.Position === 'Psycho').length).toBe(5)
    expect(game.Players.filter(player => player.Position === 'FortuneTeller').length).toBe(4)
    expect(game.Players.filter(player => player.Position === 'Knight').length).toBe(3)
    expect(game.Players.filter(player => player.Position === 'Psychic').length).toBe(1)
    expect(game.Players.filter(player => player.Position === 'Sharer').length).toBe(2)
    expect(game.Players.filter(player => player.Position === 'Citizen').length).toBe(7)
  })
})
