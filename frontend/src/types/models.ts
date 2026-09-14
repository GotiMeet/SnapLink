/**
 * Domain models exactly as the backend serializes them.
 *
 * These mirror `sanitizeUser` and `sanitizeShortUrl`, which strip `password`
 * and `__v` and pass everything else through. Do not add fields the API does
 * not return — PROJECT_MASTER.md section 4 is the contract.
 */

export type AuthProvider = 'local' | 'google';
export type AccountStatus = 'active' | 'suspended';
export type Role = 'user' | 'admin';

export type UrlStatus = 'active' | 'inactive' | 'deleted_link' | 'deleted_project';
export type Visibility = 'public' | 'private';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  authProvider: AuthProvider;
  providerId: string | null;
  profilePicture: string | null;
  isEmailVerified: boolean;
  accountStatus: AccountStatus;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  owner: string;
  title: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShortUrl {
  _id: string;
  project: string;
  owner: string;
  title: string;
  originalUrl: string;
  shortCode: string;
  isCustomAlias: boolean;
  visibility: Visibility;
  status: UrlStatus;
  scheduledLiveAt: string | null;
  scheduledDeleteAt: string | null;
  deletedAt: string | null;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Lifetime total. Always equals `clicks + qrScans`. */
  clickCount: number;
  /** Lifetime web-redirect visits. */
  clicks: number;
  /** Lifetime QR visits, counted from the `?src=qr` marker. */
  qrScans: number;
}

/** A `{ name, count }` pair used by every categorical analytics breakdown. */
export interface BreakdownItem {
  name: string;
  count: number;
}

export interface AnalyticsRange {
  from: string;
  to: string;
}

export interface AnalyticsOverview {
  clicks: number;
  qrScans: number;
  totalVisits: number;
  daysWithVisits: number;
  firstVisitOn: string | null;
  lastVisitOn: string | null;
}

/**
 * One day of traffic. The API omits days with no visits entirely, so the
 * client must zero-fill the window before charting — PROJECT_MASTER.md
 * section 10 and known limitation "Timeline omits zero-visit days".
 */
export interface TimelinePoint {
  date: string;
  clicks: number;
  qrScans: number;
  totalVisits: number;
}

/** Composite payload from `GET /analytics/:urlId`. Languages live only here. */
export interface AnalyticsReport {
  range: AnalyticsRange;
  overview: AnalyticsOverview;
  timeline: TimelinePoint[];
  browsers: BreakdownItem[];
  operatingSystems: BreakdownItem[];
  devices: BreakdownItem[];
  referrers: BreakdownItem[];
  languages: BreakdownItem[];
}
