import type { ReactNode } from 'react'

export function Heading({ title, className = '' }: { title: string; className?: string }) {
  const [first, ...rest] = title.split(' ')
  return (
    <h2 className={`text-xl uppercase tracking-[0.3em] font-medium ${className}`}>
      {rest.length > 0 ? (
        <>
          {first} <span className="text-accent">{rest.join(' ')}</span>
        </>
      ) : (
        <span className="text-accent">{first}</span>
      )}
    </h2>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <Heading title={title} className="border-b border-neutral-300 pb-4 mb-6" />
      {children}
    </section>
  )
}

export function Entry({
  heading,
  subheading,
  aside,
  children,
}: {
  heading: string
  subheading?: string
  aside?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline gap-4">
        <h3 className="font-medium text-lg text-ink">{heading}</h3>
        {aside && <span className="text-sm text-ink/60 whitespace-nowrap">{aside}</span>}
      </div>
      {subheading && <div className="italic text-[#717171]/60 text-sm md:text-base">{subheading}</div>}
      {children}
    </div>
  )
}

export function Sheet({ children }: { children: ReactNode }) {
  return <div className="px-10 py-12 sm:px-16">{children}</div>
}

export function Status({ children }: { children: ReactNode }) {
  return <p className="text-ink/60 italic">{children}</p>
}
