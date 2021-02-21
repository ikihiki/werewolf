import { UserId } from './user'

export type ChannelId = string
export type ChannelType = 'All' | 'Werewolf' | 'Sherer'
export interface Channel {
    Id: ChannelId
    Participants: UserId[]
    Type: ChannelType
    Send: (text: string) => void
}
export interface CannelFactory {
    (participants: UserId[], type: ChannelType): Channel
}
