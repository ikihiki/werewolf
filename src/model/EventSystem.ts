import { GameId } from './game'

type EventId = string;
type PlayerId = string;

interface WereWolfEvent<Type extends string, Payload> {
    type: Type;
    id: EventId
    game: GameId;
    payload: Payload;
}

interface WereWolfEventCreator<Type extends string, Payload> {
    type: Type;
    (id: EventId, game: GameId, payload: Payload): WereWolfEvent<Type, Payload>

}

function createEvnetCreator<Payload, Type extends string> (type: Type): WereWolfEventCreator<Type, Payload> {
  const func = (id: EventId, game: GameId, payload: Payload) => {
    return {
      type: type,
      id: id,
      game: game,
      payload: payload
    } as WereWolfEvent<Type, Payload>
  }
  func.type = type
  return func
}

const Kill = createEvnetCreator<{ target: PlayerId }, 'kill'>('kill')
const Protect = createEvnetCreator<{ target: number }, 'protect'>('protect')

type Events = ReturnType<typeof Kill> | ReturnType<typeof Protect>;

function reducer (a: Events) {
  if (a.type === Kill.type) {
    a.payload.target.charAt(1)
  } else if (a.type === Protect.type) {
    a.payload.target.toFixed()
  }
}

const v: Events = Kill('s', 's', { target: 'd' })
reducer(v)

export class EventSystem {

}
