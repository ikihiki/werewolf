import { Robot } from "hubot";
import { Config, createGame, ChannelManager, MessageTarget, Scheduler, storeGame, User } from "werewolf";
import yargs from "yargs";
import { scheduleJob } from "node-schedule";
import { RootState } from "werewolf/dest/game";

module.exports = (robot: Robot) => {
    const messageTransmitter: ChannelManager = {
        Send: (target, message) => {
            robot.messageRoom(target, JSON.stringify(message))
        },
        Join:(userIds)=>{
            robot.adapter.
            return 'a'
        }
    }
    const fireSchedule = () => {
        const state = robot.brain.get('state')
        const game = storeGame(state, messageTransmitter, sheduler)
        game.TimeOut()
    }
    const sheduler: Scheduler = {
        SetSchedule: (date) => {
            scheduleJob('job', date.toDate(), (fire) => {
                fireSchedule()
            })
        }
    }


    robot.hear(/debug/, res=>{
        res.reply(robot.brain.get('state'))
    })

    robot.hear(/NewGame(.*)/i, (res) => {
        if (!res.message.text) {
            return
        }
        const state:RootState | undefined = robot.brain.get('state')
        if(state?.game.Phase !==undefined && state.game.Phase !== 'GameOver'){
            res.reply('ゲームが進行中です。')
            return
        }
        const paser = yargs
            .command('NewGame <users>', 'New game', args =>
                args
                    .positional('users', {
                        type: 'string',
                        demandOption: true
                    })
                    .option('werewolf', { alias: 'w', number: true, description: 'number of werewolf', default: 2 })
                    .option('psycho', { alias: 'o', number: true, description: 'number of psycho', default: 0 })
                    .option('fortuneTeller', { alias: 'f', number: true, description: 'number of fortune teller', default: 1 })
                    .option('knight', { alias: 'k', number: true, description: 'number of knight', default: 0 })
                    .option('psychic', { alias: 'c', number: true, description: 'number of psychic', default: 1 })
                    .option('sharer', { alias: 'w', number: true, description: 'number of sharer', default: 0 })
                    .option('day', { alias: 'd', string: true, description: 'day length', default: 'PT6H' })
                    .option('night', { alias: 'n', string: true, description: 'night length', default: 'PT6H' })
                    .option('vote', { alias: 'v', string: true, description: 'vote time length', default: 'PT1H' })
                    .option('finalVote', { alias: 'f', string: true, description: 'final vote time length', default: 'PT10M' })

            )
            .help()
            .showHelp(s => res.send(s))
            .showHelpOnFail(true)

        const argv = paser.parse(res.message.text?.split(/\s/), (err: Error | undefined, argv: any, output: string) => {
            console.log(err);
            console.log(argv)
            if (output) {
                res.send(output)
            }
        })
        console.log(argv)
        if (argv.users === undefined) {
            res.send('参加者を指定してください')
            return
        }
        const userIds = argv.users.split(',')
        const total = argv.werewolf + argv.psycho + argv.fortuneTeller + argv.knight + argv.psychic + argv.sharer
        if (userIds.length !== total) {
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

        const users = userIds.map(user => ({ Id: user, Name: user } as User))
        const game = createGame(users, config, messageTransmitter, sheduler, res.message.room)
        robot.brain.set('state', game.getState())
    })

    robot.hear(/CO\s(\w+)(\s+(\w+)\s+(\w+))?/, res => {
        console.log(res.match)
        const state = robot.brain.get('state')
        const game = storeGame(state, messageTransmitter, sheduler)
        const player = game.getPlayerByUserId(res.message.user.id)
        player?.CamingOut()
        robot.brain.set('state', game.getState())
    })
}