import { Robot } from "hubot";
import { Config, createGame, ChannelManager, RootState, Scheduler, storeGame, User, bite, fortune, escort, vote, MessageStrings, ErrorMessage, Camp, Position, Message } from "werewolf";
import yargs from "yargs";
import { Job, scheduleJob } from "node-schedule";
import pino from "pino";
import { WebClient } from "@slack/web-api";
import i18next from "i18next";
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

const stateKey = 'state'
const logger = pino()
i18next.init({
    lng: 'ja',
    resources: {
        ja: {
            translation: {
                "Citizen side win!": "市民が勝利しました。",
                "Couldn't find the player.": 'あなたはゲームに参加していません。',
                "Couldn't find the target.": '指定されたユーザーはゲームに参加していません。',
                "Final Vote. subject are {{ users.Name }}": '決選投票を行います。対象は{{userIds}}です。',
                "It's morning. (Day {{day}})": "朝を迎えました。({day}日目)",
                "It's night, so I can't run it.": "夜フェーズのため実行できません。",
                "It's night.": "夜になりました。",
                "It's not night, so I can't run it.": "夜フェーズではないため実行できません。",
                "It's not vote time, so I can't run it.": "投票フェーズではないため実行できません。",
                "It's vote time.": "投票の時がやってきました。",
                "The morning was uneventful.": "誰も殺されることなく、爽やかな朝となりました。",
                "The next phase is {{date}}": "次のフェーズは{{date}}に始まります。",
                "Werewolf side win!": "人狼が勝利しました。",
                "Worng channel.": "このチャンネルでは実行出来ません。",
                "You are {{position}}": "あなたは”{{position}}”です。",
                "{{user.Name}} is executed.": "{{user.Id}}は処刑されました。",
                "{{user.Name}} that was executed was a citizen.": "処刑された{{user.Id}}は市民でした。",
                "{{user.Name}} that was executed was a werewolf.": "処刑された{{user.Id}}は人狼でした。",
                "{{user.Name}} was found dead in a heap.": "{{user.Id}}は無残な死体となって発見されました。",
                "The werewolf game start": "人狼ゲームを開始します。",
                "Citizen Side": "市民",
                "Werewolf Side": "人狼",
                "Citizen": "市民",
                FortuneTeller: "占い師",
                Knight: "騎士",
                Psychic: "霊媒師",
                Psycho: "狂人",
                Sharer: "共有者",
                Werewolf: "人狼"
            } as {
                    [K in MessageStrings | ErrorMessage | Camp | Position]: string;
                }
        }
    }
})


function translate(message: Message) {
    if (message.message === "You are {{position}}") {
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

const paser = yargs
    .scriptName("werewolf")
    .help()
    .showHelpOnFail(true)
    .command('NewGame <users>', 'New game', args =>
        args
            .positional('users', {
                type: 'string',
                demandOption: true
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
            .option('finalVote', { alias: 'f', string: true, description: 'final vote time length', default: 'PT10M' })

    )
    .command('waive', 'ゲームを放棄')

module.exports = (robot: Robot, channelManagerParam?: ChannelManager, shedulerParam?: Scheduler, shuffleFunc?: (users:User[])=>User[]) => {

    const channelManager = channelManagerParam || {
        Send: (target, message) => {
            robot.messageRoom(target, translate(message))
        },
        Join: async (userIds) => {
            if (userIds.length === 1) {
                return userIds[0]
            } else {
                const slack = (robot.adapter as any).client.web as WebClient
                const channel = await slack.conversations.open({
                    users: userIds.join(',')
                })
                return (channel.channel as any).id
            }
        }
    }

    const fireSchedule = () => {
        const state = robot.brain.get('state')
        const game = storeGame(state, channelManager!, sheduler!)
        game.TimeOut()
    }
    let schedule: Job;
    const sheduler = shedulerParam || {
        SetSchedule: (date) => {
            if (schedule) {
                schedule.cancel();
            }
            schedule = scheduleJob('job', date.toDate(), (fire) => {
                fireSchedule()
            })
        }
    }






    function thread(res: Hubot.Response, message: string) {
        //     if (res.message.thread_ts)
        //     res.send "すでにスレッドで会話しているときは、スレッドに返すよ"
        //   else
        //     res.message.thread_ts = res.message.rawMessage.ts
        //     res.send "スレッドではないときは、スレッドに返事をするよ"
    }



    robot.respond(/debug/, res => {
        res.reply(JSON.stringify(robot.brain.get('state'), null, 2))
    })

    robot.respond(/[wW]aive/, res => {
        robot.brain.remove(stateKey)
        res.reply('ゲームを放棄しました。')
        logger.info('%sによってゲームを放棄しました。', res.message.user.get('real_name'))
    })

    robot.respond(/NewGame(.*)/i, async (res) => {
        if (!res.message.text) {
            return
        }
        const state: RootState | undefined = robot.brain.get('state')
        if (state?.game.Phase !== undefined && state.game.Phase !== 'GameOver') {
            res.reply('ゲームが進行中です。')
            return
        }



        const argv = paser.parse(res.message.text?.split(/\s/).slice(1), (err: Error | undefined, argv: any, output: string) => {
            if (output) {
                res.send(output)
            }
        })
        if (argv.users === undefined) {
            res.send('参加者を指定してください')
            return
        }
        const userNames = argv.users.split(',')
        const total = argv.werewolf + argv.psycho + argv.fortuneTeller + argv.knight + argv.psychic + argv.sharer
        if (userNames.length < total) {
            res.send('参加者と役職の数が一致しません')
            return
        }
        if (argv.sharer % 2 !== 0) {
            res.send('共有者は2で割り切れる人数でなければなりません')
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
        const userMatchs = userNames.map(name => {
            if (name.startsWith('@')) {
                return {
                    name: name,
                    user: robot.brain.userForName(name.replace('@', ''))
                }
            } else if (name === 'me') {
                return {
                    name: name,
                    user: res.message.user
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
            res.reply(`${invalidUserName.join(', ')}は認識できませんでした。`)
            return
        }
        res.reply("ゲームの作成を開始しました。")
        const users = userMatchs.map(match => new User(match.user!.id, match.user!.name))
        const game = createGame(users, config, channelManager, sheduler, res.message.room, shuffleFunc)
        await game.startGame()
        robot.brain.set('state', game.getState())
    })

    robot.respond(/CO\s(\w+)(\s+(\w+)\s+(\w+))?/, res => {
        console.log(res.match)
        const state = robot.brain.get('state')
        const game = storeGame(state, channelManager, sheduler)
        const player = game.getPlayerByUserId(res.message.user.id)
        robot.brain.set('state', game.getState())
    })

    robot.respond(/[rR]eport\s(\w+)\s+(\w+)/, res => {
        console.log(res.match)
        const state = robot.brain.get('state')
        const game = storeGame(state, channelManager, sheduler)
        const player = game.getPlayerByUserId(res.message.user.id)
        robot.brain.set('state', game.getState())
    })

    robot.respond(/[bB]ite\s(\w+)/, res => {
        try {
            const userName = res.match[1].replace('@', '')
            const userId = robot.brain.userForName(userName)
            if (userId === null) {
                res.reply(`${userName}は見つかりませんでした`)
                return
            }
            const state = robot.brain.get('state')
            const next = bite(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id)
            robot.brain.set('state', next)
        } catch (e) {
            res.reply(translate(e))
        }
    })

    robot.respond(/[fF]ortune\s(\w+)/, res => {
        try {
            const userName = res.match[1].replace('@', '')
            const userId = robot.brain.userForName(userName)
            if (userId === null) {
                res.reply(`${userName}は見つかりませんでした`)
                return
            }
            const state = robot.brain.get('state')
            const result = fortune(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id)
            res.reply(`@${userId}は${result}です。`)
        } catch (e) {
            res.reply(translate(e))
        }
    })

    robot.respond(/[eE]scort\s(\w+)/, res => {
        try {
            const userName = res.match[1].replace('@', '')
            const userId = robot.brain.userForName(userName)
            if (userId === null) {
                res.reply(`${userName}は見つかりませんでした`)
                return
            }
            const state = robot.brain.get('state')
            const next = escort(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id)
            robot.brain.set('state', next)
        } catch (e) {
            res.reply(translate(e))
        }
    })

    robot.respond(/[vV]ote\s(.+)/, res => {
        try {
            const userName = res.match[1].replace('@', '')
            const userId = robot.brain.userForName(userName)
            if (userId === null) {
                res.reply(`${userName}は見つかりませんでした`)
                return
            }
            const state = robot.brain.get('state')
            const next = vote(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id)
            robot.brain.set('state', next)
        } catch (e) {
            res.reply(translate(e))
        }
    })
}
