import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Parallax — the operating system for your agency'

/**
 * Share card for the marketing page. Rendered by Satori, which supports only a
 * subset of CSS: every element needs an explicit `display`, and the design
 * tokens are inlined as hex because there is no stylesheet in this context.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0c0f16',
          color: '#f5f6f8',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#606cdd',
              display: 'flex',
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 600, display: 'flex' }}>
            Parallax
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 600,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              display: 'flex',
              maxWidth: 900,
            }}
          >
            Run your agency from one workspace.
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#a2a8b8',
              display: 'flex',
              maxWidth: 860,
            }}
          >
            Projects, clients, invoices, and revenue — connected in one place.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['Deliver', 'Bill', 'Collaborate'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                fontSize: 24,
                color: '#c9cedb',
                border: '1px solid #2a2f3d',
                borderRadius: 999,
                padding: '10px 22px',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
