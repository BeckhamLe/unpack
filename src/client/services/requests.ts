import { Conversation } from "../../shared/types.js"

const createConvo = async () => {
    const response = await fetch('/create')
    const newConvo = await response.json()
    return newConvo
}

const getConvo = async(convoId: string) => {
    const response = await fetch(`/convo/${convoId}`)
    const returnedConvo = await response.json()
    return returnedConvo
}

const getConvos = async() => {
    const response = await fetch('/convos')
    const convoIdsTitles = await response.json()
    return convoIdsTitles
}

// Non-streaming fallback
const sendMsg = async(convoId: string, userMsg: string) => {
    const response = await fetch('/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg, id: convoId })
    });
    const updatedConvo = await response.json()
    return updatedConvo
}

// Streaming message — calls /chat/stream SSE endpoint
const streamMsg = async(
    convoId: string,
    userMsg: string,
    onChunk: (text: string) => void,
    onDone: (conversation: Conversation) => void,
    onError: (error: string) => void
) => {
    const response = await fetch('/chat/stream', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg, id: convoId })
    })

    if (!response.ok || !response.body) {
      onError("Failed to connect to stream")
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Parse SSE lines from the buffer
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const json = line.slice(6)

        try {
          const event = JSON.parse(json)
          if (event.type === "chunk") {
            onChunk(event.text)
          } else if (event.type === "done") {
            onDone(event.conversation)
          } else if (event.type === "error") {
            onError(event.message)
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }
}

export default { createConvo, getConvo, getConvos, sendMsg, streamMsg }