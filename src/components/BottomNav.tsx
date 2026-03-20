import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', icon: '🗺️', label: 'Mappa' },
  { to: '/tracks', icon: '📁', label: 'Tracce' },
  { to: '/guide', icon: '📖', label: 'Guida' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
