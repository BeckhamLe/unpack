import { supabase } from '../lib/supabase.js'
import { Button } from '@/components/ui/button'

export default function Login() {
  const signIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full flex flex-col items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary text-center">Unpack</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            AI presentation coach for software engineers
          </p>
        </div>
        <Button className="w-auto px-8 py-3 text-lg font-medium rounded-xl" onClick={signIn}>
          Sign in with Google
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Build better presentations through guided conversation
        </p>
      </div>
    </div>
  )
}
