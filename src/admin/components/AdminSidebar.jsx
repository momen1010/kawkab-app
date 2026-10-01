import { NavLink } from 'react-router-dom';

const navigationItems = [
  {
    label: 'الرئيسية',
    path: '/admin/dashboard',
    icon: '🏠',
  },
  {
    label: 'الطلبات',
    path: '/admin/orders',
    icon: '📦',
  },
  {
    label: 'المطبخ',
    path: '/admin/kitchen',
    icon: '👨‍🍳',
  },
  {
    label: 'المنتجات',
    path: '/admin/products',
    icon: '🧇',
  },
  {
    label: 'التصنيفات',
    path: '/admin/categories',
    icon: '🗂️',
  },
  {
    label: 'العملاء',
    path: '/admin/customers',
    icon: '👥',
  },
  {
    label: 'التحليلات',
    path: '/admin/analytics',
    icon: '📊',
  },
  {
    label: 'الإعدادات',
    path: '/admin/settings',
    icon: '⚙️',
  },
];

export default function AdminSidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 z-50 h-screen w-72
          bg-[#3D2314] text-white
          transform transition-transform duration-300
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div>
            <h1 className="text-xl font-black">
              هابي درينك
            </h1>

            <p className="mt-1 text-xs text-white/50">
              لوحة الإدارة
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg transition hover:bg-white/20 lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 p-4">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-4
                rounded-xl px-4 py-3.5
                font-bold transition-all
                ${
                  isActive
                    ? 'bg-[#FF6600] text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="text-xl">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 right-0 left-0 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-red-300 transition hover:bg-red-500/10"
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}