import "./App.css";
import requestServices from './services/requests'
import { Message, Conversation} from '../shared/types'
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from './lib/supabase.js'
import Login from './components/Login.js'
import type { Session } from '@supabase/supabase-js'
import { toast, Toaster } from 'sonner'
import { Menu, X, Loader2 } from 'lucide-react'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userMsg, setUserMsg] = useState("");
  const [selectedConvoId, setSelectedConvoId] = useState("");
  const [currConvo, setCurrConvo] = useState<Conversation | null>(null)
  const [sidebarConvos, setSidebarConvos] = useState<{convoId: string, convoTitle: string}[]>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

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

  // Online/offline detection
  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  const initialized = useRef(false)

  // One-time init: load conversations after first successful auth
  useEffect(() => {
    if (!session || initialized.current) return
    initialized.current = true

    requestServices.getConvos().then((convoArray: {convoId: string, convoTitle: string}[]) => {
      setSidebarConvos(convoArray)

      if(convoArray.length === 0){
        requestServices.createConvo().then((newConvo: Conversation) => {
          setCurrConvo(newConvo)
          setSelectedConvoId(newConvo.id)
        }).catch((err) => toast.error(err.message))
      } else {
        requestServices.getConvo(convoArray[0].convoId).then((returnedConvo) => {
          setCurrConvo(returnedConvo)
          setSelectedConvoId(returnedConvo.id)
        }).catch((err) => toast.error(err.message))
      }
    }).catch((err) => toast.error(err.message))

  }, [session])

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll + sidebar refresh on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    if (!currConvo) return
    requestServices.getConvos().then((convoArray: {convoId: string, convoTitle: string}[]) => {
      setSidebarConvos(convoArray)
    }).catch(() => {}) // silent — sidebar refresh is non-critical

  }, [currConvo]);

  // Auth loading spinner
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated — show login
  if (!session) {
    return <Login />
  }

  // Conversation loading
  if(currConvo === null){
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        toast.error(error || 'Something went wrong')
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
      setSidebarOpen(false)
      return requestServices.getConvos()
    }).then((convoArray) => {
      if (convoArray) setSidebarConvos(convoArray)
    }).catch((err) => toast.error(err.message))
  }

  const clickConvo = (convoId: string) => {
    if (isStreaming) return
    requestServices.getConvo(convoId).then((returnedConvo) => {
      setCurrConvo(returnedConvo)
      setSelectedConvoId(returnedConvo.id)
      setSidebarOpen(false)
    }).catch((err) => toast.error(err.message))
  }

  // Sidebar content — shared between mobile overlay and desktop static
  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="sm:text-md text-lg md:text-xl font-semibold">Chat History</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            Logout
          </Button>
          {/* Close button — mobile only */}
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 items-stretch">
        {sidebarConvos?.map((convo) => (
          <p
            key={convo.convoId}
            onClick={() => clickConvo(convo.convoId)}
            className={`text-sm md:text-md font-medium truncate p-3 rounded-lg cursor-pointer transition-colors ${
              selectedConvoId === convo.convoId
                ? "bg-accent"
                : "hover:bg-accent/50"
            }`}
          >
            {convo.convoTitle}
          </p>
        ))}
        <Button className="py-1 md:py-2 w-full" onClick={() => createNewConvo()}>
          New Conversation
        </Button>
      </div>
    </>
  )

  return (
    <div className="h-screen flex bg-background text-foreground">
      <Toaster position="top-right" richColors duration={5000} />

      {/* Connection-lost banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-primary-foreground text-center py-2 text-sm font-medium">
          You're offline — check your connection
        </div>
      )}

      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute inset-y-0 left-0 w-64 flex flex-col bg-card shadow-xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
      <div className="hidden md:flex w-64 border-r border-border flex-shrink-0 flex-col bg-card">
        {sidebarContent}
      </div>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="flex-1 flex flex-col">

        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border">
          <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium truncate">{currConvo.title || 'New Conversation'}</span>
        </div>

        {/* ===== CONVERSATION CONTAINER ===== */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {currConvo.messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 avatar rounded-full bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                    C
                  </div>
                )}

                <Card className={`max-w-[80%] shadow-md py-0 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border-border"
                }`}>
                  <CardContent className="p-3">
                    <p className="responsive-text whitespace-pre-wrap">{message.content}</p>
                    {/* Streaming indicator on the last assistant message */}
                    {isStreaming && message.role === "assistant" && index === currConvo.messages.length - 1 && (
                      <Loader2 className="h-4 w-4 animate-spin mt-2 text-muted-foreground inline-block" />
                    )}
                  </CardContent>
                </Card>

                {message.role === "user" && (
                  <div className="flex-shrink-0 avatar rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                    U
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* ===== BOTTOM INPUT BAR ===== */}
        <div className="sticky bottom-0 border-t border-border bg-background p-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-stretch">
            <Textarea
              className="flex-1 resize-none min-h-[44px] max-h-[120px]"
              placeholder="Type a message..."
              value={userMsg}
              onChange={handleUserMsgChange}
              disabled={isStreaming || isOffline}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  createMessage(userMsg);
                }
              }}
            />
            <Button onClick={() => createMessage(userMsg)} disabled={isStreaming || isOffline}>
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
            <Button variant="outline" disabled={isStreaming}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
