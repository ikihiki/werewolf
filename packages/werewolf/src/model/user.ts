export type UserId = string;

export class User {
  Id: UserId;
  Name: string
  constructor (id: UserId, name: string) {
    this.Id = id
    this.Name = name
  }
}
