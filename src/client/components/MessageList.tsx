import { Message, MessageMetadata } from '../../shared/types'
import MarkdownMessage from './MarkdownMessage.js'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  streamingText: string
  latestMetadata: MessageMetadata | null
}

export default function MessageList({ messages, isStreaming, streamingText }: MessageListProps) {
  return (
    <>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="text-3xl font-bold tracking-tight text-primary mb-2">Unpack</div>
          <p className="text-muted-foreground text-base max-w-md">
            Your AI presentation coach. Tell me about the presentation you're working on — what's the topic, who's the audience, and what do you want them to walk away with?
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={index}
          className={`message-block ${
            message.role === "user" ? "user-msg" : "assistant-msg"
          }`}
        >
          <div className="max-w-2xl mx-auto">
            {/* Role label */}
            <div className={`text-xs sm:text-sm font-medium mb-1.5 ${
              message.role === "user"
                ? "text-primary"
                : "text-muted-foreground"
            }`}>
              {message.role === "user" ? "You" : "Unpack"}
            </div>

            {/* Message content */}
            <div className="text-base sm:text-base leading-relaxed">
              {isStreaming && message.role === "assistant" && index === messages.length - 1
                ? (streamingText
                  ? <MarkdownMessage content={streamingText} />
                  : <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />)
                : <MarkdownMessage content={message.content} />}
            </div>

            {/* Thinking/generating indicator — persists through text + tool_use gap */}
            {isStreaming && message.role === "assistant" && index === messages.length - 1 && streamingText && (
              <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
                <span className="generating-dots flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-xs">Working on it...</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}
