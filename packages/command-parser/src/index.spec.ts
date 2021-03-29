import dayjs from 'dayjs'
import { RootState, Scheduler, ChannelManager, Message, ChannelsState, MessageTarget, ChannelState, Position } from 'werewolf'
import { parse, ParserContext, translate } from './index'
import * as Immutable from 'immutable'
import { Report } from 'werewolf/dest/player'

class TestScheduler implements Scheduler {
  SetSchedule(date: dayjs.Dayjs) {

  }
}

class TestChannelManager implements ChannelManager {
  channels = new Map<string, string[]>([['main', []]])

  Join(userIds: string[]) {
    const channelId = userIds.join(',')
    this.channels.set(channelId, [])
    return Promise.resolve(channelId)
  }

  Send(id: string, message: Message) {
    this.channels.get(id)?.push(translate(message))
  }
}

class TestParserContext implements ParserContext {
  resolveUserId(userName: string): string | undefined {
    return this.users.get(userName)
  }

  reply(text: string): void {
    this.replys.push(text)
  }

  loadState(): RootState | undefined {
    return this.state
  }

  saveState(state: RootState): void {
    this.state = state
  }

  removeState(): void {
    throw new Error('Method not implemented.')
  }

  scheduler = new TestScheduler()
  channelManager = new TestChannelManager()
  messageUserId: string
  messageUserName: string
  messageRoom: string

  users = new Map<string, string>([
    ['user1', '1'],
    ['user2', '2'],
    ['user3', '3'],
    ['user4', '4'],
    ['user5', '5'],
    ['user6', '6'],
    ['user7', '7'],
    ['user8', '8'],
    ['user9', '9']
  ])

  replys: string[] = []
  state?: RootState;

  constructor(userId: string, userName: string, room: string, state?: RootState) {
    this.messageUserId = userId
    this.messageUserName = userName
    this.messageRoom = room
    this.state = state
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
      IsVotingTarget: false,
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
      IsVotingTarget: false,
      VoteTo: null,
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
      IsVotingTarget: false,
      VoteTo: null,
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
      IsVotingTarget: false,
      VoteTo: null,
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
      IsVotingTarget: false,
      VoteTo: null,
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
      IsVotingTarget: false,
      VoteTo: null,
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
      IsVotingTarget: false,
      VoteTo: null,
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
      IsVotingTarget: false,
      VoteTo: null,
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
      IsVotingTarget: false,
      VoteTo: null,
      Reports: [],
      Camp: 'Citizen Side',
      Position: 'Citizen'
    }
  ],
  game: {
    Phase: 'Daytime',
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
    [['All'], {
      Id: 'main',
      Target: 'All',
      Users: [
        '1'
      ]
    }],
    [['Werewolf'], {
      Id: '9,8',
      Target: 'Werewolf',
      Users: [
        '9',
        '8'
      ]
    }],
    [['Sherer'], {
      Id: '3,2',
      Target: 'Sherer',
      Users: [
        '3',
        '2'
      ]
    }
    ]])
}

describe('parse', () => {
  it('test', async () => {
    const context = new TestParserContext('1', 'user1', 'main')
    await parse('@werewolf help', context)
    expect(context.replys[0]).toBeTruthy()
  })

  it('NewGame', async () => {
    const context = new TestParserContext('1', 'user1', 'main')
    await parse('@werewolf NewGame @user1 @user2 @user3 @user4 @user5 @user6 @user7 @user8 @user9 -o 1 -t 1 -k 1 -c 1 -s 2', context, users => users, 'test_game')
    expect(context.replys[0]).toBeTruthy()
    expect(JSON.parse(JSON.stringify(context.state))).toStrictEqual(JSON.parse(JSON.stringify(startState)))
  })

  it('co', async () => {
    const context = new TestParserContext('1', 'user1', 'main', startState)
    await parse('@werewolf co 占い師', context)
    expect(context.state?.players.find(p => p.UserId === '1')?.CamingOut).toBe('FortuneTeller' as Position)
  })
  it('co with report', async () => {
    const context = new TestParserContext('1', 'user1', 'main', startState)
    await parse('@werewolf co 占い師 @user2 人狼', context)
    expect(context.state?.players.find(p => p.UserId === '1')?.CamingOut).toBe('FortuneTeller' as Position)
    expect(context.state?.players.find(p => p.UserId === '1')?.Reports[0]).toStrictEqual({ target: 'test_game-2', camp: 'Werewolf Side' } as Report)
  })
  it('report', async () => {
    const state = { ...startState }
    state.players.find(p => p.UserId === '1')!.CamingOut = 'FortuneTeller'
    const context = new TestParserContext('1', 'user1', 'main', state)
    await parse('@werewolf report @user2 人狼', context)
    expect(context.state?.players.find(p => p.UserId === '1')?.Reports).toStrictEqual([{ target: 'test_game-2', camp: 'Werewolf Side' } as Report])
  })

  it('vote', async () => {
    const state = { ...startState }
    state.game.Phase = 'Vote'
    state.players = state.players.map(p => ({ ...p, IsVotingTarget: true }))
    const context = new TestParserContext('1', 'user1', 'main', state)
    await parse('@werewolf vote @user2', context)
    expect(context.state?.players.find(p => p.UserId === '1')?.VoteTo).toStrictEqual('test_game-2')
  })

  it('bite', async () => {
    const state = { ...startState }
    state.game.Phase = 'Night'
    const context = new TestParserContext('9', 'user9', '9,8', state)
    await parse('@werewolf bite @user1', context)
    expect(context.state?.players.find(p => p.UserId === '1')?.IsBited).toBe(true)
  })
  it('escort', async () => {
    const state = { ...startState }
    state.game.Phase = 'Night'
    const context = new TestParserContext('4', 'user4', '4', state)
    await parse('@werewolf escort @user1', context)
    expect(context.state?.players.find(p => p.UserId === '1')?.IsProtected).toBe(true)
  })

  it('fortune', async () => {
    const state = { ...startState }
    state.game.Phase = 'Night'
    const context = new TestParserContext('7', 'user7', '7', state)
    await parse('@werewolf fortune @user9', context)
    expect(context.replys).toStrictEqual(['@9はWerewolf Sideです。'])
  })

})
