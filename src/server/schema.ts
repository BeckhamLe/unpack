// Importing Drizzle's building blocks for PostgreSQL tables
// pgTable = creates a table
// text, serial = define column types
import { pgTable, text, serial, integer, timestamp } from 'drizzle-orm/pg-core'

// Conversations table schema
export const conversations = pgTable('conversations', {
  // id column that takes type text (string)
  // title column that takes type text
  // .primaryKey() = unique identifier for each row

  //convo id
  id: text('id').primaryKey(),

  // convo title
  title: text('title').notNull(),   // notNull() = can't be empty

  // owner — nullable so existing test conversations still work
  userId: text('user_id'),
})

// Messages table schema
export const messages = pgTable('messages', {
  // serial() = auto-incrementing integer
  // .references(() => someTable.someColumn) = used for establishing foreign key connection between 2 tables

  // id for keeping track of the order of messages being sent to the database
  id: serial('id').primaryKey(),

  // convo id
  conversationId: text('conversation_id').notNull().references(() => conversations.id), // connects to the convo id column in conversations table

  // either user or assistant to tell who sent the message
  role: text('role').notNull(),

  // content of the message
  content: text('content').notNull(),
})

// Feedback table schema
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
  userId: text('user_id').notNull(),
  rating: integer('rating'),
  workingWell: text('working_well'),
  notWorking: text('not_working'),
  wouldImprove: text('would_improve'),
  type: text('type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
