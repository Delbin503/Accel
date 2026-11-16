import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Accel: useSyncExternalStore instead of an effect that copied the viewport
// width into state on mount (react-hooks/set-state-in-effect). Same media
// query subscription and same value; it is now correct on the first render.
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
