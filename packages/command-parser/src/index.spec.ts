import { parse } from './index'

describe('parse', () => {
  it('test', () => {
    const message = parse('help')
    console.log(message)
    expect(message).toBeTruthy()
  })

  it('test2', () => {
    const message = parse('@werewolf NewGame @user1 @user2 @user3 @user4 @user5 @user6 @user7 @user8 @user9')
  })
})
