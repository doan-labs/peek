/*
 * /privacy and /terms: plain text on the sheet, in the docs' type. Each
 * page passes its title, its last updated date and its sections, where
 * `[text](href)` marks a link.
 */
import * as stylex from '@stylexjs/stylex'
import { SheetPage } from '@/components/sheet-page'
import { sheet } from '@/lib/tokens.stylex'

export type LegalSection = { h: string; body: string[] }

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string
  /** Shown as written, e.g. "22 October 2026". */
  updated: string
  sections: LegalSection[]
}) {
  return (
    <SheetPage>
      <article>
        <h1 {...stylex.props(styles.h1)}>{title}</h1>
        <p {...stylex.props(styles.updated)}>Last updated {updated}</p>
        {sections.map((s) => (
          <section key={s.h}>
            <h2 {...stylex.props(styles.h2)}>{s.h}</h2>
            {s.body.map((t) => (
              <p key={t} {...stylex.props(styles.p)}>
                <Linked text={t} />
              </p>
            ))}
          </section>
        ))}
      </article>
    </SheetPage>
  )
}

/** `[text](href)` becomes a link; one off the site opens in a new tab. */
function Linked({ text }: { text: string }) {
  return text.split(/\[([^\]]+)\]\(([^)]+)\)/).map((s, i, all) => {
    if (i % 3 === 0) return s
    if (i % 3 === 2) return null
    const href = all[i + 1]!
    const away = href.startsWith('http')
    return (
      <a
        key={i}
        href={href}
        {...(away ? { target: '_blank', rel: 'noopener' } : {})}
        {...stylex.props(styles.a)}
      >
        {s}
      </a>
    )
  })
}

const styles = stylex.create({
  a: {
    color: 'inherit',
    textDecorationColor: sheet['--rule-strong'],
    textUnderlineOffset: '3px',
    transitionProperty: 'text-decoration-color',
    transitionDuration: '0.15s',
    ':hover': { textDecorationColor: sheet['--fg'] },
  },
  h1: {
    fontSize: '30px',
    fontWeight: 500,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  updated: { marginTop: '8px', fontSize: '15px', color: sheet['--quiet'] },
  h2: {
    marginTop: '40px',
    marginBottom: 0,
    fontSize: '20px',
    fontWeight: 500,
    letterSpacing: '-0.015em',
  },
  p: { marginTop: '12px', fontSize: '16px', lineHeight: 1.75 },
})
