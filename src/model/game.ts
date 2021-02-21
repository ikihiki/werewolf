import { User } from "./user";
import { Config } from "./config";
import { Player, Werewolf, Psycho, FortuneTeller, Knight, Psychic, Sharer, Citizen } from "./player";

export type GameId = string;


export class Game {
    Players: Player[];
    Config: Config;
    constructor(players: Player[], config:Config) {
        this.Players = players;
        this.Config = config;
    }

    getPlayerByUser(user: User){
        
    }
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export const createGame = (users: User[], config: Config): Game => {
    const players: Player[] = [];
    const unselectedUsers = [...users];
    const selectUser = () => {
        const number = getRandomInt(unselectedUsers.length - 1);
        return unselectedUsers.splice(number, 1)[0];
    };
    for (let i = 0; i < config.numberOfWerewolf; i++) {
        players.push(new Werewolf(selectUser()))
    }
    for (let i = 0; i < config.numberOfPsycho; i++) {
        players.push(new Psycho(selectUser()))
    }
    for (let i = 0; i < config.numberOfFortuneTeller; i++) {
        players.push(new FortuneTeller(selectUser()))
    }
    for (let i = 0; i < config.numberOfKnight; i++) {
        players.push(new Knight(selectUser()))
    }
    for (let i = 0; i < config.numberOfPsychic; i++) {
        players.push(new Psychic(selectUser()))
    }
    for (let i = 0; i < config.numberOfSharer; i++) {
        players.push(new Sharer(selectUser()))
    }
    for (const user of unselectedUsers) {
        players.push(new Citizen(user));
    }

    return new Game(players, config);
}