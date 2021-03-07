const Helper = require('hubot-test-helper');
// helper loads all scripts passed a directory
const helper = new Helper('../scripts');

const Promise = require('bluebird');
const co = require('co');
const expect = require('chai').expect;



describe('hello-world', function () {
  beforeEach(function () {
    this.room = helper.createRoom();
    this.room.robot.brain.mergeData({
      users: {
        user1: {
          id: 1,
          name: "user1"
        },
        user2: {
          id: 2,
          name: "user2"
        },
        user3: {
          id: 3,
          name: "user3"
        }, user4: {
          id: 4,
          name: "user4"
        }, user5: {
          id: 5,
          name: "user5"
        }, user6: {
          id: 6,
          name: "user6"
        }, user7: {
          id: 7,
          name: "user7"
        }, user8: {
          id: 8,
          name: "user8"
        }
      }
    })
    this.room.client = {
      web: {
        conversations: {
          open: (op) => {
            return {
              channel: {
                id: 10
              }
            }
          }
        }
      }
    }
  });
  afterEach(function () {
    this.room.destroy();
  });

  context('user says hi to hubot', function () {
    beforeEach(function () {
      return co(function* () {
        yield this.room.user.say('user1', '@hubot NewGame @user1,@user2,@user3,@user4,@user5,@user6,@user7,@user8');
        yield new Promise.delay(1000);
        yield this.room.user.say('user1', '@hubot bite @user2');
      }.bind(this));
    });

    it('should reply to user', function () {
      expect(this.room.messages).to.eql([
        ['user1', '@hubot NewGame @user1,@user2,@user3,@user4,@user5,@user6,@user7,@user8'],
        ['hubot', '@user1 ゲームの作成を開始しました。'],
        ['hubot', '人狼ゲームを開始します。'],
        ['hubot', '@bob hi']
      ]);
    });
  });
});