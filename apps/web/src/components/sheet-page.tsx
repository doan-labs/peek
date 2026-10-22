/*
 * The white sheet the API and legal pages sit on: the docs' brand and type,
 * a top bar back to the site, and a quiet footer with the legal links.
 */
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { DoanMark } from '@/components/doan-mark'
import { LinkFace } from '@/components/link-face'
import { PeekMark } from '@/components/peek-mark'
import { REPO } from '@/lib/docs'
import { fonts, sheet } from '@/lib/tokens.stylex'

export function SheetPage({ children }: { children: ReactNode }) {
  return (
    <div data-sheet {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.bar)}>
        <div {...stylex.props(styles.brand)}>
          <PeekMark compact />
          <Link to='/' {...stylex.props(styles.brandLink)}>
            Peek
          </Link>
        </div>
        <nav aria-label='Site' {...stylex.props(styles.nav)}>
          <Link to='/docs' {...stylex.props(styles.link, styles.icon)}>
            <LinkFace name='Docs' size={16} />
            Docs
          </Link>
          <Link to='/api-service' {...stylex.props(styles.link, styles.icon)}>
            <LinkFace name='API' size={16} />
            API
          </Link>
          <a
            href={REPO}
            target='_blank'
            rel='noopener'
            {...stylex.props(styles.link, styles.icon)}
          >
            <LinkFace name='GitHub' size={16} />
            GitHub ↗
          </a>
        </nav>
      </header>
      <main {...stylex.props(styles.main)}>{children}</main>
      <footer {...stylex.props(styles.footer)}>
        <a
          href='https://doan-labs.com'
          target='_blank'
          rel='noopener'
          {...stylex.props(styles.link, styles.icon)}
        >
          A product by
          <span {...stylex.props(styles.icon, styles.doan)}>
            <DoanMark size={14} />
            Doan Labs
          </span>
        </a>
        <nav aria-label='Legal' {...stylex.props(styles.nav)}>
          <Link to='/privacy' {...stylex.props(styles.link)}>
            Privacy
          </Link>
          <Link to='/terms' {...stylex.props(styles.link)}>
            Terms
          </Link>
        </nav>
      </footer>
    </div>
  )
}

const HOVER = '@media (hover: hover)'

const styles = stylex.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: sheet['--page'],
    color: sheet['--fg'],
    fontFamily: fonts['--sans'],
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '14px clamp(16px, 4vw, 32px)',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: sheet['--rule'],
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '20px',
    fontWeight: 500,
    letterSpacing: '-0.02em',
  },
  brandLink: { color: 'inherit', textDecoration: 'none' },
  nav: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' },
  link: {
    padding: '6px 8px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    fontSize: '15px',
    textDecoration: 'none',
    color: {
      default: sheet['--soft'],
      [HOVER]: { default: null, ':hover': sheet['--fg'] },
    },
    backgroundColor: {
      default: 'transparent',
      [HOVER]: { default: null, ':hover': sheet['--wash'] },
    },
    transitionProperty: 'color, background-color',
    transitionDuration: '0.15s',
  },
  icon: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  // the name that shows, with its mark, in the page's own ink
  doan: { color: sheet['--fg'] },
  main: {
    flexGrow: 1,
    width: '100%',
    maxWidth: '768px',
    marginInline: 'auto',
    padding: {
      default: '40px 20px 80px',
      '@media (width >= 56rem)': '88px 24px 120px',
    },
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '18px clamp(16px, 4vw, 32px)',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: sheet['--rule'],
  },
})
