export function sessionCookieOptions(protocol: string) {
  return {
    path: '/',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    secure: protocol === 'https:',
  }
}

export function isCurrentSessionUnauthorized(error: unknown, requestedToken: string, currentToken: string) {
  if (!requestedToken || requestedToken !== currentToken) return false
  const failure = error as { response?: { status?: number }; statusCode?: number; status?: number } | null
  return (failure?.response?.status ?? failure?.statusCode ?? failure?.status) === 401
}
