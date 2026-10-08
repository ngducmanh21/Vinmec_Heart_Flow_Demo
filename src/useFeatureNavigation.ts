import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Keep the newly selected feature's heading below its sticky navigation. */
export function useFeatureNavigation<Key extends string>(initial: Key) {
  const [active, setActive] = useState<Key>(initial)
  const navigationRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const pendingScroll = useRef(false)

  const scrollToWorkspace = useCallback(() => {
    const navigation = navigationRef.current
    const workspace = workspaceRef.current
    if (!navigation || !workspace) return
    const top = window.scrollY + workspace.getBoundingClientRect().top - navigation.getBoundingClientRect().height - 12
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
  }, [])

  useLayoutEffect(() => {
    if (!pendingScroll.current) return
    pendingScroll.current = false
    scrollToWorkspace()
  }, [active, scrollToWorkspace])

  function select(next: Key) {
    if (next === active) {
      scrollToWorkspace()
      return
    }
    pendingScroll.current = true
    setActive(next)
  }

  return { active, select, navigationRef, workspaceRef }
}
