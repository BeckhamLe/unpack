import {Message, Conversation} from '../shared/types.js'

export interface Storage {
    addMessageToConversation (convoId: string, userId: string, message: Message): Promise<Conversation>
    getConversations (userId: string): Promise<{convoId: string, convoTitle: string}[]>
    getConversation (convoId: string, userId: string): Promise<Conversation>
    createConversation (userId: string): Promise<Conversation>
}