"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var werewolf_1 = require("werewolf");
var yargs_1 = __importDefault(require("yargs"));
var node_schedule_1 = require("node-schedule");
var pino_1 = __importDefault(require("pino"));
var i18next_1 = __importDefault(require("i18next"));
var stateKey = 'state';
var logger = pino_1.default();
i18next_1.default.init({
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
            }
        }
    }
});
function translate(message) {
    if (message.message === "You are {{position}}") {
        return i18next_1.default.t(message.message, { position: i18next_1.default.t(message.param.position) });
    }
    if (message.message === 'The next phase is {{date}}') {
        return i18next_1.default.t(message.message, { date: message.param.date.tz('Asia/Tokyo').format('YYYY年M月D日 HH:mm:ss') });
    }
    if (message.message === 'Final Vote. subject are {{ users.Name }}') {
        return i18next_1.default.t(message.message, { userIds: message.param.users.map(function (user) { return user.Id; }).join(',') });
    }
    if (message.param) {
        return i18next_1.default.t(message.message, message.param);
    }
    return i18next_1.default.t(message.message);
}
var paser = yargs_1.default
    .scriptName("werewolf")
    .help()
    .showHelpOnFail(true)
    .command('NewGame <users>', 'New game', function (args) {
    return args
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
        .option('finalVote', { alias: 'f', string: true, description: 'final vote time length', default: 'PT10M' });
})
    .command('waive', 'ゲームを放棄');
module.exports = function (robot, channelManagerParam, shedulerParam) {
    var channelManager = channelManagerParam || {
        Send: function (target, message) {
            robot.messageRoom(target, translate(message));
        },
        Join: function (userIds) { return __awaiter(void 0, void 0, void 0, function () {
            var slack, channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(userIds.length === 1)) return [3 /*break*/, 1];
                        return [2 /*return*/, userIds[0]];
                    case 1:
                        slack = robot.adapter.client.web;
                        return [4 /*yield*/, slack.conversations.open({
                                users: userIds.join(',')
                            })];
                    case 2:
                        channel = _a.sent();
                        return [2 /*return*/, channel.channel.id];
                }
            });
        }); }
    };
    var fireSchedule = function () {
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, channelManager, sheduler);
        game.TimeOut();
    };
    var schedule;
    var sheduler = shedulerParam || {
        SetSchedule: function (date) {
            if (schedule) {
                schedule.cancel();
            }
            schedule = node_schedule_1.scheduleJob('job', date.toDate(), function (fire) {
                fireSchedule();
            });
        }
    };
    function thread(res, message) {
        //     if (res.message.thread_ts)
        //     res.send "すでにスレッドで会話しているときは、スレッドに返すよ"
        //   else
        //     res.message.thread_ts = res.message.rawMessage.ts
        //     res.send "スレッドではないときは、スレッドに返事をするよ"
    }
    robot.respond(/debug/, function (res) {
        res.reply(JSON.stringify(robot.brain.get('state'), null, 2));
    });
    robot.respond(/[wW]aive/, function (res) {
        robot.brain.remove(stateKey);
        res.reply('ゲームを放棄しました。');
        logger.info('%sによってゲームを放棄しました。', res.message.user.get('real_name'));
    });
    robot.respond(/NewGame(.*)/i, function (res) { return __awaiter(void 0, void 0, void 0, function () {
        var state, argv, userNames, total, config, userMatchs, invalidUserName, users, game;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!res.message.text) {
                        return [2 /*return*/];
                    }
                    state = robot.brain.get('state');
                    if ((state === null || state === void 0 ? void 0 : state.game.Phase) !== undefined && state.game.Phase !== 'GameOver') {
                        res.reply('ゲームが進行中です。');
                        return [2 /*return*/];
                    }
                    argv = paser.parse((_a = res.message.text) === null || _a === void 0 ? void 0 : _a.split(/\s/).slice(1), function (err, argv, output) {
                        if (output) {
                            res.send(output);
                        }
                    });
                    if (argv.users === undefined) {
                        res.send('参加者を指定してください');
                        return [2 /*return*/];
                    }
                    userNames = argv.users.split(',');
                    total = argv.werewolf + argv.psycho + argv.fortuneTeller + argv.knight + argv.psychic + argv.sharer;
                    if (userNames.length < total) {
                        res.send('参加者と役職の数が一致しません');
                        return [2 /*return*/];
                    }
                    if (argv.sharer % 2 !== 0) {
                        res.send('共有者は2で割り切れる人数でなければなりません');
                        return [2 /*return*/];
                    }
                    config = {
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
                    userMatchs = userNames.map(function (name) {
                        if (name.startsWith('@')) {
                            return {
                                name: name,
                                user: robot.brain.userForName(name.replace('@', ''))
                            };
                        }
                        else if (name === 'me') {
                            return {
                                name: name,
                                user: res.message.user
                            };
                        }
                        else {
                            return {
                                name: name,
                                user: null
                            };
                        }
                    });
                    invalidUserName = userMatchs.filter(function (match) { return match.user === null; }).map(function (match) { return match.name; });
                    if (invalidUserName.length > 0) {
                        res.reply(invalidUserName.join(', ') + "\u306F\u8A8D\u8B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
                        return [2 /*return*/];
                    }
                    res.reply("ゲームの作成を開始しました。");
                    users = userMatchs.map(function (match) { return new werewolf_1.User(match.user.id, match.user.name); });
                    game = werewolf_1.createGame(users, config, channelManager, sheduler, res.message.room);
                    return [4 /*yield*/, game.startGame()];
                case 1:
                    _b.sent();
                    robot.brain.set('state', game.getState());
                    return [2 /*return*/];
            }
        });
    }); });
    robot.respond(/CO\s(\w+)(\s+(\w+)\s+(\w+))?/, function (res) {
        console.log(res.match);
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, channelManager, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
    robot.respond(/[rR]eport\s(\w+)\s+(\w+)/, function (res) {
        console.log(res.match);
        var state = robot.brain.get('state');
        var game = werewolf_1.storeGame(state, channelManager, sheduler);
        var player = game.getPlayerByUserId(res.message.user.id);
        robot.brain.set('state', game.getState());
    });
    robot.respond(/[bB]ite\s(\w+)/, function (res) {
        try {
            var userName = res.match[1].replace('@', '');
            var userId = robot.brain.userForName(userName);
            if (userId === null) {
                res.reply(userName + "\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
                return;
            }
            var state = robot.brain.get('state');
            var next = werewolf_1.bite(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id);
            robot.brain.set('state', next);
        }
        catch (e) {
            res.reply(translate(e));
        }
    });
    robot.respond(/[fF]ortune\s(\w+)/, function (res) {
        try {
            var userName = res.match[1].replace('@', '');
            var userId = robot.brain.userForName(userName);
            if (userId === null) {
                res.reply(userName + "\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
                return;
            }
            var state = robot.brain.get('state');
            var result = werewolf_1.fortune(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id);
            res.reply("@" + userId + "\u306F" + result + "\u3067\u3059\u3002");
        }
        catch (e) {
            res.reply(translate(e));
        }
    });
    robot.respond(/[eE]scort\s(\w+)/, function (res) {
        try {
            var userName = res.match[1].replace('@', '');
            var userId = robot.brain.userForName(userName);
            if (userId === null) {
                res.reply(userName + "\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
                return;
            }
            var state = robot.brain.get('state');
            var next = werewolf_1.escort(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id);
            robot.brain.set('state', next);
        }
        catch (e) {
            res.reply(translate(e));
        }
    });
    robot.respond(/[vV]ote\s(.+)/, function (res) {
        try {
            var userName = res.match[1].replace('@', '');
            var userId = robot.brain.userForName(userName);
            if (userId === null) {
                res.reply(userName + "\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
                return;
            }
            var state = robot.brain.get('state');
            var next = werewolf_1.vote(state, channelManager, sheduler, res.message.room, res.message.user.id, userId.id);
            robot.brain.set('state', next);
        }
        catch (e) {
            res.reply(translate(e));
        }
    });
};
