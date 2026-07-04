import { useEffect, useState } from 'react'

export type Route =
  | { name: 'overview' }
  | { name: 'runs'; agentId?: string; status?: string }
  | { name: 'trace'; id: string }

function parse(hash: string): Route {
  const raw = hash.replace(/^#/, '')
  const [path, query = ''] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query)
  if (parts.length === 0 || parts[0] === 'overview') return { name: 'overview' }
  if (parts[0] === 'runs') {
    if (parts[1]) return { name: 'trace', id: parts[1] }
    return { name: 'runs', agentId: params.get('agent') || undefined, status: params.get('status') || undefined }
  }
  return { name: 'overview' }
}

/** Imperative navigation — sets the hash, which drives the route. */
export function navigate(path: string): void {
  window.location.hash = path
}

/** Subscribes to the URL hash and returns the parsed route. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parse(typeof window !== 'undefined' ? window.location.hash : ''),
  )
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
