import { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify, FlattenedJWSInput, JWSHeaderParameters, GetKeyFunction } from 'jose'

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

// Lazy-init JWKS — env vars aren't available at import time (dotenv runs later)
let jwks: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>
let supabaseUrl: string

function getJwks() {
  if (!jwks) {
    supabaseUrl = process.env.VITE_SUPABASE_URL!
    jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  }
  return jwks
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      audience: 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
    })
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
