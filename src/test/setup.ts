import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom ships neither of these. Provide minimal stubs so motion primitives
// render deterministically in tests. matchMedia reports reduced-motion = true,
// which makes every animated primitive render its final/static state instantly.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

if (typeof window.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    root = null
    rootMargin = ''
    thresholds = []
  }
  // @ts-expect-error -- assigning a test stub onto the jsdom window
  window.IntersectionObserver = IntersectionObserverStub
}
