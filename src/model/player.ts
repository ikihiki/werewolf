import { User } from "./user";

export class Player {
  User: User;
  IsSurvival: boolean;
  constructor(user: User) {
    this.User = user;
    this.IsSurvival = true;
  }

  Bite(target: Player) {}

  Fortune(target: Player) {}

  Escort(target: Player){}
}