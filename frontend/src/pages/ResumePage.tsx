import { useState, type ComponentType, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, LoaderCircle, Mail, MapPin, Phone } from 'lucide-react'
import { api, type Profile, type Resume } from '../api'
import { Section, Heading, Entry, Status, Sheet } from '../components/Section'
import Markdown from '../components/Markdown'
import SocialIcon from '../components/SocialIcon'
import { useTitle } from '../useTitle'
import { fmtRange, prettyUrl } from '../format'

function Photo({ name }: { name: string }) {
  const [missing, setMissing] = useState(false)
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  return (
    <div className="mx-auto w-44 h-44 rounded-full overflow-hidden bg-neutral-300 grid place-items-center">
      {missing ? (
        <span className="font-serif text-5xl text-ink/60">{initials}</span>
      ) : (
        <img
          src="/photo.jpg"
          alt=""
          className="w-full h-full object-cover"
          onError={() => setMissing(true)}
        />
      )}
    </div>
  )
}

function ContactRow({
  icon: Icon,
  href,
  children,
}: {
  icon: ComponentType<{ size?: number }>
  href?: string
  children: ReactNode
}) {
  const inner = href ? (
    <a href={href} className="hover:underline">
      {children}
    </a>
  ) : (
    children
  )
  return (
    <li className="flex items-center gap-4">
      <span className="w-9 h-9 rounded-full bg-accent text-white grid place-items-center shrink-0">
        <Icon size={16} />
      </span>
      <span className="text-sm text-ink/70 break-all">{inner}</span>
    </li>
  )
}

function Contacts({ p }: { p: Profile }) {
  return (
    <ul className="space-y-3">
      {p.phone && <ContactRow icon={Phone}>{p.phone}</ContactRow>}
      {p.email && (
        <ContactRow icon={Mail} href={`mailto:${p.email}`}>
          {p.email}
        </ContactRow>
      )}
      {p.location && <ContactRow icon={MapPin}>{p.location}</ContactRow>}
      {p.socials.map((s) => (
        <ContactRow
          key={s.url}
          icon={(props) => <SocialIcon platform={s.platform} {...props} />}
          href={s.url}
        >
          {s.label || prettyUrl(s.url)}
        </ContactRow>
      ))}
    </ul>
  )
}

function SideHeading({ title }: { title: string }) {
  return <h2 className="text-xl uppercase tracking-[0.3em] font-medium mb-5">{title}</h2>
}

async function downloadPdf(data: Resume) {
  const [{ pdf }, { default: ResumePdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/ResumePdf'),
  ])
  const photo = await fetch('/photo.jpg')
    .then((r) => (r.ok && r.headers.get('content-type')?.startsWith('image/') ? '/photo.jpg' : undefined))
    .catch(() => undefined)
  const blob = await pdf(<ResumePdf data={data} photo={photo} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${data.profile.name.replace(/\s+/g, '-')}-Resume.pdf`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

export default function ResumePage() {
  useTitle('Resume')
  const [busy, setBusy] = useState(false)
  const { data, isPending, error } = useQuery({
    queryKey: ['resume'],
    queryFn: api.resume,
  })
  if (isPending)
    return (
      <Sheet>
        <Status>Loading…</Status>
      </Sheet>
    )
  if (error)
    return (
      <Sheet>
        <Status>Could not load resume: {error.message}</Status>
      </Sheet>
    )
  const { profile, experience, education, proficiencies } = data
  const [first, ...rest] = profile.name.split(' ')

  return (
    <div className="flex-1 grid md:grid-cols-[22rem_1fr] cursor-default">
      <aside className="bg-panel px-8 py-12 space-y-12">
        <div className="text-center">
          <Photo name={profile.name} />
          <h1 className="font-serif text-4xl mt-6 leading-tight">
            {first} {rest.length > 0 && <span className="text-accent">{rest.join(' ')}</span>}
          </h1>
          {profile.title && (
            <p className="uppercase tracking-[0.3em] text-xs text-ink/70 mt-3">{profile.title}</p>
          )}
        </div>

        <div>
          <SideHeading title="Contacts" />
          <Contacts p={profile} />
        </div>

        {education.length > 0 && (
          <div>
            <SideHeading title="Education" />
            {education.map((e) => (
              <div key={e.id} className="mb-5 text-sm">
                <div className="uppercase tracking-wider text-ink">
                  {[e.degree, e.field_of_study].filter(Boolean).join(', ')}
                </div>
                <div className="text-ink/60 mt-1">{e.institution}</div>
                <div className="text-ink/60">{fmtRange(e.start_date, e.end_date)}</div>
                {e.description && <Markdown className="prose-sm mt-1">{e.description}</Markdown>}
              </div>
            ))}
          </div>
        )}

        {proficiencies.length > 0 && (
          <div>
            <SideHeading title="Proficiencies" />
            {proficiencies.map((c) => (
              <div key={c.id} className="mb-4 text-sm">
                <div className="uppercase tracking-wider text-ink">{c.name}</div>
                <div className="text-ink/60 mt-1">{c.items.map((i) => i.name).join(', ')}</div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <div className="relative px-10 py-12 sm:px-14">
        <button
          className="no-print absolute top-4 right-4 p-2 text-ink/60 hover:text-accent disabled:cursor-wait disabled:opacity-40"
          title="Download PDF"
          aria-label="Download PDF"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            downloadPdf(data).finally(() => setBusy(false))
          }}
        >
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}
        </button>
        {profile.summary && (
          <section>
            <Heading title="Overview" className="border-b border-neutral-300 pb-4 mb-6" />
            <p className="text-ink/70 leading-relaxed">{profile.summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <Section title="Experience">
            {experience.map((e) => (
              <Entry
                key={e.id}
                heading={e.role}
                subheading={`${[e.company, e.location].filter(Boolean).join(', ')} | ${fmtRange(e.start_date, e.end_date)}`}
              >
                {e.description && (
                  <Markdown className="mt-2 text-ink/70 [&_li::marker]:text-accent">{e.description}</Markdown>
                )}
              </Entry>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}
