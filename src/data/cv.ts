// Loads the merged CV data (cv.yaml + OpenAlex citations) that the build
// pipeline writes to public/cv-data.json. Run `npm run data` first
// (the predev / prebuild scripts do this automatically).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Resolved from the project root (where the build runs), not the module
// location — the latter moves into dist/ when Astro bundles for production.
const DATA_PATH = resolve(process.cwd(), 'public/cv-data.json');

export interface Link { label: string; url: string; }
export interface Profile {
  name: string;
  credential?: string;
  title: string;
  affiliation: string;
  location: string;
  tagline?: string;
  email?: string;
  openalex_author_id?: string;
  links: Link[];
}
export interface Position {
  org: string; unit?: string; title: string; location?: string;
  start: number; end: number | null;
}
export interface Education {
  degree: string; institution: string; date: number | string;
  thesis_title?: string; advisors?: string[];
}
export interface Award { date: string; title: string; detail?: string; }
export interface AdminInitiative { years: string; description: string; }
export interface Publication {
  category: 'journal' | 'other' | 'working';
  authors: string; year?: number; title: string; venue?: string;
  volume?: string; issue?: string; pages?: string; doi?: string;
  url?: string; note?: string; citations?: number;
}
export interface Repository { url: string; description: string; }
export interface EditorialRole { role: string; years: string; }
export interface Editorial { journal: string; roles: EditorialRole[]; }
export interface DoctoralStudent {
  name: string; institution: string; role: string; year: string; placement?: string;
}
export interface SocietyLeadership { org: string; roles: string[]; }
export interface AdvisoryBoard { org: string; url?: string; role: string; start: number; end?: number | null; }
export interface InvitedTalk { title: string; venues: string; }
export interface TeachingRow { semester: string; course: string; role: string; rating: string; }
export interface Metrics {
  cited_by_count?: number; works_count?: number;
  h_index?: number; i10_index?: number;
}
export interface CV {
  profile: Profile;
  positions: Position[];
  education: Education[];
  awards: Award[];
  admin_initiatives: AdminInitiative[];
  publications: Publication[];
  repositories: Repository[];
  websites: Repository[];
  editorial: Editorial[];
  ad_hoc_reviewing?: string;
  doctoral_students: DoctoralStudent[];
  society_leadership: SocietyLeadership[];
  advisory_boards: AdvisoryBoard[];
  prize_committees: string[];
  invited_talks: InvitedTalk[];
  teaching_note?: string;
  teaching: TeachingRow[];
  metrics: Metrics;
  generated_at?: string;
}

export const cv: CV = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

/** "2021–" or "2018–2024". */
export const yearRange = (start: number, end: number | null): string =>
  end == null ? `${start}–` : start === end ? `${start}` : `${start}–${end}`;

export const pubsByCategory = (cat: Publication['category']): Publication[] =>
  cv.publications.filter((p) => p.category === cat);

/** Section registry drives both the nav and the page order. */
export const SECTIONS: { id: string; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'positions', label: 'Appointments' },
  { id: 'education', label: 'Education' },
  { id: 'publications', label: 'Publications' },
  { id: 'working-papers', label: 'Working Papers' },
  { id: 'awards', label: 'Awards & Grants' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'service', label: 'Service' },
  { id: 'advisory', label: 'Advisory Boards' },
  { id: 'students', label: 'Doctoral Students' },
  { id: 'talks', label: 'Invited Talks' },
  { id: 'teaching', label: 'Teaching' },
  { id: 'software', label: 'Software & Sites' },
  { id: 'leadership', label: 'Administration' },
];
