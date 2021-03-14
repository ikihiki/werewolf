const bot = require('../../scripts/index.js');

module.exports = (robot) => {
    global.timeout = () => {
        const state = robot.brain.get('state')
        const game = storeGame(state, channelManager, sheduler)
        game.TimeOut()
    }
    const sheduler = {
        SetSchedule: (date) => {
        }
    }
    bot(robot, undefined, sheduler)
}