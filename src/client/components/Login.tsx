import { supabase } from '../lib/supabase.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Login() {
  const signIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Unpack</h1>
          <p className="text-sm text-muted-foreground text-center">
            AI presentation coach for software engineers
          </p>
          <Button className="w-full" onClick={signIn}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
