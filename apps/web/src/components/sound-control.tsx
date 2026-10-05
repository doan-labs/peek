/* An explicit opt-in, placed with the hero's corner labels. */
import * as stylex from '@stylexjs/stylex'
import { useEffect, useSyncExternalStore } from 'react'
import {
  playSound,
  setSound,
  soundEnabled,
  soundServerSnapshot,
  watchSound,
} from '@/lib/sound'
import { colors, fonts } from '@/lib/tokens.stylex'

const styles = stylex.create({
  control: {
    position: 'fixed',
    top: {
      default: 'clamp(16px, 3.3vw, 40px)',
      '@media (max-width: 480px)': '64px',
    },
    right: 'clamp(16px, 3.3vw, 40px)',
    zIndex: 10,
    minHeight: '44px',
    padding: '0 0.75rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors['--muted'],
    borderRadius: '4px',
    backgroundColor: colors['--ground'],
    color: colors['--bone'],
    fontFamily: fonts['--mono'],
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
})

export function SoundControl() {
  const on = useSyncExternalStore(watchSound, soundEnabled, soundServerSnapshot)
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const action = event.target.closest('button, a[href], [role="button"]')
      if (
        !action ||
        action.hasAttribute('data-sound-control') ||
        action.hasAttribute('data-sound-cue')
      )
        return
      if (action instanceof HTMLButtonElement && action.disabled) return
      playSound('click')
    }
    document.addEventListener('click', click)
    const hide = () => {
      if (document.hidden) setSound(false)
    }
    document.addEventListener('visibilitychange', hide)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      document.removeEventListener('click', click)
      setSound(false)
    }
  }, [])
  return (
    <button
      type='button'
      data-sound-control
      aria-pressed={on}
      onClick={() => setSound(!on)}
      {...stylex.props(styles.control)}
    >
      Sound {on ? 'on' : 'off'}
    </button>
  )
}
