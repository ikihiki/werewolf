import { Robot } from "hubot";
import { Job, scheduleJob } from "node-schedule";
import pino from "pino";
import { WebClient } from "@slack/web-api";
import {
  ChannelManager,
  GameContext,
  Scheduler,
  StateManager,
  timeout,
  User,
} from "werewolf";
import { parse, ParserContext, translate } from "command-parser";
import dayjs from "dayjs";

const stateKey = "state";
const logger = pino();

module.exports = (
  robot: Robot,
  channelManagerParam?: ChannelManager,
  shedulerParam?: Scheduler,
  shuffleFunc?: (users: User[]) => User[]
) => {
  let schedule: Job | undefined;

  const okReaction = async function (message: Hubot.Message) {
    context.logger.info('react to %o', message)
    const slack = (robot.adapter as any).client.web as WebClient;
    const channel = await slack.reactions.add({
      channel: message.room,
      name: "heavy_check_mark",
      timestamp: message.id,
    });
  };
  const context = {
    channelManager: channelManagerParam || {
      Send: (target, message) => {
        const translated = translate(message);
        context.logger.debug(
          "send message original: %o text: %s",
          message,
          translated
        );
        robot.messageRoom(target, translated);
      },
      Join: async (userIds) => {
        context.logger.debug("create channel: %o text: %s", userIds);
        if (userIds.length === 1) {
          return userIds[0];
        } else {
          const slack = (robot.adapter as any).client.web as WebClient;
          const channel = await slack.conversations.open({
            users: userIds.join(","),
          });
          return (channel.channel as any).id;
        }
      },
    },
    logger: logger,
    scheduler: shedulerParam || {
      SetSchedule: (date) => {
        context.logger.info("set schedule: %s", date);
        if (schedule) {
          schedule.cancel();
        }
        if (date !== undefined) {
          schedule = scheduleJob("job", date.toDate(), (fire) => {
            context.logger.info("fire schedule: %o", fire);
            fireSchedule();
          });
        }
      },
    },
    stateManager: {
      loadState: () => {
        const state = robot.brain.get(stateKey);
        if (state === undefined || state === null) {
          return undefined;
        }
        return state;
      },
      saveState: (state) => {
        robot.brain.set(stateKey, state)
        robot.brain.save()
      },
      pushAction: (action) => robot.brain.set("a", action),
    } as StateManager,
    removeState: () => robot.brain.remove(stateKey),
    resolveUserId: (userName) =>
      userName === undefined
        ? undefined
        : robot.brain.userForName(userName.replace("@", ""))?.id,
  } as Omit<
    ParserContext,
    | "reply"
    | "messageRoom"
    | "messageUserId"
    | "messageUserName"
    | "shuffleFunc"
  >;

  const fireSchedule = () => {
    timeout(context);
  };



  robot.respond(/debug/, (res) => {
    res.reply(JSON.stringify(robot.brain.get("state"), null, 2));
  });

  robot.respond(/.+/, async (res) => {
    await parse(res.message.text || "", {
      ...context,
      reply: (text) => res.reply(text),
      messageRoom: res.message.room,
      messageUserId: res.message.user.id,
      messageUserName: res.message.user.name,
      shuffleFunc,
    });
    await okReaction(res.message)
  });

  setTimeout(
    () => {
      context.logger.info(
        "initial state : %o",
        JSON.parse(robot.brain.get(stateKey))
      );
      const nextPhaseStr = JSON.parse(robot.brain.get(stateKey))?.game
        .NextPhase;
      if (nextPhaseStr != null) {
        context.logger.info("set scheduler for launch");
        const nextPhase = dayjs(nextPhaseStr);
        if (dayjs() > nextPhase) {
          timeout(context);
        } else if (schedule == null) {
          context.scheduler.SetSchedule(nextPhase);
        }
      }
    },
    20000
  );
};
