import { createGame, vote } from './service'
import { User } from './user'
import { Config } from './config'
import { Scheduler } from './scheduler'
import dayjs from 'dayjs'
import { ChannelManager, ChannelState, Message, MessageTarget } from './channel'
import { RootState } from './game'
import * as Immutable from 'immutable'

class TestScheduler implements Scheduler {
  schedules:dayjs.Dayjs[]= [];
  SetSchedule (date: dayjs.Dayjs) {
    this.schedules.push(date)
  }
}

class TestChannelManager implements ChannelManager {
  channels = new Map<string, Message[]>([['main', []]])

  Join (userIds: string[]) {
    const channelId = userIds.join(',')
    this.channels.set(channelId, [])
    return Promise.resolve(channelId)
  }

  Send (id: string, message: Message) {
    this.channels.get(id)?.push(message)
  }
}
const startState: RootState = {
  players: [
    {
      Id: 'test_game-9',
      UserId: '9',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: null,
      Reports: [],
      Camp: 'Werewolf Side',
      Position: 'Werewolf'
    },
    {
      Id: 'test_game-8',
      UserId: '8',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-4',
      Reports: [],
      Camp: 'Werewolf Side',
      Position: 'Werewolf'
    },
    {
      Id: 'test_game-7',
      UserId: '7',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-4',
      Reports: [],
      Camp: 'Citizen Side',
      Position: 'FortuneTeller'
    },
    {
      Id: 'test_game-6',
      UserId: '6',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-8',
      Reports: [],
      Camp: 'Werewolf Side',
      Position: 'Psycho'
    },
    {
      Id: 'test_game-5',
      UserId: '5',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-8',
      Reports: [],
      Camp: 'Citizen Side',
      Position: 'Psychic'
    },
    {
      Id: 'test_game-4',
      UserId: '4',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-8',
      Reports: [],
      Camp: 'Citizen Side',
      Position: 'Knight'
    },
    {
      Id: 'test_game-3',
      UserId: '3',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-8',
      Reports: [],
      Camp: 'Citizen Side',
      Position: 'Sharer'
    },
    {
      Id: 'test_game-2',
      UserId: '2',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-8',
      Reports: [],
      Camp: 'Citizen Side',
      Position: 'Sharer'
    },
    {
      Id: 'test_game-1',
      UserId: '1',
      IsBited: false,
      IsSurvival: true,
      CamingOut: null,
      IsProtected: false,
      IsVotingTarget: true,
      VoteTo: 'test_game-8',
      Reports: [],
      Camp: 'Citizen Side',
      Position: 'Citizen'
    }
  ],
  game: {
    Phase: 'Vote',
    Days: 1,
    Id: 'test_game',
    Config: {
      numberOfWerewolf: 2,
      numberOfPsycho: 1,
      numberOfFortuneTeller: 1,
      numberOfKnight: 1,
      numberOfPsychic: 1,
      numberOfSharer: 2,
      dayLength: 'PT6H',
      nightLength: 'PT6H',
      voteLength: 'PT1H',
      finalVoteLength: 'PT10M'
    }
  },
  users: [
    {
      Id: '1',
      Name: '@user1'
    },
    {
      Id: '2',
      Name: '@user2'
    },
    {
      Id: '3',
      Name: '@user3'
    },
    {
      Id: '4',
      Name: '@user4'
    },
    {
      Id: '5',
      Name: '@user5'
    },
    {
      Id: '6',
      Name: '@user6'
    },
    {
      Id: '7',
      Name: '@user7'
    },
    {
      Id: '8',
      Name: '@user8'
    },
    {
      Id: '9',
      Name: '@user9'
    }
  ],
  channels: Immutable.Map<MessageTarget, ChannelState>([
    [['1'], {
      Id: '1',
      Target: [
        '1'
      ],
      Users: [
        '1'
      ]
    }],
    [['4'], {
      Id: '4',
      Target: [
        '4'
      ],
      Users: [
        '4'
      ]
    }],
    [['5'], {
      Id: '5',
      Target: [
        '5'
      ],
      Users: [
        '5'
      ]
    }],
    [['6'], {
      Id: '6',
      Target: [
        '6'
      ],
      Users: [
        '6'
      ]
    }],
    [['7'], {
      Id: '7',
      Target: [
        '7'
      ],
      Users: [
        '7'
      ]
    }],
    ['All', {
      Id: 'main',
      Target: 'All',
      Users: [
        '1'
      ]
    }],
    ['Werewolf', {
      Id: '9,8',
      Target: 'Werewolf',
      Users: [
        '9',
        '8'
      ]
    }],
    ['Sharer', {
      Id: '3,2',
      Target: 'Sharer',
      Users: [
        '3',
        '2'
      ]
    }
    ]])
}
describe('createGame', () => {
  it('create', () => {
    const users = []
    for (let i = 1; i < 29; i++) {
      users.push(new User(i.toString(), `User${i}`))
    }
    const config: Config = {
      numberOfWerewolf: 6,
      numberOfPsycho: 5,
      numberOfFortuneTeller: 4,
      numberOfKnight: 3,
      numberOfPsychic: 1,
      numberOfSharer: 2,
      dayLength: 'PT6H',
      finalVoteLength: 'PT6H',
      nightLength: 'PT6H',
      voteLength: 'PT6H'
    }
    const cm = new TestChannelManager()
    const s = new TestScheduler()

    const game = createGame(users, config, cm, s, 'main')
    const players = game.getState().players
    expect(players.filter(player => player.Position === 'Werewolf').length).toBe(6)
    expect(players.filter(player => player.Position === 'Psycho').length).toBe(5)
    expect(players.filter(player => player.Position === 'FortuneTeller').length).toBe(4)
    expect(players.filter(player => player.Position === 'Knight').length).toBe(3)
    expect(players.filter(player => player.Position === 'Psychic').length).toBe(1)
    expect(players.filter(player => player.Position === 'Sharer').length).toBe(2)
    expect(players.filter(player => player.Position === 'Citizen').length).toBe(7)

    console.log(game.getSerializedState())
  })
  it('vote', () => {
    const cm = new TestChannelManager()
    const s = new TestScheduler()
    const next = vote(JSON.stringify(startState), cm, s, 'main', '9', '1')
    expect(next.game.Phase).toBe('Night')
  })
})
