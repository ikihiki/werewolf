import dayjs from 'dayjs'
import { Scheduler, ChannelManager, Message, MessageTarget, ChannelState, Position, timeout, StateManager, GameContext } from 'werewolf'
import { parse, ParserContext, translate } from './index'
import * as Immutable from 'immutable'
import { Report } from 'werewolf/dest/player'
import { RootState } from 'werewolf/dest/game'
import pino from 'pino'
import MockDate from 'mockdate'

class TestStateManager implements StateManager {
  state?: string;
  actions: any[]= [];
  constructor (state?: string) {
    this.state = state
  }

  loadState (): string | undefined {
    return this.state
  }

  saveState (state: string): void {
    this.state = state
  }

  pushAction (actions: any[]): void {
    this.actions = this.actions.concat(actions)
  }
}

class TestScheduler implements Scheduler {
  schedules: (dayjs.Dayjs | undefined)[] = [];
  SetSchedule (date: dayjs.Dayjs | undefined) {
    this.schedules.push(date)
  }
}

class TestChannelManager implements ChannelManager {
  channels = new Map<string, string[]>([['main', []]])
  invalid: [string, Message][] = []
  Join (userIds: string[]) {
    const channelId = userIds.join(',')
    this.channels.set(channelId, [])
    return Promise.resolve(channelId)
  }

  Send (id: string, message: Message) {
    const channel = this.channels.get(id)
    if (channel === undefined) {
      this.invalid.push([id, message])
    } else {
      channel.push(translate(message))
    }
  }
}

class TestParserContext implements ParserContext, GameContext {
  resolveUserId (userName: string): string | undefined {
    return this.users.get(userName)
  }

  reply (text: string): void {
    this.channelManager.channels.get(this.messageRoom)?.push(text)
  }

  removeState (): void {
    throw new Error('Method not implemented.')
  }

  shuffleFunc = (users) => users

  stateManager: TestStateManager
  scheduler = new TestScheduler()
  channelManager = new TestChannelManager()
  logger = pino({ write: (msg) => console.log(msg), level: 'silent' })
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

  getState (): RootState {
    const state = this.stateManager.loadState()
    if (state === undefined) {
      throw new Error('state is undefined')
    }
    return JSON.parse(state) as RootState
  }

  constructor (userId: string, userName: string, room: string, state?: string) {
    this.messageUserId = userId
    this.messageUserName = userName
    this.messageRoom = room
    this.stateManager = new TestStateManager(state)
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
    NextPhase: dayjs('2021-03-31T21:00:00.000Z'),
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
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9'
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

describe('parse', () => {
  it('test', async () => {
    const context = new TestParserContext('1', 'user1', 'main')
    await parse('@werewolf help', context)
    expect(context.channelManager.channels.get('main')).toBeTruthy()
  })

  it('NewGame', async () => {
    const context = new TestParserContext('1', 'user1', 'main')
    MockDate.set('2021-04-01 00:00:00')
    await parse('@werewolf NewGame @user1 @user2 @user3 @user4 @user5 @user6 @user7 @user8 @user9 -o 1 -t 1 -k 1 -c 1 -s 2', context, 'test_game')
    MockDate.reset()

    expect(context.channelManager.channels.get('main')).toStrictEqual([
      'ゲームの作成を開始しました。',
      '人狼ゲームを開始します。',
      '次のフェーズは2021年4月1日 06:00:00に始まります。'
    ])
    expect(context.getState()).toStrictEqual(JSON.parse(JSON.stringify(startState)))
  })

  it('co', async () => {
    const context = new TestParserContext('1', 'user1', 'main', JSON.stringify(startState))
    await parse('@werewolf co 占い師', context)
    expect(context.getState().players.find(p => p.UserId === '1')?.CamingOut).toBe('FortuneTeller' as Position)
  })
  it('co with report', async () => {
    const context = new TestParserContext('1', 'user1', 'main', JSON.stringify(startState))
    await parse('@werewolf co 占い師 @user2 人狼', context)
    expect(context.getState().players.find(p => p.UserId === '1')?.CamingOut).toBe('FortuneTeller' as Position)
    expect(context.getState().players.find(p => p.UserId === '1')?.Reports[0]).toStrictEqual({ target: 'test_game-2', camp: 'Werewolf Side' } as Report)
  })
  it('report', async () => {
    const state = { ...startState }
    state.players.find(p => p.UserId === '1')!.CamingOut = 'FortuneTeller'
    const context = new TestParserContext('1', 'user1', 'main', JSON.stringify(startState))
    await parse('@werewolf report @user2 人狼', context)
    expect(context.getState()).toBeTruthy()
    expect(context.getState().players.find(p => p.UserId === '1')?.Reports).toStrictEqual([{ target: 'test_game-2', camp: 'Werewolf Side' } as Report])
  })

  it('vote', async () => {
    const state = { ...startState }
    state.game.Phase = 'Vote'
    state.players = state.players.map(p => ({ ...p, IsVotingTarget: true }))
    const context = new TestParserContext('1', 'user1', 'main', JSON.stringify(state))
    await parse('@werewolf vote @user2', context)
    expect(context.getState()).toBeTruthy()
    expect(context.getState().players.find(p => p.UserId === '1')?.VoteTo).toStrictEqual('test_game-2')
  })

  it('bite', async () => {
    const state = { ...startState }
    state.game.Phase = 'Night'
    const context = new TestParserContext('9', 'user9', '9,8', JSON.stringify(startState))
    await parse('@werewolf bite @user1', context)
    expect(context.getState()).toBeTruthy()
    expect(context.getState().players.find(p => p.UserId === '1')?.IsBited).toBe(true)
  })
  it('escort', async () => {
    const state = { ...startState }
    state.game.Phase = 'Night'
    const context = new TestParserContext('4', 'user4', '4', JSON.stringify(startState))
    await parse('@werewolf escort @user1', context)
    expect(context.getState()).toBeTruthy()
    expect(context.getState().players.find(p => p.UserId === '1')?.IsProtected).toBe(true)
  })

  it('fortune', async () => {
    const state = { ...startState }
    state.game.Phase = 'Night'
    const context = new TestParserContext('7', 'user7', '7', JSON.stringify(startState))
    context.channelManager.Join(['7'])
    await parse('@werewolf fortune @user9', context)
    expect(context.getState()).toBeTruthy()
    expect(context.channelManager.channels.get('7')).toStrictEqual(['@9はWerewolf Sideです。'])
  })

  const endState = {
    players: [
      {
        Id: 'test_game-1',
        UserId: '1',
        IsBited: false,
        IsSurvival: true,
        CamingOut: null,
        IsProtected: false,
        IsVotingTarget: false,
        VoteTo: null,
        Reports: [{
          camp: 'Citizen Side',
          target: 'test_game-7'
        },
        {
          camp: 'Citizen Side',
          target: 'test_game-2'
        }],
        Camp: 'Werewolf Side',
        Position: 'Werewolf'
      },
      { Id: 'test_game-2', UserId: '2', IsBited: false, IsSurvival: true, CamingOut: null, IsProtected: false, IsVotingTarget: false, VoteTo: null, Reports: [], Camp: 'Werewolf Side', Position: 'Werewolf' },
      {
        Id: 'test_game-3',
        UserId: '3',
        IsBited: false,
        IsSurvival: false,
        CamingOut: null,
        IsProtected: false,
        IsVotingTarget: false,
        VoteTo: null,
        Reports: [{
          camp: 'Citizen Side',
          target: 'test_game-6'
        },
        {
          camp: 'Citizen Side',
          target: 'test_game-5'
        }],
        Camp: 'Citizen Side',
        Position: 'FortuneTeller'
      },
      { Id: 'test_game-4', UserId: '4', IsBited: false, IsSurvival: false, CamingOut: null, IsProtected: false, IsVotingTarget: false, VoteTo: null, Reports: [], Camp: 'Werewolf Side', Position: 'Psycho' },
      {
        Id: 'test_game-5',
        UserId: '5',
        IsBited: false,
        IsSurvival: true,
        CamingOut: null,
        IsProtected: false,
        IsVotingTarget: false,
        VoteTo: null,
        Reports: [{
          camp: 'Citizen Side',
          target: 'test_game-8'
        },
        {
          camp: 'Citizen Side',
          target: 'test_game-4'
        }],
        Camp: 'Citizen Side',
        Position: 'Psychic'
      },
      { Id: 'test_game-6', UserId: '6', IsBited: false, IsSurvival: true, CamingOut: null, IsProtected: false, IsVotingTarget: false, VoteTo: null, Reports: [], Camp: 'Citizen Side', Position: 'Knight' },
      { Id: 'test_game-7', UserId: '7', IsBited: false, IsSurvival: false, CamingOut: null, IsProtected: false, IsVotingTarget: false, VoteTo: null, Reports: [], Camp: 'Citizen Side', Position: 'Sharer' },
      { Id: 'test_game-8', UserId: '8', IsBited: false, IsSurvival: false, CamingOut: null, IsProtected: false, IsVotingTarget: false, VoteTo: null, Reports: [], Camp: 'Citizen Side', Position: 'Sharer' },
      { Id: 'test_game-9', UserId: '9', IsBited: false, IsSurvival: false, CamingOut: null, IsProtected: false, IsVotingTarget: false, VoteTo: null, Reports: [], Camp: 'Citizen Side', Position: 'Citizen' }
    ],
    game: {
      Phase: 'GameOver',
      Days: 3,
      Id: 'test_game',
      Config: { numberOfWerewolf: 2, numberOfPsycho: 1, numberOfFortuneTeller: 1, numberOfKnight: 1, numberOfPsychic: 1, numberOfSharer: 2, dayLength: '18:30', nightLength: '09:00', voteLength: 'PT1H', finalVoteLength: 'PT10M' }
    },
    users: [
      { Id: '1', Name: '@user1' },
      { Id: '2', Name: '@user2' },
      { Id: '3', Name: '@user3' },
      { Id: '4', Name: '@user4' },
      { Id: '5', Name: '@user5' },
      { Id: '6', Name: '@user6' },
      { Id: '7', Name: '@user7' },
      { Id: '8', Name: '@user8' },
      { Id: '9', Name: '@user9' }
    ],
    channels: {
      3: { Id: '3', Target: ['3'], Users: ['3'] },
      4: { Id: '4', Target: ['4'], Users: ['4'] },
      5: { Id: '5', Target: ['5'], Users: ['5'] },
      6: { Id: '6', Target: ['6'], Users: ['6'] },
      9: { Id: '9', Target: ['9'], Users: ['9'] },
      All: { Id: 'main', Target: 'All', Users: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
      Werewolf: { Id: '1,2', Target: 'Werewolf', Users: ['1', '2'] },
      Sharer: { Id: '7,8', Target: 'Sharer', Users: ['7', '8'] }
    }
  }

  const endChannels = [
    [
      'main',
      [
        'ゲームの作成を開始しました。',
        '人狼ゲームを開始します。',
        '次のフェーズは2021年4月1日 18:30:00に始まります。',
        '投票の時がやってきました。',
        '次のフェーズは2021年4月1日 19:30:00に始まります。',
        '8は処刑されました。',
        '次のフェーズは2021年4月2日 09:00:00に始まります。',
        '朝を迎えました。({day}日目)',
        '9は無残な死体となって発見されました。',
        '次のフェーズは2021年4月2日 18:30:00に始まります。',
        '投票の時がやってきました。',
        '次のフェーズは2021年4月2日 19:30:00に始まります。',
        '4は処刑されました。',
        '次のフェーズは2021年4月3日 09:00:00に始まります。',
        '朝を迎えました。({day}日目)',
        '誰も殺されることなく、爽やかな朝となりました。',
        '次のフェーズは2021年4月3日 18:30:00に始まります。',
        '投票の時がやってきました。',
        '次のフェーズは2021年4月3日 19:30:00に始まります。',
        '7は処刑されました。',
        '次のフェーズは2021年4月4日 09:00:00に始まります。',
        '人狼が勝利しました。'
      ]
    ],
    [
      '1,2',
      [
        'あなたは”人狼”です。'
      ]
    ],
    [
      '7,8',
      [
        'あなたは”共有者”です。'
      ]
    ],
    [
      '3',
      [
        'あなたは”占い師”です。',
        '@6はCitizen Sideです。',
        '@5はCitizen Sideです。',
        '@1はWerewolf Sideです。'
      ]
    ],
    [
      '4',
      [
        'あなたは”狂人”です。'
      ]
    ],
    [
      '5',
      [
        'あなたは”霊媒師”です。',
        '処刑された8は市民でした。',
        '処刑された4は市民でした。',
        '処刑された7は市民でした。'
      ]
    ],
    [
      '6',
      [
        'あなたは”騎士”です。'
      ]
    ],
    [
      '9',
      [
        'あなたは”市民”です。'
      ]
    ]
  ]

  const endSchedules = [
    '2021-04-01T09:30:00.000Z',
    '2021-04-01T10:30:00.000Z',
    '2021-04-02T00:00:00.000Z',
    '2021-04-02T09:30:00.000Z',
    '2021-04-02T10:30:00.000Z',
    '2021-04-03T00:00:00.000Z',
    '2021-04-03T09:30:00.000Z',
    '2021-04-03T10:30:00.000Z',
    '2021-04-04T00:00:00.000Z',
    null
  ]

  it('senario', async () => {
    const context = new TestParserContext('1', 'user1', 'main')
    context.shuffleFunc = users => users.reverse()
    const runParse = async (userName: string, room: string, text: string) => {
      const id = context.users.get(userName)
      if (id === undefined) {
        throw new Error('not found user')
      }
      context.messageRoom = room
      context.messageUserId = id
      context.messageUserName = userName
      await parse(text, context)
    }
    MockDate.set('2021-04-01 09:30:00')
    await parse('@werewolf NewGame @user1 @user2 @user3 @user4 @user5 @user6 @user7 @user8 @user9 -o 1 -t 1 -k 1 -c 1 -s 2 -d 18:30 -n 09:00 -v PT1H -f PT10M ', context, 'test_game')

    await runParse('user1', 'main', '@werewolf co taller @user7 citizen')
    await runParse('user3', 'main', '@werewolf co 占い @user9 白')

    MockDate.set('2021-04-01 18:30:00')
    timeout(context)

    await runParse('user1', 'main', '@werewolf vote @user8')
    await runParse('user2', 'main', '@werewolf vote @user8')
    await runParse('user3', 'main', '@werewolf vote @user8')
    await runParse('user4', 'main', '@werewolf vote @user8')
    await runParse('user5', 'main', '@werewolf vote @user8')
    await runParse('user6', 'main', '@werewolf vote @user8')
    await runParse('user7', 'main', '@werewolf vote @user4')
    await runParse('user8', 'main', '@werewolf vote @user4')
    await runParse('user9', 'main', '@werewolf vote @user8')

    await runParse('user1', '1,2', '@werewolf bite @user8')
    await runParse('user1', '1,2', '@werewolf bite @user7')
    await runParse('user2', '1,2', '@werewolf bite @user9')

    await runParse('user3', '3', '@werewolf fortune @user6')
    await runParse('user6', '6', '@werewolf escort @user3')

    MockDate.set('2021-04-02 09:00:00')
    timeout(context)

    await runParse('user5', 'main', '@werewolf co psychic')
    await runParse('user5', 'main', '@werewolf report @user8 citizen')
    await runParse('user1', 'main', '@werewolf report @user7 citizen')
    await runParse('user3', 'main', '@werewolf report @user6 citizen')

    MockDate.set('2021-04-02 18:30:00')
    timeout(context)

    await runParse('user1', 'main', '@werewolf vote @user4')
    await runParse('user2', 'main', '@werewolf vote @user4')
    await runParse('user3', 'main', '@werewolf vote @user4')
    await runParse('user4', 'main', '@werewolf vote @user1')
    await runParse('user5', 'main', '@werewolf vote @user4')
    await runParse('user6', 'main', '@werewolf vote @user4')
    await runParse('user7', 'main', '@werewolf vote @user4')

    await runParse('user1', '1,2', '@werewolf bite @user5')

    await runParse('user3', '3', '@werewolf fortune @user5')
    await runParse('user6', '6', '@werewolf escort @user5')

    MockDate.set('2021-04-03 09:00:00')
    timeout(context)

    await runParse('user5', 'main', '@werewolf report @user4 citizen')
    await runParse('user1', 'main', '@werewolf report @user2 citizen')
    await runParse('user3', 'main', '@werewolf report @user5 citizen')

    MockDate.set('2021-04-03 18:30:00')
    timeout(context)

    await runParse('user1', 'main', '@werewolf vote @user7')
    await runParse('user2', 'main', '@werewolf vote @user6')
    await runParse('user3', 'main', '@werewolf vote @user1')
    await runParse('user5', 'main', '@werewolf vote @user2')

    MockDate.set('2021-04-03 19:30:00')
    timeout(context)

    await runParse('user1', 'main', '@werewolf vote @user5')
    await runParse('user1', 'main', '@werewolf vote @user7')
    await runParse('user2', 'main', '@werewolf vote @user7')
    await runParse('user3', 'main', '@werewolf vote @user7')
    await runParse('user5', 'main', '@werewolf vote @user1')
    await runParse('user6', 'main', '@werewolf vote @user1')

    MockDate.set('2021-04-03 19:40:00')
    timeout(context)

    await runParse('user1', '1,2', '@werewolf bite @user3')

    await runParse('user3', '3', '@werewolf fortune @user1')
    await runParse('user6', '6', '@werewolf escort @user5')

    MockDate.set('2021-04-04 09:00:00')
    timeout(context)

    expect(context.getState()).toStrictEqual(endState)
    expect(context.channelManager.invalid).toStrictEqual([])
    expect(Array.from(context.channelManager.channels.entries())).toStrictEqual(endChannels)
    expect(JSON.parse(JSON.stringify(context.scheduler.schedules))).toStrictEqual(endSchedules)
  })
})
