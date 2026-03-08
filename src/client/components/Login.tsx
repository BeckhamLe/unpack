import { supabase } from '../lib/supabase.js'

export default function Login() {
  const signIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-[22px] font-bold text-primary tracking-tight">Unpack</span>
      </nav>

      {/* Hero */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 px-6 md:px-12 pt-12 pb-16 md:pt-20 md:pb-16 max-w-[1100px] mx-auto">

        {/* Left — text */}
        <div className="flex-1 max-w-[460px] text-center md:text-left">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide mb-6">
            Outline-first presentations
          </span>
          <h1 className="text-3xl md:text-[44px] font-extrabold leading-[1.12] tracking-tight mb-5">
            Figure out what to say.{' '}
            <span className="text-primary">Then make the deck.</span>
          </h1>
          <p className="text-base md:text-[17px] text-muted-foreground leading-relaxed mb-8">
            Most tools skip straight to slides. Unpack starts with a conversation — asking the right questions, structuring your thinking, and building an outline you can export straight to Google Slides.
          </p>
          <button
            onClick={signIn}
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-foreground text-background rounded-[10px] text-base font-semibold cursor-pointer hover:opacity-90 transition-opacity mb-3"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          <p className="text-xs text-muted-foreground/60">
            Free to use. No credit card required.
          </p>
        </div>

        {/* Right — visual */}
        <div className="flex-1 max-w-[480px] w-full flex flex-col gap-3.5">
          {/* Chat mock */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3.5">
              Conversation
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-primary/8 text-muted-foreground/80 rounded-[10px] px-3.5 py-2.5 text-[13px] leading-relaxed mr-10">
                What are you presenting, and who needs to hear it?
              </div>
              <div className="bg-secondary text-foreground rounded-[10px] px-3.5 py-2.5 text-[13px] leading-relaxed ml-10 text-right">
                Our new caching layer — presenting at the engineering all-hands.
              </div>
              <div className="bg-primary/8 text-muted-foreground/80 rounded-[10px] px-3.5 py-2.5 text-[13px] leading-relaxed mr-10">
                What's the one thing you want people to remember when they leave?
              </div>
              <div className="bg-secondary text-foreground rounded-[10px] px-3.5 py-2.5 text-[13px] leading-relaxed ml-10 text-right">
                That it cut p99 latency by 40% with zero app-level changes.
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="text-center text-primary text-2xl opacity-60">&#8595;</div>

          {/* Outline mock */}
          <div className="bg-card border border-border rounded-[14px] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3.5">
              Structured outline
            </div>
            <div className="bg-secondary rounded-[10px] p-5 flex flex-col gap-2.5">
              <OutlineSlide num={1} title="Transparent Caching Layer" detail="40% p99 reduction. Zero app changes." />
              <OutlineSlide num={2} title="The Problem" detail="Growing tail latency across 12 services" />
              <OutlineSlide num={3} title="How It Works" detail="Middleware intercept → cache-aside → TTL strategy" />
              <OutlineSlide num={4} title="Results" detail="p99: 320ms → 190ms, cache hit rate 87%" />
            </div>
            <div className="flex items-center justify-end gap-2 mt-3.5 pt-3.5 border-t border-border">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary/12 text-primary rounded-lg text-xs font-semibold">
                <ExportIcon />
                Export to Google Slides
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-[800px] mx-auto px-6 md:px-12 pt-14 pb-20 border-t border-border/50">
        <h2 className="text-[13px] font-semibold uppercase tracking-[1.5px] text-muted-foreground text-center mb-9">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <HowStep icon="&#128172;" title="Have a conversation" description="Tell Unpack what you're presenting. It asks follow-ups, challenges vague spots, and pulls out the key points." />
          <HowStep icon="&#9998;" title="Get a structured outline" description="Your answers become a slide-by-slide outline with clear structure, narrative flow, and the details that matter." />
          <HowStep icon="&#9889;" title="Export and customize" description="Send your outline straight to Google Slides. Add your team's branding, tweak the design, and present with confidence." />
        </div>
      </div>
    </div>
  )
}

function OutlineSlide({ num, title, detail }: { num: number; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5 text-[13px]">
      <span className="shrink-0 w-[22px] h-[22px] rounded-[5px] bg-primary/12 flex items-center justify-center text-primary text-[11px] font-bold">
        {num}
      </span>
      <span className="leading-snug">
        <strong className="text-foreground">{title}</strong>
        <br />
        <span className="text-muted-foreground text-xs">{detail}</span>
      </span>
    </div>
  )
}

function HowStep({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3.5 text-xl">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold mb-1.5">{title}</h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
