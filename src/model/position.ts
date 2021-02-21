import { Player } from "./player";

export type Camp = "Werewolf Side" | "Citizen Side";

export interface Position{
    Name: string;
    Camp: Camp;
}


export class Werewolf implements Position{

    get Name(): string{
         return "Werewolf";
     }
    get Camp(): Camp{
        return "Werewolf Side";
    }
}