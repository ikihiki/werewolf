import {
  createUserSelector,
  setInitialUserState,
  User,
  UserId,
  userSlice,
  UserState,
} from "./user";
import { Config } from "./config";
import {
  playerSlice,
  createCitizenStore,
  createFortuneTellerStore,
  createKnightStore,
  createPlayerSelector,
  createPsychicStore,
  createPsychoStore,
  createSharerStore,
  createSurvivalPlayersSelector,
  createWerewolfStore,
  kill,
  Player,
  PlayerState,
  resetNight,
  setVoteTargets,
  vote,
  setInitialPlayerState,
  createVotingTargetPlayersSelector,
  PlayerId,
  execute,
  resetVote,
  Camp,
} from "./player";
import {
  AnyAction,
  applyMiddleware,
  CombinedState,
  combineReducers,
  createAction,
  createSlice,
  createStore,
  Store,
  PayloadAction,
} from "@reduxjs/toolkit";
import { CannelFactory, Channel } from "./channel";
import createSagaMiddleware from "redux-saga";
import { call, fork, put, select, takeEvery } from "redux-saga/effects";
import groupBy from "lodash/fp/groupBy";
import { max, maxBy, sortBy, takeWhile } from "lodash";
import { compose } from "redux";

export type GameId = string;
export type Phase = "Daytime" | "Vote" | "Night" | "GameOver";
export interface Scheduler {
  SetSchedule: (date: Date) => void;
}

interface GameState {
  Phase: Phase;
  Days: number;
  Config: Config;
}
const timeOut = createAction("timeOut");
const gameSline = createSlice({
  name: "game",
  initialState: { Phase: "Daytime", Days: 1 } as GameState,
  reducers: {
    setConfig: (state, action: PayloadAction<Config>) => ({
      ...state,
      Config: action.payload,
    }),
    toDay: (state) => ({ ...state, Phase: "Daytime", Days: state.Days + 1 }),
    toNight: (state) => ({ ...state, Phase: "Night" }),
    toVote: (state) => ({ ...state, Phase: "Vote" }),
    toGameOver: (state, action: PayloadAction<Camp>) => ({
      ...state,
      Phase: "GameOver",
    }),
  },
});
export const {
  setConfig,
  toDay,
  toNight,
  toVote,
  toGameOver,
} = gameSline.actions;
interface RootState {
  game: GameState;
  users: UserState[];
  players: PlayerState[];
}

export const usersSelector = (state: RootState) => state.users;
export const userSelector = createUserSelector(usersSelector);
export const playersSelector = (state: RootState) => state.players;
export const playerSelector = createPlayerSelector(playersSelector);
export const survivalPlayersSelector = createSurvivalPlayersSelector(
  playersSelector
);
export const votingTargetPlayersSeledtor = createVotingTargetPlayersSelector(
  playersSelector
);
export const gameSelector = (state: RootState) => state.game;
export const phaseSelector = (state: RootState) => gameSelector(state).Phase;
export class Game {
  WerewolfChannel: Channel;
  ShererChannel: Channel | null;
  AllChannel: Channel;
  store: Store<RootState, AnyAction>;
  Scheduler: Scheduler;
  constructor(
    players: PlayerState[],
    users: User[],
    config: Config,
    allChannel: Channel,
    werewolfChannel: Channel,
    shererChannel: Channel | null,
    scheduler: Scheduler
  );
  constructor(
    state: RootState,
    _1: number,
    _2: number,
    allChannel: Channel,
    werewolfChannel: Channel,
    shererChannel: Channel | null,
    scheduler: Scheduler
  );
  constructor(
    stateOrPlayer: PlayerState[] | RootState,
    userOrDummy: User[] | number,
    configOrDummy: Config | number,
    allChannel: Channel,
    werewolfChannel: Channel,
    shererChannel: Channel | null,
    scheduler: Scheduler
  ) {
    this.AllChannel = allChannel;
    this.WerewolfChannel = werewolfChannel;
    this.ShererChannel = shererChannel;
    this.Scheduler = scheduler;

    const reducer = combineReducers<RootState>({
      players: playerSlice.reducer,
      game: gameSline.reducer,
      users: userSlice.reducer,
    });
    const sagaMiddleware = createSagaMiddleware();
    const composeEnhancers =
      (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    this.store = createStore(
      reducer,
      composeEnhancers(applyMiddleware(sagaMiddleware))
    );
    if (typeof userOrDummy === "object") {
      const players = stateOrPlayer as PlayerState[];
      const users = userOrDummy as UserState[];
      const config = configOrDummy as Config;
      this.store.dispatch(setConfig(config));
      this.store.dispatch(setInitialPlayerState({ state: players }));
      this.store.dispatch(setInitialUserState({ state: users }));
    } else {
      for (const key in stateOrPlayer) {
        (this.store.getState() as any)[key] = (stateOrPlayer as any)[key];
      }
    }
    const judgeWin = function* () {
      const survivalPlayers: PlayerState[] = yield select(
        survivalPlayersSelector
      );
      const werewolfCount = survivalPlayers.filter(
        (player) => player.Position === "Werewolf"
      ).length;
      const werewolfSideCount = survivalPlayers.filter(
        (player) => player.Camp === "Werewolf Side"
      ).length;
      const citizenSideCount = survivalPlayers.filter(
        (player) => player.Camp === "Citizen Side"
      ).length;
      if (werewolfCount === 0) {
        yield put(toGameOver("Citizen Side"));
        allChannel.Send("市民が勝利しました");
        return true;
      } else if (werewolfSideCount >= citizenSideCount) {
        yield put(toGameOver("Werewolf Side"));
        allChannel.Send("人狼が勝利しました");
        return true;
      } else {
        return false;
      }
    };
    function* totalVote() {
      const survivalPlayers: PlayerState[] = yield select(
        survivalPlayersSelector
      );
      const votedGroup = new Map(
        Object.entries(
          groupBy<PlayerState>((player) => player.VoteTo, survivalPlayers)
        )
      );
      console.log(votedGroup);
      const votedCount = new Map(
        Array.from(votedGroup.entries()).map(([key, players]) => [
          key,
          players.length,
        ])
      );
      console.log(votedCount);
      const countGroup = new Map(
        Object.entries(
          groupBy(
            (entry) => entry.count,
            Array.from(votedCount.entries()).map(([key, count]) => ({
              key,
              count,
            }))
          )
        )
      );
      console.log(countGroup);
      const maxCount = max(Array.from(countGroup.keys()).map(Number.parseInt));
      if (maxCount === undefined) {
        return;
      }
      const targets = countGroup.get(maxCount?.toString());
      if (targets?.length === 1) {
        const target = survivalPlayers.find(
          (player) => player.Id === targets[0].key
        );
        if (target) {
          yield put(execute({ target: target.Id }));
          const users: UserState[] = yield select(usersSelector);
          const name = users.find((user) => user.Id === target.User);
          allChannel.Send(`${name}は処刑されました。`);
          if (yield call(judgeWin)) {
            return;
          }
          yield put(toNight());
        }
      } else if (targets && targets.length > 1) {
        yield put(
          setVoteTargets({ targets: targets?.map((target) => target.key) })
        );
        yield put(resetVote());
      }
    }

    function* voteTask() {
      const survivalPlayers: PlayerState[] = yield select(
        survivalPlayersSelector
      );
      if (survivalPlayers.every((player) => player.VoteTo !== null)) {
        yield call(totalVote);
      }
    }

    const timeoutTask = function* () {
      const phase: Phase = yield select(phaseSelector);
      if (phase === "Daytime") {
        const targets: PlayerState[] = yield select(survivalPlayersSelector);
        yield put(
          setVoteTargets({ targets: targets.map((target) => target.Id) })
        );
        yield put(toVote());
      } else if (phase === "Vote") {
        yield call(totalVote);
      } else if (phase === "Night") {
        const survivalPlayers: PlayerState[] = yield select(
          survivalPlayersSelector
        );
        const killed = survivalPlayers.find(
          (player) => player.IsBited && !player.IsProtected
        );
        if (killed !== undefined) {
          yield put(kill({ target: killed.Id }));
        }
        yield put(resetNight());
        if (yield call(judgeWin)) {
          return;
        }
        yield put(toDay());
        const game: GameState = yield select(gameSelector);
        allChannel.Send(`朝になりました(${game.Days}日目)`);
        if (killed !== undefined) {
          const users: UserState[] = yield select(usersSelector);
          const name = users.find((user) => user.Id === killed.User)?.Name;
          allChannel.Send(`${name}は無残な死体となって発見されました。`);
        } else {
          allChannel.Send("何事もなく朝を迎えました");
        }
      }
    };

    const rootTask = function* () {
      yield takeEvery(vote.type, voteTask);
      yield takeEvery(timeOut.type, timeoutTask);
    };

    sagaMiddleware.run(rootTask);
  }

  getPlayerByUserId(user: UserId) {
    const state = this.store
      .getState()
      .players.find((player) => player.User === user);
    if (state === undefined) {
      return undefined;
    }

    return new Player(this.store.dispatch, state);
  }

  getPlayerByPlayerId(id: PlayerId) {
    const state = this.store
      .getState()
      .players.find((player) => player.Id === id);
    if (state === undefined) {
      return undefined;
    }

    return new Player(this.store.dispatch, state);
  }

  TimeOut(): void {
    this.store.dispatch(timeOut());
  }

  getState() {
    return this.store.getState();
  }
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

export const createGame = (
  users: User[],
  config: Config,
  allChannel: Channel,
  channelFactory: CannelFactory,
  scheduler: Scheduler
): Game => {
  const gameId = Date.now().toString();
  const players: PlayerState[] = [];
  const unselectedUsers = [...users];
  const selectUser = () => {
    const number = getRandomInt(unselectedUsers.length - 1);
    return unselectedUsers.splice(number, 1)[0];
  };
  for (let i = 0; i < config.numberOfWerewolf; i++) {
    const user = selectUser();
    players.push(createWerewolfStore(`${gameId}-${user.Id}`, user));
  }
  for (let i = 0; i < config.numberOfPsycho; i++) {
    const user = selectUser();
    players.push(createPsychoStore(`${gameId}-${user.Id}`, user));
  }
  for (let i = 0; i < config.numberOfFortuneTeller; i++) {
    const user = selectUser();
    players.push(createFortuneTellerStore(`${gameId}-${user.Id}`, user));
  }
  for (let i = 0; i < config.numberOfKnight; i++) {
    const user = selectUser();
    players.push(createKnightStore(`${gameId}-${user.Id}`, user));
  }
  for (let i = 0; i < config.numberOfPsychic; i++) {
    const user = selectUser();
    players.push(createPsychicStore(`${gameId}-${user.Id}`, user));
  }
  for (let i = 0; i < config.numberOfSharer; i++) {
    const user = selectUser();
    players.push(createSharerStore(`${gameId}-${user.Id}`, user));
  }
  for (const user of unselectedUsers) {
    players.push(createCitizenStore(`${gameId}-${user.Id}`, user));
  }

  const werewolfChannel = channelFactory(
    players
      .filter((player) => player.Position === "Werewolf")
      .map((player) => player.User),
    "Werewolf"
  );

  let sharerfChannel = null;
  if (config.numberOfSharer > 0) {
    sharerfChannel = channelFactory(
      players
        .filter((player) => player.Position === "Sharer")
        .map((player) => player.User),
      "Sherer"
    );
  }

  return new Game(
    players,
    users,
    config,
    allChannel,
    werewolfChannel,
    sharerfChannel,
    scheduler
  );
};

export const storeGame = (
  state: RootState,
  allChannel: Channel,
  werewolfChannel: Channel,
  shererChannel: Channel,
  scheduler: Scheduler
) => {
  return new Game(
    state,
    0,
    0,
    allChannel,
    werewolfChannel,
    shererChannel,
    scheduler
  );
};
