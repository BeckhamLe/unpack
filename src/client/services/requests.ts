import { Conversation } from "../../shared/types.js"
import { supabase } from "../lib/supabase.js"

// Authenticated fetch wrapper — attaches Bearer token, retries once on 401
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const headers = new Headers(options.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
        // Try refreshing the session once
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        if (refreshed?.access_token) {
            headers.set('Authorization', `Bearer ${refreshed.access_token}`)
            return fetch(url, { ...options, headers })
        }
        // Refresh failed — sign out and reload
        await supabase.auth.signOut()
        window.location.reload()
    }

    return response
}

const createConvo = async () => {
    const response = await authFetch('/create')
    const newConvo = await response.json()
    return newConvo
}

const getConvo = async(convoId: string) => {
    const response = await authFetch(`/convo/${convoId}`)
    const returnedConvo = await response.json()
    return returnedConvo
}

const getConvos = async() => {
    const response = await authFetch('/convos')
    const convoIdsTitles = await response.json()
    return convoIdsTitles
}

// Non-streaming fallback
const sendMsg = async(convoId: string, userMsg: string) => {
    const response = await authFetch('/chat', {
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
    const response = await authFetch('/chat/stream', {
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