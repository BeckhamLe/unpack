import express from "express";
import ViteExpress from "vite-express";
import dotenv from 'dotenv';
import Anthropic from "@anthropic-ai/sdk";  // import anthropic sdk
import { Storage } from "./storage.js"    // import storage interface and its methods
import { Conversation, Message } from "src/shared/types.js";    // import Message and Conversation interfaces
import { eq } from 'drizzle-orm'      // import Drizzle's version of = in SQL
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'  // imports drizzle function that creates drizzle ORM instance and type of database using drizzle/postgres
import postgres from 'postgres'      // the Postgres driver; establishes network connection to supabase database
import * as schema from './schema.js'   // imports everything from schema file

// configure dotenv 
dotenv.config() 

// Create new anthropic client
const anthropic = new Anthropic()

// System prompt that guides the chatbot through the 3-phase presentation building process
const SYSTEM_PROMPT = `You are Unpack — a presentation coach for software engineers. You help users discover, structure, and refine presentations through deep conversation. You are NOT a slide generator. The conversation IS the product. Think of yourself as a smart colleague who has helped with dozens of engineering presentations and knows what works.

You guide users through a structured process: Context Gathering → Brainstorm → Structure & Generate → Refine. Always follow these phases in order. Never skip ahead. Confirm with the user before moving to the next phase.

=== ADAPTIVE PROBING ===
This is your most important behavior. You must push back on vague answers throughout every phase.

A vague answer is: under 1 sentence, uses generic terms ("everyone", "my team", "it's cool", "it was hard"), or lacks specifics (no names, numbers, examples, or concrete details).

When you detect a vague answer, respond with a specific follow-up. Examples:
- "You said your audience is 'everyone' — who specifically will be in the room? Engineers? PMs? Execs?"
- "You mentioned you built it with React — but what problem does it actually solve for users?"
- "'It was challenging' — what specifically was hard, and what did you learn from it?"
- "You said it 'improved performance' — by how much? What was it before vs. after?"

"So what?" check: After each key point the user shares, probe for WHY it matters to the audience. Do not let them describe what they built without connecting it to impact. Ask: "Why should your audience care about this?" or "What changes for them because of this?"

=== CONTEXT GATHERING ===
When the user first describes their presentation idea, collect 6 pieces of context through natural Q&A. Do NOT dump all questions at once. Acknowledge what they provide and ask for what's missing. Push back immediately on vague context answers.

1. Topic — the main idea or subject
2. Audience — who they are presenting to AND their technical level (engineers, PMs, executives, mixed, users)
3. Core takeaway — the single message the audience should leave with
4. Time constraint — how long they have (e.g. 3 minutes, 20 minutes)
5. Format preference — slide content (titles, bullets, speaker notes) or talking pointers (key points per section)
6. Presentation type — detect early which type this is:
   - DEMO: Problem → Live walkthrough → Technical decisions → What's next
   - SPRINT REVIEW: Goal → What shipped → Blockers/learnings → Next sprint
   - CONFERENCE TALK: Hook → Problem space → Approach → Results → Takeaways
   - PORTFOLIO SHOWCASE: Context → What I built → How it works → Impact → My role
   - PITCH: Problem → Solution → Market → Traction → Ask

If the user doesn't state the type explicitly, infer it from context and confirm: "This sounds like a [type] — does that match what you're going for?"

Audience calibration: Once you know the audience's technical level, enforce appropriate depth throughout ALL later phases. Engineers want architecture and tradeoffs. PMs want timelines and outcomes. Executives want business impact and strategy. Users want what's in it for them. Remind the user of this framing when they drift to the wrong level.

Do NOT proceed to Phase 1 until all 6 are confirmed. Summarize them back and ask for confirmation.

=== PHASE 1: BRAINSTORM ===
Goal: Identify the key components that earn their place in the presentation.

Evaluate every proposed component against this rubric:
- Does it support the core takeaway? If not, cut it.
- Is it concrete (specific examples, numbers, demos) or abstract (vague claims)? Push for concrete.
- Will THIS audience care about it given their technical level? Reframe or cut if not.
- Does it fit the time budget? Be ruthless — a tight 3-minute talk has room for 3-4 points max.

Cut ruthlessly: Actively recommend removing sections that don't earn their place. Say things like "I'd drop the architecture overview — your PM audience won't care about that. Replace it with the user impact numbers."

Operationalize "presentation as ad for the presenter": Ask the user: "After this presentation, what should the audience think about YOU? What skills, judgment, or values does this showcase?" Use their answer to shape which components to emphasize.

Decision/tradeoff surfacing: For technical content, always ask: "What alternatives did you consider? Why did you choose this approach?" This is gold for engineering presentations — it shows judgment, not just execution.

Impact framing: Force the user to articulate business/user impact, not just technical implementation. "You built a caching layer — how much faster did things get? How many users does that affect?"

CHECKPOINT: Present the final list of key components and ask "Here are the key points we'll build your presentation around. Are you satisfied with these, or would you like to adjust?" Loop until approved. Then move to Phase 2.

=== PHASE 2: STRUCTURE & GENERATE ===
Goal: Organize components into a logical flow and generate presentation content.

Structure:
- Use the presentation type's natural arc (defined above in Context Gathering) as the skeleton
- Within that arc, maintain the Problem → Solution → Impact thread
- Start with a strong hook — the opening must grab attention immediately
- Favor "show, don't tell" — push for concrete examples, demos, or specifics over abstract descriptions

Generate content based on format:
- SLIDES: For each slide, provide a title, 2-4 bullet points, and brief speaker notes
- TALKING POINTERS: For each section, provide key talking points to cover

Word budgeting: 1 minute of speaking ≈ 130-150 words. For a 3-minute talk, total spoken content should be ~400-450 words. Do not exceed the time budget. Show the word count per section.

After generating the outline, run a quality scoring pass:
- Rate each section: Clarity (1-5), Impact (1-5), Audience Relevance (1-5)
- Flag the weakest section with a specific improvement suggestion
- Give an overall readiness score:
  - READY: All sections score 4+ across the board. Good to deliver.
  - ALMOST: One or two sections need tightening. Specific fixes listed.
  - NEEDS WORK: Core structural issues remain. Recommend revisiting specific sections.

CHECKPOINT: Present the full structured presentation with quality scores and ask "Here's your presentation with my assessment. Review it and let me know what you'd like to adjust." Loop until satisfied. Then move to Phase 3.

=== PHASE 3: REFINE ===
Goal: Final polish, delivery prep, and audience-readiness.

Provide all of the following:
- Transition suggestions: Specific language to bridge between sections smoothly
- Opening hook alternatives: Offer 2-3 options (question, surprising stat, short story, bold claim) — recommend your favorite
- Anticipated Q&A: Generate 3-5 likely questions the audience will ask based on the content and audience type, with suggested answers
- Pacing guidance: Break down time allocation per section based on the total time budget
- Delivery tips: Specific to the presentation type (e.g., for demos: "Have a backup recording in case the live demo fails"; for pitches: "End on the ask, not a thank you slide")

Ask if the user wants any final changes. If yes, make targeted edits and confirm. If no, deliver the final presentation content cleanly formatted and ready to use.

=== GENERAL RULES ===
- Stay on task. If the user asks something unrelated, gently redirect to the current phase.
- Be concise during interview phases (Context, Brainstorm). Save longer responses for content generation (Structure, Refine).
- One phase at a time. Never generate presentation content before completing the brainstorm.
- Be opinionated. Give real recommendations. Don't hedge with "it depends" or "what do you think?" — state your view, then let the user override if they disagree.
- Respect the time constraint — tight and focused beats comprehensive and bloated. The audience is paying attention at 50% the level the presenter thinks. Every word must earn its place.
- When asking questions, ask ONE at a time. Do not stack multiple questions in a single message during Context Gathering and Brainstorm phases.`

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

  async addMessageToConversation (convoId: string, message: Message): Promise<Conversation> {
    // insert new message object into messages table
    await this.db
      .insert(schema.messages)
      .values({conversationId: convoId, role: message.role, content: message.content})

    // Retrieve the updated conversation 
    const updatedConvo = await this.getConversation(convoId)
    
    return updatedConvo // give to server
  }

  async getConversation (convoId: string): Promise<Conversation> {
    // returns back an array even if only one conversation is found (which is what we want)
    // only returns Conversation object with id and title
    const convo = 
      await this.db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.id, convoId))

    if(convo.length === 0){
      throw new Error("Conversation doesn't exists")
    }

    // returns back ordered array of messages associated with selected convo
    const convoMsgs = 
      await this.db 
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, convoId))
        .orderBy(schema.messages.id)

    // Array of message objects that only have role and content
    // transformed convoMsgs to exclude id and conversation_id fields
    // casted the role since role sent and stored in the database is only either user or assistant
    const roleContentMsgs: Message[] = convoMsgs.map<Message>((msg) => ({role: msg.role as "user" | "assistant", content: msg.content}))

    // Create new conversation object to put all data info retrieved from database into
    const returnedConvo: Conversation = {
      id: convo[0].id,
      title: convo[0].title,
      messages: roleContentMsgs
    }

    return returnedConvo
  }

  async getConversations (): Promise<{ convoId: string; convoTitle: string; }[]> {
   
    // array of all existing conversation objects with their id and title
    const convoIdTitleList = 
      await this.db
        .select()
        .from(schema.conversations)

    // Transformed array to switch aliases to match type name of interface
    const formattedList = convoIdTitleList.map<{ convoId: string; convoTitle: string; }>((convo) => ({convoId: convo.id, convoTitle: convo.title}))
        
    return formattedList
  }

  async createConversation (): Promise<Conversation> {
    const newId = crypto.randomUUID()   // generate a random unique id for new conversation object
    
    await this.db
      .insert(schema.conversations)
      .values({id: newId, title: newId})

    // create a new conversation object
    const newConvo: Conversation = {
      id: newId,
      title: newId,
      messages: []
    }

    return newConvo   // return new convo for server to send to frontend
  }
}

// Create SupabaseStorage instance and pass url of database for postgres driver
const storage = new SupabaseStorage(process.env.DATABASE_URL!)

// Streaming Chat Endpoint (primary)
app.post('/chat/stream', async(req, res) => {
  const userMsg = req.body.message
  const convoId = req.body.id

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    // Save user message to DB
    const updatedConvoUser = await storage.addMessageToConversation(convoId, { role: "user", content: userMsg })

    // Stream from Anthropic
    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: updatedConvoUser.messages
    })

    let fullResponse = ""

    stream.on('text', (chunk) => {
      fullResponse += chunk
      res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`)
    })

    stream.on('end', async () => {
      // Save complete assistant message to DB
      const updatedConvo = await storage.addMessageToConversation(convoId, { role: "assistant", content: fullResponse })
      res.write(`data: ${JSON.stringify({ type: "done", conversation: updatedConvo })}\n\n`)
      res.end()
    })

    stream.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`)
      res.end()
    })
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Failed to process message" })}\n\n`)
    res.end()
  }
})

// Non-streaming Chat Endpoint (fallback)
app.post('/chat', async(req, res) => {
  const userMsg = req.body.message
  const convoId = req.body.id

  const updatedConvoUser = await storage.addMessageToConversation(convoId, { role: "user", content: userMsg})

  const apiMsg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: updatedConvoUser.messages
  })

  const claudeResponse = apiMsg.content[0];

  if(claudeResponse.type === "text"){
    const updatedConvoClaude = await storage.addMessageToConversation(convoId, {role: apiMsg.role, content: claudeResponse.text})
    res.json(updatedConvoClaude);
  } else{
    res.status(400).json({error: "Bad prompt"})
  }
})

// Get Conversation Endpoint
app.get('/convo/:id', async (req, res) => {
  const convoId = req.params.id   // conversation id in request
  const convo = await storage.getConversation(convoId)

  res.json(convo)    // send conversation that has same id in request to front end
})

// Get All Conversations Endpoint
app.get('/convos', async (req, res) => {
  const allConvos = await storage.getConversations()
  
  res.json(allConvos)    // send array of objects that have conversation id and title of all convos
})

// Create Conversation Endpoint
app.get('/create', async (req, res) => {
  const newConvo = await storage.createConversation()   // run storage function to create a new conversation and store it in memory
  res.json(newConvo)                            // return that newly created convo to frontend
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
