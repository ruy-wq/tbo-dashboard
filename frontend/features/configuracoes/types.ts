import { z } from "zod"

export interface ProfilePreferences {
  bio?: string
  workspace?: {
    name?: string
    logo_url?: string
    tagline?: string
    industry?: string
    website?: string
    primary_color?: string
  }
  notifications?: NotificationPrefs
  appearance?: AppearancePrefs
  [key: string]: unknown
}

/** Safely extract typed preferences from a profile row's Json field */
export function parsePreferences(raw: unknown): ProfilePreferences {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ProfilePreferences
  }
  return {}
}

// ── Notification preferences ────────────────────────────────────────────────

export const NotificationPrefsSchema = z.object({
  email_enabled: z.boolean(),
  push_enabled: z.boolean(),
  projetos: z.boolean(),
  tarefas: z.boolean(),
  financeiro: z.boolean(),
  comercial: z.boolean(),
  reunioes: z.boolean(),
  okrs: z.boolean(),
  reconhecimentos: z.boolean(),
  mention: z.boolean(),
  assignment: z.boolean(),
  deadline: z.boolean(),
  status_change: z.boolean(),
  comment: z.boolean(),
})

export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  email_enabled: true,
  push_enabled: true,
  projetos: true,
  tarefas: true,
  financeiro: false,
  comercial: false,
  reunioes: true,
  okrs: false,
  reconhecimentos: true,
  mention: true,
  assignment: true,
  deadline: true,
  status_change: false,
  comment: true,
}

/** Parse notification prefs from unknown profile row with safe defaults. */
export function parseNotificationPrefs(
  profile: unknown,
): NotificationPrefs {
  const prefs = parsePreferences(
    isRecord(profile) ? profile.preferences : undefined,
  )
  const raw = prefs.notifications
  if (!raw || typeof raw !== "object") return DEFAULT_NOTIFICATION_PREFS
  const parsed = NotificationPrefsSchema.partial().safeParse(raw)
  if (!parsed.success) return DEFAULT_NOTIFICATION_PREFS
  return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed.data }
}

// ── Appearance preferences ──────────────────────────────────────────────────

export const AppearancePrefsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  density: z.enum(["compact", "default", "comfortable"]),
})

export type AppearancePrefs = z.infer<typeof AppearancePrefsSchema>

export const DEFAULT_APPEARANCE_PREFS: AppearancePrefs = {
  theme: "system",
  density: "default",
}

export function parseAppearancePrefs(profile: unknown): AppearancePrefs {
  const prefs = parsePreferences(
    isRecord(profile) ? profile.preferences : undefined,
  )
  const raw = prefs.appearance
  if (!raw || typeof raw !== "object") return DEFAULT_APPEARANCE_PREFS
  const parsed = AppearancePrefsSchema.partial().safeParse(raw)
  if (!parsed.success) return DEFAULT_APPEARANCE_PREFS
  return { ...DEFAULT_APPEARANCE_PREFS, ...parsed.data }
}

// ── Audit log metadata ──────────────────────────────────────────────────────

export const AuditLogMetadataSchema = z
  .object({
    changed_fields: z.record(z.string(), z.unknown()).optional(),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
    reason: z.string().optional(),
  })
  .passthrough()

export type AuditLogMetadata = z.infer<typeof AuditLogMetadataSchema>

/** Safely parse audit log metadata; returns null when shape is invalid. */
export function parseAuditMetadata(raw: unknown): AuditLogMetadata | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== "object" || Array.isArray(raw)) return null
  const parsed = AuditLogMetadataSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}
