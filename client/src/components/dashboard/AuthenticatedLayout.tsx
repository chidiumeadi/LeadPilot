import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { allNavItems } from '../../config/navigation'
import Header from './Header'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'

// Wraps every authenticated page: Sidebar (desktop) + MobileNav (mobile) +
// Header + the routed page content. Mounted once by the protected route
// tree in App.tsx, not duplicated per page.
export default function AuthenticatedLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  const pageTitle = useMemo(() => {
    const match = allNavItems.find((item) => item.path === location.pathname)
    return match?.label ?? 'Dashboard'
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={pageTitle} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
