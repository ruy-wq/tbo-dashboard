// Feature #73 — Error boundary isolado para sub-rota newsletter

import { TabErrorBoundary } from "@/components/shared";

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return <TabErrorBoundary fallbackLabel="Newsletter">{children}</TabErrorBoundary>;
}
