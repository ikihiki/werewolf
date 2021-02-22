import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { createGame, Scheduler } from 'werewolf/dest/game'
import App from './App';
import { Provider } from 'react-redux';
import * as serviceWorker from './serviceWorker';
import { User } from 'werewolf/dest/user';
import { Config } from 'werewolf/dest/config';
import { CannelFactory, Channel } from 'werewolf/dest/channel';

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
  numberOfSharer: 0
}

const allChannel = {
  Id: 'all',
  Type: "All",
  Send: (txt) => console.log(txt)
} as Channel;

const channelFactory: CannelFactory = (participants, type) => ({
  Id: type,
  Type: type,
  Participants: participants,
  Send: (txt) => console.log(txt)
})



const game = createGame(users, config, allChannel, channelFactory, { SetSchedule: date => console.log(date) })

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
