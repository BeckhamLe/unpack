import express from "express";
import ViteExpress from "vite-express";
import dotenv from 'dotenv';
import Anthropic from "@anthropic-ai/sdk";  // import anthropic sdk
import { Storage } from "./storage.js"    // import storage interface and its methods
import { Conversation, Message, MessageMetadata } from "src/shared/types.js";    // import Message and Conversation interfaces
import type { Tool } from "@anthropic-ai/sdk/resources/messages.js";
import { eq, and } from 'drizzle-orm'      // import Drizzle's version of = and AND in SQL
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'  // imports drizzle function that creates drizzle ORM instance and type of database using drizzle/postgres
import postgres from 'postgres'      // the Postgres driver; establishes network connection to supabase database
import * as schema from './schema.js'   // imports everything from schema file
import { requireAuth } from './middleware/auth.js'

// configure dotenv 
dotenv.config() 

// Create new anthropic client
const anthropic = new Anthropic()

// System prompt — collaborative presentation coach with tool-use instructions
const SYSTEM_PROMPT = `You are Unpack — a presentation coach for software engineers. You help users discover, structure, and refine presentations through collaborative conversation. Think of yourself as a smart colleague who's helped with dozens of engineering presentations and knows what works.

You guide users through 4 phases: Context → Brainstorm → Structure → Refine. Move through them naturally — don't announce phase names to the user. Use the presentation_metadata tool on EVERY response to provide structured data.

=== HOW YOU RESPOND ===
Every response has two parts:
1. Your conversational message (text) — this streams to the user in real-time
2. A presentation_metadata tool call — structured data that powers the UI (phase tracking, suggestion buttons, slide content)

ALWAYS call the presentation_metadata tool. Your text response comes first, then the tool call.

Use markdown formatting in your text responses: **bold** for emphasis, bullet lists for options, \`code\` for technical terms, ### headings to organize longer responses.

=== CONVERSATION STYLE ===
- Be collaborative, not interrogative. You're building this together, not conducting an interview.
- Ask ONE question at a time. Never stack multiple questions.
- Keep responses concise in early phases (2-4 sentences + a question). Save longer responses for structure/refine.
- Be opinionated. Give real recommendations. Don't hedge — state your view, let the user override.
- When the user gives a vague answer, push back with a specific follow-up:
  "You said 'everyone' — who specifically will be in the room?"
  "You mentioned it 'improved performance' — by how much?"
- After key points, probe for WHY it matters to the audience.
- Aim for 3-4 exchanges in context gathering, not 8-10. Be efficient.

=== CONTEXT PHASE ===
Collect through natural conversation (not a checklist dump):
1. Topic — what the presentation is about
2. Audience — who + their technical level
3. Core takeaway — the single message to leave with
4. Time constraint — how long they have
5. Presentation type — infer and confirm: DEMO, SPRINT REVIEW, CONFERENCE TALK, PORTFOLIO SHOWCASE, or PITCH

When you have enough context, summarize and confirm. Then advance to brainstorm.

=== BRAINSTORM PHASE ===
Identify key components that earn their place. For each:
- Does it support the core takeaway?
- Is it concrete (examples, numbers) or abstract?
- Will THIS audience care?
- Does it fit the time budget?

Cut ruthlessly. Recommend removing sections that don't earn their spot. Surface decisions and tradeoffs for technical content. Push for impact framing over implementation details.

Present the final component list and get approval before moving to structure.

=== STRUCTURE PHASE ===
Organize into a logical flow and generate slide content. Use the presentation type's natural arc. Start with a strong hook.

When generating slides, output them in the slides[] array of your tool call. Each slide needs:
- A unique slideId (e.g., "intro", "problem", "architecture", "metrics", "closing")
- A type matching one of the 5 layouts: title, content, code, metrics, closing
- Content fields appropriate to the type (see SLIDE LAYOUTS below)

IMPORTANT: When regenerating the full deck, output unchanged slides EXACTLY as they appeared in your previous response. Only modify slides the user specifically asked about. Stability matters — don't silently rephrase or reorder.

After generating, rate quality and flag the weakest section.

=== REFINE PHASE ===
Polish and prepare for delivery:
- Transition suggestions between sections
- Opening hook alternatives (2-3 options)
- Anticipated Q&A (3-5 questions with suggested answers)
- Pacing guidance per section
- Delivery tips specific to the presentation type

=== SLIDE LAYOUTS ===
You have 5 slide types. Choose the right one based on content:

**title** — Opening slide
Fields: heading (required), subtitle, author, date
Use for: First slide of any deck

**content** — The workhorse
Fields: heading (required), bullets (string array, max 5 items)
Use for: Key points, explanations, lists, most slides

**code** — Code snippets
Fields: heading (required), code (string), language (string), caption
Use for: API examples, architecture snippets, config, terminal output
Keep code under 15 lines. Use caption to explain what it shows.

**metrics** — Big numbers
Fields: heading, stats (array of {number, label}, 2-4 items)
Use for: Performance improvements, KPIs, launch stats, before/after comparisons

**closing** — Final slide
Fields: heading (required), links (string array), cta
Use for: Thank you, contact info, Q&A prompt, repo links

=== GENERAL RULES ===
- Stay on task. Redirect unrelated questions to the current phase.
- Respect time constraints — tight and focused beats comprehensive and bloated.
- Never generate slides before completing brainstorm.
- In suggestions[], always provide 2-3 natural next steps the user might want to take. Make them specific to the conversation, not generic.`

// Anthropic tool definition for structured metadata
const PRESENTATION_METADATA_TOOL: Tool = {
  name: "presentation_metadata",
  description: "Provide structured metadata alongside your conversational response. Call this on every response to power the UI with phase tracking, suggestion buttons, and slide content.",
  input_schema: {
    type: "object" as const,
    properties: {
      phase: {
        type: "string",
        enum: ["context", "brainstorm", "structure", "refine"],
        description: "Current conversation phase"
      },
      messageType: {
        type: "string",
        enum: ["question", "checklist", "tip", "summary", "slide_content"],
        description: "Type of this message for UI rendering"
      },
      suggestions: {
        type: "array",
        items: { type: "string" },
        description: "2-3 quick-reply suggestions for the user. Be specific and contextual.",
        minItems: 2,
        maxItems: 3
      },
      slides: {
        type: "array",
        description: "Full slide deck (only in structure/refine phases). Each message carries the complete deck.",
        items: {
          type: "object",
          properties: {
            slideId: { type: "string", description: "Stable identifier, e.g. 'intro', 'problem', 'demo'" },
            type: { type: "string", enum: ["title", "content", "code", "metrics", "closing"] },
            heading: { type: "string" },
            subtitle: { type: "string" },
            author: { type: "string" },
            date: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            code: { type: "string" },
            language: { type: "string" },
            caption: { type: "string" },
            stats: { type: "array", items: { type: "object", properties: { number: { type: "string" }, label: { type: "string" } }, required: ["number", "label"] } },
            links: { type: "array", items: { type: "string" } },
            cta: { type: "string" }
          },
          required: ["slideId", "type"]
        }
      },
      qualityScore: {
        type: "number",
        description: "Overall quality score 1-10 (only after generating slide outline)",
        minimum: 1,
        maximum: 10
      }
    },
    required: ["phase", "messageType", "suggestions"]
  }
}

const app = express();  // create express app server
app.use(express.json())   // have this to parse request body and be able to access it

// Supabase Storage Class using Drizzle/Postgres
class SupabaseStorage implements Storage {
  private db: PostgresJsDatabase<typeof schema>   // Drizzle ORM instance; object that lets server read/write to database

  // Constructor method: Sets up connection with remote database
  constructor(databaseUrl: string) {
    // connection object
    const client = postgres(databaseUrl)    // establish connection to supabase database
    
    // combines both the connection and schema 
    this.db = drizzle(client, {schema})     // gives typed methods to read and write data to database
  }

  async addMessageToConversation (convoId: string, userId: string, message: Message): Promise<Conversation> {
    // Verify ownership before allowing writes
    const convo = await this.db
      .select()
      .from(schema.conversations)
      .where(and(eq(schema.conversations.id, convoId), eq(schema.conversations.userId, userId)))

    if (convo.length === 0) {
      throw new Error("Conversation not found or access denied")
    }

    // insert new message object into messages table
    await this.db
      .insert(schema.messages)
      .values({conversationId: convoId, role: message.role, content: message.content, metadata: message.metadata ?? null})

    // Retrieve the updated conversation
    const updatedConvo = await this.getConversation(convoId, userId)

    return updatedConvo // give to server
  }

  async getConversation (convoId: string, userId: string): Promise<Conversation> {
    // Filter by both convoId and userId to enforce ownership
    const convo =
      await this.db
        .select()
        .from(schema.conversations)
        .where(and(eq(schema.conversations.id, convoId), eq(schema.conversations.userId, userId)))

    if(convo.length === 0){
      throw new Error("Conversation not found or access denied")
    }

    // returns back ordered array of messages associated with selected convo
    const convoMsgs =
      await this.db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, convoId))
        .orderBy(schema.messages.id)

    const roleContentMsgs: Message[] = convoMsgs.map<Message>((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      metadata: msg.metadata as MessageMetadata | null ?? undefined
    }))

    const returnedConvo: Conversation = {
      id: convo[0].id,
      title: convo[0].title,
      messages: roleContentMsgs
    }

    return returnedConvo
  }

  async getConversations (userId: string): Promise<{ convoId: string; convoTitle: string; }[]> {
    // Only return conversations owned by this user
    const convoIdTitleList =
      await this.db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.userId, userId))

    const formattedList = convoIdTitleList.map<{ convoId: string; convoTitle: string; }>((convo) => ({convoId: convo.id, convoTitle: convo.title}))

    return formattedList
  }

  async createConversation (userId: string): Promise<Conversation> {
    if (!userId) throw new Error('userId is required')
    const newId = crypto.randomUUID()

    await this.db
      .insert(schema.conversations)
      .values({id: newId, title: 'New conversation', userId})

    const newConvo: Conversation = {
      id: newId,
      title: 'New conversation',
      messages: []
    }

    return newConvo
  }

  async saveFeedback (data: { conversationId: string; userId: string; rating?: number; workingWell?: string; notWorking?: string; wouldImprove?: string; type: string }): Promise<void> {
    await this.db
      .insert(schema.feedback)
      .values(data)
  }

  async updateTitle (convoId: string, userId: string, title: string): Promise<void> {
    await this.db
      .update(schema.conversations)
      .set({ title })
      .where(and(eq(schema.conversations.id, convoId), eq(schema.conversations.userId, userId)))
  }
}

// Create SupabaseStorage instance and pass url of database for postgres driver
const storage = new SupabaseStorage(process.env.DATABASE_URL!)

// Prepare messages for Anthropic API:
// 1. Strip metadata (not needed in LLM context)
// 2. Merge consecutive same-role messages (self-heal broken conversations)
// 3. Inject latest slides as context note (avoid duplicate decks in history)
function prepareMessagesForAnthropic(messages: Message[]): { role: "user" | "assistant"; content: string }[] {
  // Find the latest slides from message metadata
  let latestSlides: string | null = null
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].metadata?.slides && messages[i].metadata!.slides!.length > 0) {
      latestSlides = JSON.stringify(messages[i].metadata!.slides)
      break
    }
  }

  // Strip metadata, keep only role + content
  const stripped = messages.map(msg => ({ role: msg.role, content: msg.content }))

  // Merge consecutive same-role messages
  const merged = stripped.reduce<{ role: "user" | "assistant"; content: string }[]>((acc, msg) => {
    const prev = acc[acc.length - 1]
    if (prev && prev.role === msg.role) {
      prev.content += "\n" + msg.content
    } else {
      acc.push({ ...msg })
    }
    return acc
  }, [])

  // Inject latest slides context if available
  if (latestSlides && merged.length > 0) {
    const lastAssistant = [...merged].reverse().find(m => m.role === "assistant")
    if (lastAssistant) {
      lastAssistant.content += `\n\n[Current slide deck for reference: ${latestSlides}]`
    }
  }

  return merged
}

// Streaming Chat Endpoint (primary)
app.post('/chat/stream', requireAuth, async(req, res) => {
  const userMsg = req.body.message
  const convoId = req.body.id
  const userId = req.userId!

  if (!convoId || typeof convoId !== 'string') {
    res.status(400).json({ error: 'Missing conversation id' })
    return
  }
  if (!userMsg || typeof userMsg !== 'string' || !userMsg.trim()) {
    res.status(400).json({ error: 'Missing or empty message' })
    return
  }

  // SSE headers — must disable buffering for chunks to arrive incrementally
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const updatedConvoUser = await storage.addMessageToConversation(convoId, userId, { role: "user", content: userMsg })

    // Auto-title: set from first user message (when only 1 user message exists)
    const userMessages = updatedConvoUser.messages.filter(m => m.role === 'user')
    if (userMessages.length === 1) {
      const title = userMsg.slice(0, 60).trim() + (userMsg.length > 60 ? '...' : '')
      storage.updateTitle(convoId, userId, title).catch(err => console.error('Auto-title failed:', err))
      updatedConvoUser.title = title
    }

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [PRESENTATION_METADATA_TOOL],
      tool_choice: { type: "auto" },
      messages: prepareMessagesForAnthropic(updatedConvoUser.messages)
    })

    let fullResponse = ""
    let metadataSnapshot: unknown = null

    // Abort the Anthropic stream if the client disconnects
    req.on('close', () => stream.abort())

    // Dual-mode streaming: text streams to client, tool_use JSON accumulates silently
    stream.on('text', (chunk) => {
      fullResponse += chunk
      res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`)
    })

    // inputJson snapshot is already a parsed object from the SDK
    stream.on('inputJson', (_delta, snapshot) => {
      metadataSnapshot = snapshot
    })

    stream.on('end', async () => {
      try {
        // Extract metadata from tool_use snapshot (already parsed by SDK)
        let metadata: MessageMetadata | null = null
        const finalMessage = await stream.finalMessage()

        if (metadataSnapshot && typeof metadataSnapshot === 'object') {
          const m = metadataSnapshot as Record<string, unknown>
          // Validate required fields exist before casting
          if (m.phase && m.messageType && Array.isArray(m.suggestions)) {
            metadata = metadataSnapshot as MessageMetadata
          } else {
            console.warn('Metadata missing required fields:', Object.keys(m))
          }
        }

        // Check for truncation
        if (finalMessage.stop_reason === "max_tokens") {
          res.write(`data: ${JSON.stringify({ type: "warning", message: "Response was truncated — try asking for a shorter response" })}\n\n`)
        }

        // Save assistant message with metadata
        const updatedConvo = await storage.addMessageToConversation(convoId, userId, {
          role: "assistant",
          content: fullResponse,
          metadata
        })

        // Send metadata to client (if present)
        if (metadata) {
          res.write(`data: ${JSON.stringify({ type: "metadata", data: metadata })}\n\n`)
        }

        res.write(`data: ${JSON.stringify({ type: "done", conversation: updatedConvo })}\n\n`)
      } catch (err) {
        console.error('Failed to save response:', err)
        res.write(`data: ${JSON.stringify({ type: "error", message: "Failed to save response" })}\n\n`)
      }
      res.end()
    })

    stream.on('error', async (err) => {
      console.error('Anthropic stream error:', err)
      // Save whatever we got so the conversation doesn't end up with consecutive user messages
      const fallback = fullResponse || "[Stream interrupted — please try again]"
      await storage.addMessageToConversation(convoId, userId, { role: "assistant", content: fallback, metadata: null }).catch(e => console.error('Fallback save failed:', e))
      res.write(`data: ${JSON.stringify({ type: "error", message: "Stream interrupted" })}\n\n`)
      res.end()
    })
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Failed to process message" })}\n\n`)
    res.end()
  }
})

// Non-streaming Chat Endpoint (fallback)
app.post('/chat', requireAuth, async(req, res) => {
  const userMsg = req.body.message
  const convoId = req.body.id
  const userId = req.userId!

  if (!convoId || typeof convoId !== 'string') {
    res.status(400).json({ error: 'Missing conversation id' })
    return
  }
  if (!userMsg || typeof userMsg !== 'string' || !userMsg.trim()) {
    res.status(400).json({ error: 'Missing or empty message' })
    return
  }

  try {
    const updatedConvoUser = await storage.addMessageToConversation(convoId, userId, { role: "user", content: userMsg})

    const apiMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [PRESENTATION_METADATA_TOOL],
      tool_choice: { type: "auto" },
      messages: prepareMessagesForAnthropic(updatedConvoUser.messages)
    })

    // Extract text and metadata from response content blocks
    let textContent = ""
    let metadata: MessageMetadata | null = null
    for (const block of apiMsg.content) {
      if (block.type === "text") {
        textContent += block.text
      } else if (block.type === "tool_use" && block.name === "presentation_metadata") {
        metadata = block.input as MessageMetadata
      }
    }

    if (textContent) {
      const updatedConvoClaude = await storage.addMessageToConversation(convoId, userId, { role: apiMsg.role, content: textContent, metadata })
      res.json(updatedConvoClaude)
    } else {
      res.status(400).json({ error: "Bad prompt" })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message' })
  }
})

// Get Conversation Endpoint
app.get('/convo/:id', requireAuth, async (req, res) => {
  const convoId = req.params.id as string
  const convo = await storage.getConversation(convoId, req.userId!)

  res.json(convo)
})

// Get All Conversations Endpoint
app.get('/convos', requireAuth, async (req, res) => {
  const allConvos = await storage.getConversations(req.userId!)

  res.json(allConvos)
})

// Create Conversation Endpoint
app.get('/create', requireAuth, async (req, res) => {
  const newConvo = await storage.createConversation(req.userId!)
  res.json(newConvo)
})

// Submit Feedback Endpoint
app.post('/feedback', requireAuth, async (req, res) => {
  const userId = req.userId!
  const { conversationId, rating, workingWell, notWorking, wouldImprove, type } = req.body

  if (!conversationId || typeof conversationId !== 'string') {
    res.status(400).json({ error: 'Missing conversation id' })
    return
  }
  if (!type || (type !== 'session' && type !== 'manual')) {
    res.status(400).json({ error: 'Invalid feedback type' })
    return
  }
  if (rating !== undefined && rating !== 1 && rating !== -1) {
    res.status(400).json({ error: 'Rating must be 1 or -1' })
    return
  }

  const sanitizeText = (val: unknown): string | undefined => {
    if (val === undefined || val === null || val === '') return undefined
    if (typeof val !== 'string') return undefined
    return val.slice(0, 2000)
  }

  try {
    // Verify conversation belongs to this user
    await storage.getConversation(conversationId, userId)

    await storage.saveFeedback({
      conversationId,
      userId,
      rating,
      workingWell: sanitizeText(workingWell),
      notWorking: sanitizeText(notWorking),
      wouldImprove: sanitizeText(wouldImprove),
      type,
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Failed to save feedback:', error)
    res.status(500).json({ error: 'Failed to save feedback' })
  }
})

// Endpoint to reset chat history
/*
app.delete('/reset', (req, res) => {
  const convoId = req.body.id
  
  storage. = []  // clear message history
  res.status(200).end()
})
*/

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
