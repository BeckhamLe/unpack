import { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS_URL = 'https://barvtbidfdmlhssporfb.supabase.co/auth/v1/.well-known/jwks.json'
const jwks = createRemoteJWKSet(new URL(JWKS_URL))

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jwtVerify(token, jwks)
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
