import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/stylesheet'
import type { Resume } from '../api'
import { fmtRange } from '../format'

const gold = '#cc8a3a'
const ink = '#3a3a3a'
const muted = '#6b6b6b'

const s = StyleSheet.create({
  page: { flexDirection: 'row', fontFamily: 'Helvetica', fontSize: 9.5, color: ink, lineHeight: 1.45 },
  side: { width: '33%', backgroundColor: '#e8e8e8', padding: 24, paddingTop: 32 },
  main: { flex: 1, padding: 28, paddingTop: 32 },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 14,
    objectFit: 'cover',
  },
  initials: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 14,
    backgroundColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontFamily: 'Times-Roman', fontSize: 22, textAlign: 'center', lineHeight: 1.2 },
  title: { fontSize: 7.5, letterSpacing: 2.5, textAlign: 'center', color: muted, marginTop: 6 },
  sideHead: { fontSize: 11, letterSpacing: 3, marginTop: 22, marginBottom: 10 },
  mainHead: {
    fontSize: 13,
    letterSpacing: 3.5,
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 0.75,
    borderBottomColor: '#cfcfcf',
  },
  gold: { color: gold },
  contact: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: gold, marginRight: 8 },
  small: { fontSize: 8.5, color: muted },
  caps: { fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', marginTop: 8 },
  role: { fontSize: 11.5, marginTop: 4 },
  sub: { color: muted, marginBottom: 4 },
  bullet: { flexDirection: 'row', marginLeft: 6, marginBottom: 2 },
  body: { color: '#555' },
  section: { marginBottom: 16 },
})

function Head({ title, style }: { title: string; style: Style }) {
  const [first, ...rest] = title.split(' ')
  if (rest.length === 0) return <Text style={[style, s.gold]}>{first}</Text>
  return (
    <Text style={style}>
      {first} <Text style={s.gold}>{rest.join(' ')}</Text>
    </Text>
  )
}

function Description({ md }: { md: string }) {
  const lines = md
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => ({ bullet: /^[-*]\s/.test(l), text: l.replace(/^[-*]\s+/, '').replace(/[*_`]/g, '') }))
  return (
    <View>
      {lines.map((l, i) =>
        l.bullet ? (
          <View key={i} style={s.bullet}>
            <Text style={[s.gold, { marginRight: 6 }]}>•</Text>
            <Text style={[s.body, { flex: 1 }]}>{l.text}</Text>
          </View>
        ) : (
          <Text key={i} style={[s.body, { marginBottom: 3 }]}>
            {l.text}
          </Text>
        ),
      )}
    </View>
  )
}

const strip = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

export default function ResumePdf({ data, photo }: { data: Resume; photo?: string }) {
  const { profile: p, experience, education, proficiencies } = data
  const [first, ...rest] = p.name.split(' ')
  const contacts: [string, string?][] = [
    [p.phone],
    [p.email, `mailto:${p.email}`],
    [p.location],
    ...p.socials.map((l): [string, string?] => [l.label || strip(l.url), l.url]),
  ]
  return (
    <Document title={`${p.name} – Resume`} author={p.name}>
      <Page size="LETTER" style={s.page}>
        <View style={s.side}>
          {photo ? (
            <Image src={photo} style={s.photo} />
          ) : (
            <View style={s.initials}>
              <Text style={{ fontFamily: 'Times-Roman', fontSize: 28, color: muted }}>
                {p.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
          )}
          <Text style={s.name}>
            {first} {rest.length > 0 && <Text style={s.gold}>{rest.join(' ')}</Text>}
          </Text>
          {p.title && <Text style={s.title}>{p.title.toUpperCase()}</Text>}

          <Text style={s.sideHead}>CONTACTS</Text>
          {contacts
            .filter(([label]) => label)
            .map(([label, href]) => (
              <View key={label} style={s.contact}>
                <View style={s.dot} />
                {href ? (
                  <Link src={href} style={[s.small, { textDecoration: 'none' }]}>
                    {label}
                  </Link>
                ) : (
                  <Text style={s.small}>{label}</Text>
                )}
              </View>
            ))}

          {education.length > 0 && (
            <>
              <Text style={s.sideHead}>EDUCATION</Text>
              {education.map((e) => (
                <View key={e.id} style={{ marginBottom: 8 }}>
                  <Text style={[s.caps, { marginTop: 0 }]}>
                    {[e.degree, e.field_of_study].filter(Boolean).join(', ')}
                  </Text>
                  <Text style={s.small}>{e.institution}</Text>
                  <Text style={s.small}>{fmtRange(e.start_date, e.end_date)}</Text>
                </View>
              ))}
            </>
          )}

          {proficiencies.length > 0 && (
            <>
              <Text style={s.sideHead}>PROFICIENCIES</Text>
              {proficiencies.map((c) => (
                <View key={c.id} style={{ marginBottom: 6 }}>
                  <Text style={[s.caps, { marginTop: 0 }]}>{c.name}</Text>
                  <Text style={s.small}>{c.items.map((i) => i.name).join(', ')}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={s.main}>
          {p.summary && (
            <View style={s.section}>
              <Head title="OVERVIEW" style={s.mainHead} />
              <Text style={s.body}>{p.summary}</Text>
            </View>
          )}
          {experience.length > 0 && (
            <View style={s.section}>
              <Head title="EXPERIENCE" style={s.mainHead} />
              {experience.map((e) => (
                <View key={e.id} style={{ marginBottom: 10 }} wrap={false}>
                  <Text style={s.role}>{e.role}</Text>
                  <Text style={s.sub}>
                    {[e.company, e.location].filter(Boolean).join(', ')} |{' '}
                    {fmtRange(e.start_date, e.end_date)}
                  </Text>
                  {e.description && <Description md={e.description} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
