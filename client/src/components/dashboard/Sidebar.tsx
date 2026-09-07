import { NavLink } from 'react-router-dom'

import { primaryNavItems, secondaryNavItems } from '../../config/navigation'

const linkBaseClasses = 'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'
const linkInactiveClasses = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
const linkActiveClasses = 'bg-gray-900 text-white hover:bg-gray-900'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return `${linkBaseClasses} ${isActive ? linkActiveClasses : linkInactiveClasses}`
}

// Desktop-only persistent sidebar. Hidden below the lg breakpoint, where
// MobileNav takes over.
export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold text-gray-900">LeadPilot</span>
      </div>

      <nav className="flex-1 space-y-6 px-3 py-4" aria-label="Main navigation">
        <div>
          <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Main</p>
          <ul className="space-y-1">
            {primaryNavItems.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className={navLinkClassName}>
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Other</p>
          <ul className="space-y-1">
            {secondaryNavItems.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className={navLinkClassName}>
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  )
}
