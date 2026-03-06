import "./App.css";
import "./styles/slides.css";
import requestServices from './services/requests'
import { Message, Conversation, MessageMetadata, SlideData, Phase } from '../shared/types'
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from './lib/supabase.js'
import Login from './components/Login.js'
import type { Session } from '@supabase/supabase-js'
import { PanelLeftClose, PanelLeftOpen, Plus, LogOut, Send, MessageSquare, X } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import FeedbackForm from './components/FeedbackForm.js'
import MessageList from './components/MessageList.js'
import Stepper from './components/Stepper.js'
import SuggestionButtons from './components/SuggestionButtons.js'
import SlidePreview from './components/SlidePreview.js'
import { reconstructSession } from './lib/sessionReconstruct.js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userMsg, setUserMsg] = useState("");
  const [selectedConvoId, setSelectedConvoId] = useState("");
  const [currConvo, setCurrConvo] = useState<Conversation | null>(null)
  const [sidebarConvos, setSidebarConvos] = useState<{convoId: string, convoTitle: string}[]>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [sessionFeedbackDismissed, setSessionFeedbackDismissed] = useState<Set<string>>(new Set())
  const [currentPhase, setCurrentPhase] = useState<Phase>("context")
  const [latestSlides, setLatestSlides] = useState<SlideData[]>([])
  const [latestSuggestions, setLatestSuggestions] = useState<string[]>([])
  const [previousSlides, setPreviousSlides] = useState<SlideData[]>([])
  const [mobileTab, setMobileTab] = useState<'chat' | 'slides'>('chat')
  const rafIdRef = useRef<number | null>(null)
  const streamingFullTextRef = useRef("")

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
          applySessionState(returnedConvo)
        }).catch((err) => toast.error(err.message))
      }
    }).catch((err) => toast.error(err.message))

  }, [session])

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    if (!currConvo) return
    requestServices.getConvos().then((convoArray: {convoId: string, convoTitle: string}[]) => {
      setSidebarConvos(convoArray)
    }).catch(() => {}) // silent — sidebar refresh is non-critical

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

    streamingFullTextRef.current = ""
    setStreamingText("")

    const flushStreamBuffer = () => {
      const text = streamingFullTextRef.current
      setStreamingText(text)
    }

    const scheduleFlush = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null
          flushStreamBuffer()
        })
      }
    }

    requestServices.streamMsg(
      selectedConvoId,
      userMessage,
      (chunk) => {
        streamingFullTextRef.current += chunk
        scheduleFlush()
      },
      (conversation) => {
        if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
        setStreamingText("")
        streamingFullTextRef.current = ""
        setCurrConvo(conversation)
        setIsStreaming(false)
      },
      (error) => {
        if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
        const partialText = streamingFullTextRef.current
        setStreamingText("")
        streamingFullTextRef.current = ""
        toast.error(error || 'Something went wrong')
        setCurrConvo(prev => {
          if (!prev) return prev
          const msgs = [...prev.messages]
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: partialText || `Error: ${error}` }
          return { ...prev, messages: msgs }
        })
        setIsStreaming(false)
      },
      (metadata: MessageMetadata) => {
        setCurrConvo(prev => {
          if (!prev) return prev
          const msgs = [...prev.messages]
          const last = msgs[msgs.length - 1]
          msgs[msgs.length - 1] = { ...last, metadata }
          return { ...prev, messages: msgs }
        })
        // Update UI state from metadata
        const phaseOrder: Phase[] = ["context", "brainstorm", "structure", "refine"]
        const newIdx = phaseOrder.indexOf(metadata.phase)
        const curIdx = phaseOrder.indexOf(currentPhase)
        if (newIdx > curIdx) setCurrentPhase(metadata.phase)
        if (metadata.suggestions?.length) setLatestSuggestions(metadata.suggestions)
        if (metadata.slides?.length) {
          setPreviousSlides(latestSlides)
          setLatestSlides(metadata.slides)
        }
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

  const handleFeedbackSubmit = (data: { workingWell?: string; notWorking?: string; wouldImprove?: string; rating?: number; type: 'session' | 'manual' }) => {
    requestServices.submitFeedback({
      conversationId: selectedConvoId,
      ...data,
    }).then(() => {
      toast.success('Thanks for your feedback!')
      setFeedbackOpen(false)
      if (data.type === 'session') {
        setSessionFeedbackDismissed(prev => new Set(prev).add(selectedConvoId))
      }
    }).catch(() => toast.error('Failed to submit feedback'))
  }

  const userMessageCount = currConvo.messages.filter(m => m.role === 'user').length
  const showSessionCard = userMessageCount >= 8 && !sessionFeedbackDismissed.has(selectedConvoId)
  const showPreview = (currentPhase === "structure" || currentPhase === "refine") && latestSlides.length > 0

  const applySessionState = (convo: Conversation) => {
    const state = reconstructSession(convo.messages)
    setCurrentPhase(state.currentPhase)
    setLatestSlides(state.latestSlides)
    setLatestSuggestions(state.latestSuggestions)
    setPreviousSlides([])
  }

  const clickConvo = (convoId: string) => {
    if (isStreaming) return
    requestServices.getConvo(convoId).then((returnedConvo) => {
      setCurrConvo(returnedConvo)
      setSelectedConvoId(returnedConvo.id)
      applySessionState(returnedConvo)
      setSidebarOpen(false)
    }).catch((err) => toast.error(err.message))
  }

  return (
    <div className="h-screen flex bg-background text-foreground">
      <Toaster position="top-right" richColors duration={5000} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR ===== */}
      <div className={`flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-500 ease-in-out overflow-hidden md:relative fixed inset-y-0 left-0 z-50 ${sidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}>
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

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 relative">

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
          <span className="text-sm sm:text-base text-muted-foreground truncate flex-1">
            {currConvo.title || 'New conversation'}
          </span>
          <button
            onClick={() => setFeedbackOpen(!feedbackOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Feedback
          </button>
        </div>

        {/* Feedback form overlay */}
        <div
          className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${feedbackOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setFeedbackOpen(false)}
        />
        <div className={`absolute top-14 right-0 z-50 w-full max-w-md p-4 transition-all duration-300 ease-in-out ${feedbackOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}>
          <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Share your feedback</span>
              <button onClick={() => setFeedbackOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {feedbackOpen && <FeedbackForm type="manual" onSubmit={(data) => handleFeedbackSubmit(data)} onClose={() => setFeedbackOpen(false)} />}
          </div>
        </div>

        {/* Stepper */}
        <Stepper currentPhase={currentPhase} />

        {/* Mobile tab switcher */}
        {showPreview && (
          <div className="flex md:hidden border-b border-border">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${mobileTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab('slides')}
              className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${mobileTab === 'slides' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              Slides
            </button>
          </div>
        )}

        {/* Split pane: chat + preview */}
        <div className="flex-1 flex min-h-0">
          {/* Chat pane */}
          <div className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            showPreview
              ? `${mobileTab === 'slides' ? 'hidden' : 'flex'} md:flex md:w-[45%] md:border-r md:border-border`
              : 'flex-1'
          }`}>
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="max-w-2xl mx-auto">
                <MessageList
                  messages={currConvo.messages}
                  isStreaming={isStreaming}
                  streamingText={streamingText}
                  latestMetadata={null}
                />

                {/* Suggestion buttons */}
                {!isStreaming && latestSuggestions.length > 0 && currConvo.messages.length > 0 && (
                  <div className="px-3 sm:px-4 py-2">
                    <div className="max-w-2xl mx-auto">
                      <SuggestionButtons
                        suggestions={latestSuggestions}
                        onSelect={(text) => createMessage(text)}
                        disabled={isStreaming}
                      />
                    </div>
                  </div>
                )}

                {/* Inline session feedback card */}
                {showSessionCard && (
                  <div className="message-block assistant-msg">
                    <div className="max-w-2xl mx-auto">
                      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Quick check-in: How's Unpack doing?</span>
                          <button
                            onClick={() => setSessionFeedbackDismissed(prev => new Set(prev).add(selectedConvoId))}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <FeedbackForm type="session" showThumbs onSubmit={(data) => handleFeedbackSubmit(data)} onClose={() => setSessionFeedbackDismissed(prev => new Set(prev).add(selectedConvoId))} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="px-3 sm:px-4 pb-4 pt-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <div className="chat-input max-w-2xl mx-auto rounded-xl border border-border bg-card p-3 transition-all">
                <Textarea
                  className="w-full resize-none min-h-[48px] max-h-[160px] border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground"
                  placeholder="Describe your presentation, or ask for coaching advice..."
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

          {/* Slide preview pane */}
          {showPreview && (
            <div className={`${mobileTab === 'chat' ? 'hidden' : 'flex'} md:flex md:w-[55%] flex-col min-w-0`}>
              <SlidePreview
                slides={latestSlides}
                previousSlides={previousSlides}
                onSlidesChange={setLatestSlides}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
