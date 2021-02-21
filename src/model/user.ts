export type UserId = string;

export class User {
  Id: UserId;

  constructor (id: UserId) {
    this.Id = id
  }
}
