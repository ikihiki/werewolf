import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { ChannelManager, createGame, Scheduler } from 'werewolf'
import App from './App';
import { Provider } from 'react-redux';
import * as serviceWorker from './serviceWorker';
import { User } from 'werewolf/dest/user';
import { Config } from 'werewolf/dest/config';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import iziToast from 'izitoast';

dayjs.extend(duration)

const users = []
for (let i = 1; i < 9; i++) {
  users.push(new User(`user-${i}`, `User${i}`))
}
const config: Config = {
  numberOfWerewolf: 2,
  numberOfPsycho: 1,
  numberOfFortuneTeller: 1,
  numberOfKnight: 1,
  numberOfPsychic: 1,
  numberOfSharer: 0,
  dayLength: dayjs.duration({ hours: 6 }).toISOString(),
  nightLength: dayjs.duration({ hours: 6 }).toISOString(),
  finalVoteLength: dayjs.duration({ minutes: 10 }).toISOString(),
  voteLength: dayjs.duration({ minutes: 20 }).toISOString(),
}

const channelManager = {
  Send: (target, message) => iziToast.info({
    title: message.message,
    message: `target: ${JSON.stringify(target)}\nparam:${JSON.stringify(message.param)}`,
    timeout: 50000
  }),
  Join: (userIds) => {
    iziToast.success({
      title: 'Create channel',
      message: `users are ${JSON.stringify(userIds)}`,
      timeout: 50000
    })
    return Promise.resolve( JSON.stringify(userIds))
  }
} as ChannelManager;

const scheduler: Scheduler = {
  SetSchedule: date => iziToast.success({
    title: 'Schedule set',
    message: `date is ${date.format()}`,
    timeout: 50000
  })
}


const game = createGame(users, config, channelManager, scheduler, 'All')

ReactDOM.render(
  <React.StrictMode>
    <Provider store={game.store}>
      <App game={game} />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
