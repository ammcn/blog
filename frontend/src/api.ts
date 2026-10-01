export type Platform =
  'website' | 'github' | 'linkedin' | 'x' | 'bluesky' | 'mastodon' | 'instagram' | 'youtube' | 'other'

export interface SocialLink {
  platform: Platform
  label: string
  url: string
}

export interface Profile {
  name: string
  title: string
  summary: string
  email: string
  phone: string
  location: string
  socials: SocialLink[]
}

export interface Experience {
  id: number
  company: string
  role: string
  location: string
  start_date: string
  end_date: string | null
  description: string
}

export interface Education {
  id: number
  institution: string
  degree: string
  field_of_study: string
  start_date: string | null
  end_date: string | null
  description: string
}

export interface ProficiencyCategory {
  id: number
  name: string
  items: { id: number; name: string; level: number }[]
}

export interface Resume {
  profile: Profile
  experience: Experience[]
  education: Education[]
  proficiencies: ProficiencyCategory[]
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  resume: () => get<Resume>('/resume/'),
}
