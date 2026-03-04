import "./App.css";
import requestServices from './services/requests'
import { Message, Conversation} from '../shared/types'
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from './lib/supabase.js'
import Login from './components/Login.js'
import type { Session } from '@supabase/supabase-js'
import { PanelLeftClose, PanelLeftOpen, Plus, LogOut, Send } from 'lucide-react'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userMsg, setUserMsg] = useState("");
  const [selectedConvoId, setSelectedConvoId] = useState("");
  const [currConvo, setCurrConvo] = useState<Conversation | null>(null)
  const [sidebarConvos, setSidebarConvos] = useState<{convoId: string, convoTitle: string}[]>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const initialized = useRef(false)

  useEffect(() => {
    if (!session || initialized.current) return
    initialized.current = true

    requestServices.getConvos().then((convoArray: {convoId: string, convoTitle: string}[]) => {
      setSidebarConvos(convoArray)

      if(convoArray.length === 0){
        requestServices.createConvo().then((newConvo: Conversation) => {
          setCurrConvo(newConvo)
          setSelectedConvoId(newConvo.id)
        }).catch(() => {})
      } else {
        requestServices.getConvo(convoArray[0].convoId).then((returnedConvo) => {
          setCurrConvo(returnedConvo)
          setSelectedConvoId(returnedConvo.id)
        }).catch(() => {})
      }
    }).catch(() => {})

  }, [session])

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    if (!currConvo) return
    requestServices.getConvos().then((convoArray: {convoId: string, convoTitle: string}[]) => {
      setSidebarConvos(convoArray)
    }).catch(() => {})

  }, [currConvo]);

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <div className="text-2xl font-bold tracking-tight text-primary">Unpack</div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  if(currConvo === null){
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <div className="text-2xl font-bold tracking-tight text-primary">Unpack</div>
        <div className="text-sm text-muted-foreground">Setting up your workspace...</div>
      </div>
    )
  }

  const handleUserMsgChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserMsg(event.target.value);
  };

  const createMessage = (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) return;

    setUserMsg("");
    setIsStreaming(true)

    const userMsgObj: Message = { role: "user", content: userMessage }
    const assistantMsgObj: Message = { role: "assistant", content: "" }
    setCurrConvo(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMsgObj, assistantMsgObj]
    } : prev)

    requestServices.streamMsg(
      selectedConvoId,
      userMessage,
      (chunk) => {
        setCurrConvo(prev => {
          if (!prev) return prev
          const msgs = [...prev.messages]
          const last = msgs[msgs.length - 1]
          msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
          return { ...prev, messages: msgs }
        })
      },
      (conversation) => {
        setCurrConvo(conversation)
        setIsStreaming(false)
      },
      (error) => {
        setCurrConvo(prev => {
          if (!prev) return prev
          const msgs = [...prev.messages]
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content || `Error: ${error}` }
          return { ...prev, messages: msgs }
        })
        setIsStreaming(false)
      }
    )
  };

  const createNewConvo = () => {
    if (isStreaming) return
    requestServices.createConvo().then((newConvo: Conversation) => {
      setCurrConvo(newConvo)
      setSelectedConvoId(newConvo.id)
      return requestServices.getConvos()
    }).then((convoArray) => {
      if (convoArray) setSidebarConvos(convoArray)
    })
  }

  const clickConvo = (convoId: string) => {
    if (isStreaming) return
    requestServices.getConvo(convoId).then((returnedConvo) => {
      setCurrConvo(returnedConvo)
      setSelectedConvoId(returnedConvo.id)
    })
  }

  return (
    <div className="h-screen flex bg-background text-foreground">

      {/* ===== SIDEBAR ===== */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
          {/* Brand + toggle */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
            <span className="text-lg font-bold tracking-tight text-primary">Unpack</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* New conversation */}
          <div className="p-3">
            <button
              onClick={() => createNewConvo()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="h-4 w-4" />
              New conversation
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {sidebarConvos?.map((convo) => (
              <button
                key={convo.convoId}
                onClick={() => clickConvo(convo.convoId)}
                className={`w-full text-left text-sm truncate px-3 py-2 rounded-lg transition-colors ${
                  selectedConvoId === convo.convoId
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {convo.convoTitle}
              </button>
            ))}
          </div>

          {/* Bottom — logout */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-border flex-shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <span className="text-sm sm:text-base text-muted-foreground truncate">
            {currConvo.title || 'New conversation'}
          </span>
        </div>

        {/* ===== MESSAGES ===== */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="max-w-2xl mx-auto">
            {currConvo.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <div className="text-3xl font-bold tracking-tight text-primary mb-2">Unpack</div>
                <p className="text-muted-foreground text-base max-w-md">
                  Your AI presentation coach. Tell me about the presentation you're working on — what's the topic, who's the audience, and what do you want them to walk away with?
                </p>
              </div>
            )}

            {currConvo.messages.map((message, index) => (
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
                  <div className="text-base sm:text-base leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {isStreaming && message.role === "assistant" && index === currConvo.messages.length - 1 && !message.content && (
                      <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* ===== INPUT AREA ===== */}
        <div className="px-4 pb-4 pt-2">
          <div className="chat-input max-w-2xl mx-auto rounded-xl border border-border bg-card p-3 transition-all">
            <Textarea
              className="w-full resize-none min-h-[48px] max-h-[160px] border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground"
              placeholder="Describe your presentation, or ask for coaching advice..."
              value={userMsg}
              onChange={handleUserMsgChange}
              disabled={isStreaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  createMessage(userMsg);
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {isStreaming ? "Coaching..." : "Enter to send"}
              </span>
              <Button
                size="icon-sm"
                onClick={() => createMessage(userMsg)}
                disabled={isStreaming || !userMsg.trim()}
                className="rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
