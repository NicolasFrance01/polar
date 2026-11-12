import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Route, 
  ClipboardList, 
  Users, 
  Package, 
  Gift, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  ShoppingBag, 
  LogOut,
  ExternalLink,
  Copy,
  Check,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed,
  unreadNotifications,
  mobileOpen,
  setMobileOpen,
  currentUser,
  onLogout
}) {
  const [copiedCliente, setCopiedCliente] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'repartir', label: 'Repartir', icon: Truck, badge: 'Armar Ruta' },
    { id: 'repartos', label: 'Repartos', icon: Route },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'referidos', label: 'Referidos', icon: Gift },
    { id: 'usuarios', label: 'Usuarios', icon: UserCheck },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleCopyClienteLink = () => {
    const url = `${window.location.origin}/cliente`;
    navigator.clipboard?.writeText(url);
    setCopiedCliente(true);
    setTimeout(() => setCopiedCliente(false), 2000);
  };

  const renderContent = (isMobileDrawer = false) => {
    const collapsed = isMobileDrawer ? false : isCollapsed;
    return (
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* Top Brand Header */}
          <div className="h-16 border-b border-gray-100 flex items-center justify-between px-3.5">
            <div 
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer overflow-hidden"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-300 shadow-2xs bg-white flex items-center justify-center p-0.5 flex-shrink-0">
                <img 
                  src="/images/logo-polar.png" 
                  alt="Polar" 
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              {!collapsed && (
                <div className="leading-tight transition-opacity duration-200">
                  <span className="text-[16px] font-black tracking-tight text-[#0c315b] block">
                    POLAR
                  </span>
                  <span className="text-[10px] text-sky-700 block font-bold tracking-wider uppercase">
                    Soda y Agua
                  </span>
                </div>
              )}
            </div>

            {isMobileDrawer ? (
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-[#0c315b] flex items-center justify-center transition"
                title={isCollapsed ? 'Ampliar menú lateral' : 'Comprimir menú'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="p-2 space-y-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all relative ${
                    collapsed ? 'justify-center py-2.5 px-0' : 'space-x-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#e0f2fe] text-[#0c315b] font-bold shadow-2xs border border-[#bae6fd]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0c315b]' : 'text-gray-500'}`} />
                  
                  {!collapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                      {item.badge}
                    </span>
                  )}

                  {collapsed && isActive && (
                    <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-[#0c315b]"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Public Client Link (/cliente) separated from system */}
          <div className="px-2 pt-3 mt-2 border-t border-gray-100 space-y-1.5">
            {!collapsed && (
              <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Link Público Clientes
              </span>
            )}
            <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
              <a
                href="/cliente"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex items-center rounded-xl text-xs font-bold transition-all ${
                  collapsed ? 'justify-center p-2.5' : 'space-x-2 px-3 py-2'
                } bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200`}
                title="Abrir link público /cliente en nueva pestaña"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                {!collapsed && <span className="truncate flex-1 text-left">/cliente</span>}
                {!collapsed && <ExternalLink className="w-3 h-3 text-emerald-600" />}
              </a>

              <button
                type="button"
                onClick={handleCopyClienteLink}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
                title="Copiar link /cliente para enviar al cliente"
              >
                {copiedCliente ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Profile, Notifications and Logout */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <div 
            className={`flex items-center rounded-xl transition ${
              collapsed ? 'justify-center py-2' : 'space-x-3 px-2.5 py-2 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <button className="p-1.5 rounded-lg text-gray-500 hover:text-[#0c315b] hover:bg-gray-100 transition">
                <Bell className="w-4 h-4" />
              </button>
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-600"></span>
              )}
            </div>
            {!collapsed && (
              <div className="text-xs">
                <span className="font-semibold text-gray-700 block">Notificaciones</span>
                <span className="text-[10px] text-gray-400">Sincronizado en vivo</span>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div 
            className={`flex items-center rounded-xl bg-gray-50 border border-gray-200/80 p-2 ${
              collapsed ? 'justify-center' : 'space-x-2.5'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#0c315b] text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs uppercase">
              {(currentUser?.name || currentUser?.username || 'M').charAt(0)}
            </div>
            {!collapsed && (
              <div className="overflow-hidden leading-tight flex-1">
                <span className="font-bold text-gray-900 text-xs block truncate">
                  {currentUser?.name || currentUser?.username || 'Master Admin'}
                </span>
                <span className="text-[10px] text-sky-800 font-semibold block capitalize">
                  {currentUser?.role || 'admin'} · Polar
                </span>
              </div>
            )}
            {!collapsed && onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden md:flex bg-white border-r border-gray-200 h-screen sticky top-0 z-40 flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-2xs ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full z-10 shadow-2xl flex flex-col justify-between overflow-y-auto">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
