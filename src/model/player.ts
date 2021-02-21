import { User } from "./user";

export type Camp = "Werewolf Side" | "Citizen Side";
export type Position = "Werewolf" | "Psycho" | "Citizen" | "FortuneTeller" | "Knight" | "Psychic" | "Sharer";


export class Player {
    User: User;
    IsSurvival: boolean;
    Camp: Camp;
    Position: Position;
    constructor(user: User, camp: Camp, position: Position) {
        this.User = user;
        this.IsSurvival = true;
        this.Camp = camp;
        this.Position = position;
    }

    Bite(target: Player) { }

    Fortune(target: Player) { }

    Escort(target: Player) { }
}

export class Werewolf extends Player {
    constructor(user: User) {
        super(user, "Werewolf Side", "Werewolf");
    }
    Bite(target: Player) { }
}

export class Psycho extends Player {
    constructor(user: User) {
        super(user, "Werewolf Side", "Psycho");
    }
}
export class Citizen extends Player {
    constructor(user: User) {
        super(user, "Citizen Side", "Citizen");
    }
}
export class FortuneTeller extends Player {
    constructor(user: User) {
        super(user, "Citizen Side", "FortuneTeller");
    }
    Fortune(target: Player) { }
}
export class Knight extends Player {
    constructor(user: User) {
        super(user, "Citizen Side", "Knight");
    }
    Escort(target: Player) { }
}
export class Psychic extends Player {
    constructor(user: User) {
        super(user, "Citizen Side", "Psychic");
    }
}
export class Sharer extends Player {
    constructor(user: User) {
        super(user, "Citizen Side", "Sharer");
    }
}