"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var node_schedule_1 = require("node-schedule");
var pino_1 = __importDefault(require("pino"));
var werewolf_1 = require("werewolf");
var command_parser_1 = require("command-parser");
var stateKey = 'state';
var logger = pino_1.default();
module.exports = function (robot, channelManagerParam, shedulerParam, shuffleFunc) {
    var schedule;
    var context = {
        channelManager: channelManagerParam || {
            Send: function (target, message) {
                robot.messageRoom(target, command_parser_1.translate(message));
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
        },
        logger: logger,
        scheduler: shedulerParam || {
            SetSchedule: function (date) {
                if (schedule) {
                    schedule.cancel();
                }
                schedule = node_schedule_1.scheduleJob('job', date.toDate(), function (fire) {
                    fireSchedule();
                });
            }
        },
        stateManager: {
            loadState: function () { return robot.brain.get(stateKey); },
            saveState: function (state) { return robot.brain.set(stateKey, state); },
            pushAction: function (action) { return robot.brain.set('a', action); }
        },
        removeState: function () { return robot.brain.remove(stateKey); },
        resolveUserId: function (userName) { var _a; return userName === undefined ? undefined : (_a = robot.brain.userForName(userName.replace('@', ''))) === null || _a === void 0 ? void 0 : _a.id; }
    };
    var fireSchedule = function () {
        werewolf_1.timeout(context);
    };
    robot.respond(/debug/, function (res) {
        res.reply(JSON.stringify(robot.brain.get('state'), null, 2));
    });
    robot.respond(/.+/, function (res) {
        command_parser_1.parse(res.message.text || "", __assign(__assign({}, context), { reply: function (text) { return res.reply(text); }, messageRoom: res.message.room, messageUserId: res.message.user.id, messageUserName: res.message.user.name }), shuffleFunc);
    });
};
