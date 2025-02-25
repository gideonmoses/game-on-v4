import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export default function SelectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AuthenticatedHeader />
      <main className="pt-16 pb-20">
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
} 