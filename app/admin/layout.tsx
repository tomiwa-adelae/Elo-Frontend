import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"
import { getStoreSettings } from "@/lib/api-server"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await getStoreSettings()
  return <AdminShell storeName={store.name}>{children}</AdminShell>
}
