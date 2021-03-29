import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { bite, Camp, ChannelId, ChannelManager, comingOut, Config, createGame, ErrorMessage, escort, fortune, GameId, Message, MessageStrings, Position, report, RootState, Scheduler, ShuffleFunc, User, UserId, vote } from 'werewolf'
import i18next from 'i18next'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

i18next.init({
  lng: 'ja',
  resources: {
    ja: {
      translation: {
        'Citizen side win!': '市民が勝利しました。',
        "Couldn't find the player.": 'あなたはゲームに参加していません。',
        "Couldn't find the target.": '指定されたユーザーはゲームに参加していません。',
        'Final Vote. subject are {{ users.Name }}': '決選投票を行います。対象は{{userIds}}です。',
        "It's morning. (Day {{day}})": '朝を迎えました。({day}日目)',
        "It's night, so I can't run it.": '夜フェーズのため実行できません。',
        "It's night.": '夜になりました。',
        "It's not night, so I can't run it.": '夜フェーズではないため実行できません。',
        "It's not vote time, so I can't run it.": '投票フェーズではないため実行できません。',
        "It's vote time.": '投票の時がやってきました。',
        'The morning was uneventful.': '誰も殺されることなく、爽やかな朝となりました。',
        'The next phase is {{date}}': '次のフェーズは{{date}}に始まります。',
        'Werewolf side win!': '人狼が勝利しました。',
        'Wrong channel.': 'このチャンネルでは実行出来ません。',
        'You are {{position}}': 'あなたは”{{position}}”です。',
        '{{user.Name}} is executed.': '{{user.Id}}は処刑されました。',
        '{{user.Name}} that was executed was a citizen.': '処刑された{{user.Id}}は市民でした。',
        '{{user.Name}} that was executed was a werewolf.': '処刑された{{user.Id}}は人狼でした。',
        '{{user.Name}} was found dead in a heap.': '{{user.Id}}は無残な死体となって発見されました。',
        'The werewolf game start': '人狼ゲームを開始します。',
        'Citizen Side': '市民',
        'Werewolf Side': '人狼',
        Citizen: '市民',
        FortuneTeller: '占い師',
        Knight: '騎士',
        Psychic: '霊媒師',
        Psycho: '狂人',
        Sharer: '共有者',
        Werewolf: '人狼'
      } as {
                  [K in MessageStrings | ErrorMessage | Camp | Position]: string;
              }
    }
  }
})

export function translate (message: Message) {
  if (message.message === 'You are {{position}}') {
    return i18next.t(message.message, { position: i18next.t(message.param.position) })
  }
  if (message.message === 'The next phase is {{date}}') {
    return i18next.t(message.message, { date: message.param.date.tz('Asia/Tokyo').format('YYYY年M月D日 HH:mm:ss') })
  }
  if (message.message === 'Final Vote. subject are {{ users.Name }}') {
    return i18next.t(message.message, { userIds: message.param.users.map(user => user.Id).join(',') })
  }
  if (message.param) {
    return i18next.t(message.message, message.param as any)
  }
  return i18next.t(message.message)
}

export interface ParserContext {
  resolveUserId(userName?: string): UserId | undefined;
  reply(text: string): void;
  loadState(): RootState | undefined;
  saveState(state: RootState): void;
  removeState():void;
  scheduler: Scheduler;
  channelManager: ChannelManager;
  messageUserId: UserId;
  messageUserName: string;
  messageRoom: ChannelId;
}
export async function parse (value: string, context: ParserContext, shuffleFunc?: ShuffleFunc, gameId?: GameId): Promise<void> {
  const parser = yargs
    .scriptName('werewolf')
    .help()
    .showHelpOnFail(true)
    .exitProcess(false)
    .command('NewGame <users...>', 'New game',
      args =>
        args
          .positional('users', {
            type: 'string',
            demandOption: true,
            array: true
          })
          .option('werewolf', { alias: 'w', number: true, description: 'number of werewolf', default: 2 })
          .option('psycho', { alias: 'o', number: true, description: 'number of psycho', default: 0 })
          .option('fortuneTeller', { alias: 't', number: true, description: 'number of fortune teller', default: 0 })
          .option('knight', { alias: 'k', number: true, description: 'number of knight', default: 0 })
          .option('psychic', { alias: 'c', number: true, description: 'number of psychic', default: 0 })
          .option('sharer', { alias: 's', number: true, description: 'number of sharer', default: 0 })
          .option('day', { alias: 'd', string: true, description: 'day length', default: 'PT6H' })
          .option('night', { alias: 'n', string: true, description: 'night length', default: 'PT6H' })
          .option('vote', { alias: 'v', string: true, description: 'vote time length', default: 'PT1H' })
          .option('finalVote', { alias: 'f', string: true, description: 'final vote time length', default: 'PT10M' }),
      async argv => {
        const state = context.loadState()
        if (state?.game.Phase !== undefined && state.game.Phase !== 'GameOver') {
          context.reply('ゲームが進行中です。')
          return
        }

        if (argv.users === undefined) {
          context.reply('参加者を指定してください')
          return
        }
        const total = argv.werewolf + argv.psycho + argv.fortuneTeller + argv.knight + argv.psychic + argv.sharer
        if (argv.users.length < total) {
          context.reply('参加者と役職の数が一致しません')
          return
        }
        if (argv.sharer % 2 !== 0) {
          context.reply('共有者は2で割り切れる人数でなければなりません')
          return
        }
        const config: Config = {
          numberOfWerewolf: argv.werewolf,
          numberOfPsycho: argv.psycho,
          numberOfFortuneTeller: argv.fortuneTeller,
          numberOfKnight: argv.knight,
          numberOfPsychic: argv.psychic,
          numberOfSharer: argv.sharer,
          dayLength: argv.day,
          nightLength: argv.night,
          voteLength: argv.vote,
          finalVoteLength: argv.finalVote
        }
        const userMatchs = argv.users.map(name => {
          if (name.startsWith('@')) {
            return {
              name: name,
              user: context.resolveUserId(name.replace('@', ''))
            }
          } else if (name === 'me') {
            return {
              name: name,
              user: context.messageUserId
            }
          } else {
            return {
              name: name,
              user: null
            }
          }
        })
        const invalidUserName = userMatchs.filter(match => match.user === null).map(match => match.name)
        if (invalidUserName.length > 0) {
          context.reply(`${invalidUserName.join(', ')}は認識できませんでした。`)
          return
        }
        context.reply('ゲームの作成を開始しました。')
        const users = userMatchs.map(match => new User(match.user!, match.name))
        const game = createGame(users, config, context.channelManager, context.scheduler, context.messageRoom, shuffleFunc, gameId)
        await game.startGame()
        context.saveState(game.getState())
      }
    )
    .command('waive', 'ゲームを放棄', () => { /* empty */ }, async () => {
      context.removeState()
      context.reply('ゲームを放棄しました。')
      // logger.info('%sによってゲームを放棄しました。', res.message.user.get('real_name'))
    })
    .command('co <position> [target] [camp]', 'カミングアウト',
      args =>
        args
          .positional('position', {
            choices: ['占い師', '霊媒師'],
            description: '宣言する自身の役職(占い師か霊媒師)'
          })
          .positional('target', {
            type: 'string',
            description: '結果を宣言する相手'
          })
          .positional('camp', {
            description: '相手の陣営',
            choices: ['人狼', '市民']
          }),
      async argv => {
        let pos:Position | undefined
        switch (argv.position) {
          case '占い師':
            pos = 'FortuneTeller'
            break
          case '霊媒師':
            pos = 'Psychic'
            break
        }
        if (pos === undefined) {
          return
        }

        const target = context.resolveUserId(argv.target?.replace('@', ''))
        let camp: Camp | undefined
        switch (argv.camp) {
          case '人狼':
            camp = 'Werewolf Side'
            break
          case '市民':
            camp = 'Citizen Side'
            break
        }
        const state = context.loadState()
        if (state === undefined) {
          context.reply('ゲームが実行されていません')
          return
        }
        try {
          const next = comingOut(state, context.channelManager, context.scheduler, context.messageRoom, context.messageUserId, pos, target, camp)
          context.saveState(next)
        } catch (e) {
          console.log(e)
        }
      })
    .command('report <target> <camp>', '報告',
      args =>
        args
          .positional('target', {
            type: 'string',
            description: '結果を宣言する相手'
          })
          .positional('camp', {
            description: '相手の陣営',
            choices: ['人狼', '市民']
          }),
      async argv => {
        const target = context.resolveUserId(argv.target?.replace('@', ''))
        let camp: Camp | undefined
        switch (argv.camp) {
          case '人狼':
            camp = 'Werewolf Side'
            break
          case '市民':
            camp = 'Citizen Side'
            break
        }
        if (target === undefined) {
          return
        }
        if (camp === undefined) {
          return
        }
        const state = context.loadState()
        if (state === undefined) {
          context.reply('ゲームが実行されていません')
          return
        }
        const next = report(state, context.channelManager, context.scheduler, context.messageRoom, context.messageUserId, target, camp)
        context.saveState(next)
      })
    .command('bite <target>', '咬む',
      args =>
        args
          .positional('target', {
            type: 'string',
            description: '咬む相手'
          }),
      async argv => {
        try {
          const userId = context.resolveUserId(argv.target?.replace('@', ''))
          if (userId === undefined) {
            context.reply(`${argv.target}は見つかりませんでした`)
            return
          }
          const state = context.loadState()
          if (state === undefined) {
            context.reply('ゲームが実行されていません')
            return
          }
          const next = bite(state, context.channelManager, context.scheduler, context.messageRoom, context.messageUserId, userId)
          context.saveState(next)
        } catch (e) {
          context.reply(translate(e))
        }
      })
    .command('fortune <target>', '占う',
      args =>
        args
          .positional('target', {
            type: 'string',
            description: '占う相手'
          }),
      async argv => {
        try {
          const userId = context.resolveUserId(argv.target?.replace('@', ''))
          if (userId === undefined) {
            context.reply(`${argv.target}は見つかりませんでした`)
            return
          }
          const state = context.loadState()
          if (state === undefined) {
            context.reply('ゲームが実行されていません')
            return
          }
          const result = fortune(state, context.channelManager, context.scheduler, context.messageRoom, context.messageUserId, userId)
          context.reply(`@${userId}は${result}です。`)
        } catch (e) {
          context.reply(translate(e))
        }
      })
    .command('escort <target>', '護衛する', args =>
      args
        .positional('target', {
          type: 'string',
          description: '護衛する相手'
        }),
    async argv => {
      try {
        const userId = context.resolveUserId(argv.target?.replace('@', ''))
        if (userId === undefined) {
          context.reply(`${argv.target}は見つかりませんでした`)
          return
        }
        const state = context.loadState()
        if (state === undefined) {
          context.reply('ゲームが実行されていません')
          return
        }
        const next = escort(state, context.channelManager, context.scheduler, context.messageRoom, context.messageUserId, userId)
        context.saveState(next)
      } catch (e) {
        context.reply(translate(e))
      }
    })
    .command('vote <target>', '投票', args =>
      args
        .positional('target', {
          type: 'string',
          description: '投票する相手'
        }),
    async argv => {
      try {
        const userId = context.resolveUserId(argv.target?.replace('@', ''))
        if (userId === undefined) {
          context.reply(`${argv.target}は見つかりませんでした`)
          return
        }
        const state = context.loadState()
        if (state === undefined) {
          context.reply('ゲームが実行されていません')
          return
        }
        const next = vote(state, context.channelManager, context.scheduler, context.messageRoom, context.messageUserId, userId)
        context.saveState(next)
      } catch (e) {
        context.reply(translate(e))
      }
    })

  const args = await new Promise<void>(
    (resolve, reject) =>
      parser
        .fail((_msg, _err, _val) => resolve())
        .onFinishCommand(res => resolve(res))
        .parse(value.split(/\s/).splice(1),
          (err: Error | undefined, _argv: any, output: string) => {
            if (output) {
              context.reply(output)
            }
            if (err) {
              context.reply(JSON.stringify(err))
            }
          }
        )
  )

  console.log(args)
}
