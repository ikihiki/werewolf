"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var werewolf_1 = require("werewolf");
var yargs_1 = __importDefault(require("yargs"));
var node_schedule_1 = require("node-schedule");
module.exports = function (robot) {
    var messageTransmitter = {
        Send: function (target, message) {
            robot.messageRoom(target, JSON.stringify(message));
        },
        Join: function (userIds) {
            //robot.adapter.
            return 'a';
        }
    };
    var fireSchedule = function () {
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, messageTransmitter, sheduler);
        game.TimeOut();
    };
    var sheduler = {
        SetSchedule: function (date) {
            node_schedule_1.scheduleJob('job', date.toDate(), function (fire) {
                fireSchedule();
            });
        }
    };
    robot.hear(/debug/, function (res) {
        res.reply(robot.brain.get('state'));
    });
    robot.hear(/NewGame(.*)/i, function (res) {
        var _a;
        if (!res.message.text) {
            return;
        }
        var state = robot.brain.get('state');
        if ((state === null || state === void 0 ? void 0 : state.game.Phase) !== undefined && state.game.Phase !== 'GameOver') {
            res.reply('ゲームが進行中です。');
            return;
        }
        var paser = yargs_1.default
            .command('NewGame <users>', 'New game', function (args) {
            return args
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
                .option('finalVote', { alias: 'f', string: true, description: 'final vote time length', default: 'PT10M' });
        })
            .help()
            .showHelp(function (s) { return res.send(s); })
            .showHelpOnFail(true);
        var argv = paser.parse((_a = res.message.text) === null || _a === void 0 ? void 0 : _a.split(/\s/), function (err, argv, output) {
            console.log(err);
            console.log(argv);
            if (output) {
                res.send(output);
            }
        });
        console.log(argv);
        if (argv.users === undefined) {
            res.send('参加者を指定してください');
            return;
        }
        var userIds = argv.users.split(',');
        var total = argv.werewolf + argv.psycho + argv.fortuneTeller + argv.knight + argv.psychic + argv.sharer;
        if (userIds.length !== total) {
            res.send('参加者と役職の数が一致しません');
            return;
        }
        if (argv.sharer % 2 !== 0) {
            res.send('共有者は2で割り切れる人数でなければなりません');
            return;
        }
        var config = {
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
        };
        var users = userIds.map(function (user) { return ({ Id: user, Name: user }); });
        var game = werewolf_1.createGame(users, config, messageTransmitter, sheduler, res.message.room);
        robot.brain.set('state', game.getState());
    });
    robot.hear(/CO\s(\w+)(\s+(\w+)\s+(\w+))?/, function (res) {
        console.log(res.match);
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, messageTransmitter, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
    robot.hear(/[rR]eport\s(\w+)\s+(\w+)/, function (res) {
        console.log(res.match);
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, messageTransmitter, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
    robot.hear(/[bB]ite\s(\w+)/, function (res) {
        console.log(res.match);
        console.log(JSON.stringify({ mes: res.message, mat: res.match, env: res.envelope }, null, 2));
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, messageTransmitter, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
    robot.hear(/[fF]ortune\s(\w+)/, function (res) {
        console.log(res.match);
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, messageTransmitter, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
    robot.hear(/[eE]scort\s(\w+)/, function (res) {
        console.log(res.match);
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, messageTransmitter, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
    robot.hear(/[vV]ote\s(\w+)/, function (res) {
        console.log(res.match);
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, messageTransmitter, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
};
