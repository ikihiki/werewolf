import { Dayjs } from 'dayjs'
import { Position } from './player'
import { UserId } from './user'

export type Message =
    {
        message: '{{name}} is executed.'
        param: { name: string }
    }
    |{
        message: 'It\'s morning. (Day {{day}})'
        param: { day: number }
    }
    |{
        message: 'Citizen side win!'
        param?: undefined
    }
    |{
        message: 'Werewolf side win!'
        param?: undefined
    }
    |{
        message: '{{name}} was found dead in a heap.'
        param: { name: string }
    }
    |{
        message: 'The morning was uneventful.'
        param?: undefined
    }
    |{
        message: '{{name}} that was executed was a werewolf.'
        param: { name: string }
    }
    |{
        message: '{{name}} that was executed was a citizen.'
        param: { name: string }
    }
    |{
        message: 'You are {{position}}'
        param: { position: Position }
    }
    |{
        message: 'It\'s night.',
        param?: undefined
    }
    |{
        message: 'It\'s vote time.',
        param?: undefined
    }
    |{
        message: 'Final Vote. subject are {{ names }}'
        param: { names: string }
    }
    |{
        message: 'The next phase is {{date}}'
        param: { date: Dayjs }
    }
export type ChannelId = string
export type MessageTarget = 'All' | UserId[]

export interface ChannelManager {
    Send: (target: MessageTarget, message: Message) => void
}
