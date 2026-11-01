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
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed,
  unreadNotifications,
  onOpenPortalCliente
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'repartir', label: 'Repartir', icon: Truck, badge: 'Ruta' },
    { id: 'repartos', label: 'Repartos', icon: Route },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'referidos', label: 'Referidos', icon: Gift },
    { id: 'usuarios', label: 'Usuarios', icon: UserCheck },
  ];

  return (
    <aside
      className={`bg-white border-r border-gray-200 h-screen sticky top-0 z-40 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-2xs ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Brand Header */}
      <div>
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-3.5">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-300 shadow-2xs bg-white flex items-center justify-center p-0.5 flex-shrink-0">
              <img 
                src="/images/logo-polar.png" 
                alt="Polar" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            {!isCollapsed && (
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

          {/* Compress / Expand Arrow Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-[#0c315b] flex items-center justify-center transition"
            title={isCollapsed ? 'Ampliar menú lateral' : 'Comprimir menú'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="p-2 space-y-1 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all relative ${
                  isCollapsed ? 'justify-center py-2.5 px-0' : 'space-x-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#e0f2fe] text-[#0c315b] font-bold shadow-2xs border border-[#bae6fd]'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0c315b]' : 'text-gray-500'}`} />
                
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    {item.badge}
                  </span>
                )}

                {isCollapsed && isActive && (
                  <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-[#0c315b]"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dedicated Client Order Portal Link */}
        <div className="px-2 pt-3 mt-2 border-t border-gray-100">
          <button
            onClick={onOpenPortalCliente}
            className={`w-full flex items-center rounded-xl text-xs font-bold transition-all ${
              isCollapsed ? 'justify-center py-2.5' : 'space-x-2.5 px-3 py-2.5'
            } bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200`}
            title={isCollapsed ? 'Portal de Pedidos para Clientes' : undefined}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            {!isCollapsed && (
              <span className="truncate flex-1 text-left">Hacer Pedido (Cliente)</span>
            )}
            {!isCollapsed && <ExternalLink className="w-3 h-3 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Bottom Profile and Notifications matching user request */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        
        {/* Notification Bell */}
        <div 
          className={`flex items-center rounded-xl transition ${
            isCollapsed ? 'justify-center py-2' : 'space-x-3 px-2.5 py-2 hover:bg-gray-50'
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
          {!isCollapsed && (
            <div className="text-xs">
              <span className="font-semibold text-gray-700 block">Notificaciones</span>
              <span className="text-[10px] text-gray-400">3 pedidos entrantes</span>
            </div>
          )}
        </div>

        {/* User Profile avatar */}
        <div 
          className={`flex items-center rounded-xl bg-gray-50 border border-gray-200/80 p-2 ${
            isCollapsed ? 'justify-center' : 'space-x-2.5'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#0c315b] text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
            P
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden leading-tight flex-1">
              <span className="font-bold text-gray-900 text-xs block truncate">
                Nicolás France
              </span>
              <span className="text-[10px] text-sky-800 font-semibold block">
                Dueño · Polar
              </span>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
