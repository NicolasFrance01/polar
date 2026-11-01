import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Route, 
  ClipboardList, 
  Users, 
  Package, 
  Gift, 
  UserCheck, 
  Bell,
  Smartphone,
  Monitor
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  viewMode, 
  setViewMode 
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'repartir', label: 'Repartir', icon: Truck },
    { id: 'repartos', label: 'Repartos', icon: Route },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'referidos', label: 'Referidos', icon: Gift },
    { id: 'usuarios', label: 'Usuarios', icon: UserCheck },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        
        {/* Brand: Logo + Name */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-300 shadow-xs bg-white flex items-center justify-center p-0.5">
            <img 
              src="/images/logo-polar.png" 
              alt="Polar" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="leading-none">
            <span className="text-[17px] font-black tracking-tight text-[#0c315b]">
              POLAR
            </span>
            <span className="text-[10px] text-sky-700 block font-semibold tracking-wider uppercase">
              Reparto
            </span>
          </div>
        </div>

        {/* Center: Navigation Pills (matches Reparto Cloud navbar) */}
        <nav className="hidden lg:flex items-center space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-[13px] transition-all ${
                  isActive
                    ? 'bg-[#e0f2fe] text-[#0c315b] font-semibold border border-[#bae6fd]'
                    : 'text-gray-600 hover:text-[#0c315b] hover:bg-gray-100 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0c315b]' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side: View Mode Toggle (Mobile/Desktop preview) + Notifications + User Avatar */}
        <div className="flex items-center space-x-3">
          
          {/* Quick toggle to see Mobile driver view vs Desktop */}
          <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center space-x-1 transition ${
                viewMode === 'desktop'
                  ? 'bg-white text-[#0c315b] shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista de escritorio"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => {
                setViewMode('mobile');
                setActiveTab('repartir');
              }}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center space-x-1 transition ${
                viewMode === 'mobile'
                  ? 'bg-[#0c315b] text-white shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista móvil chofer (como en el celular)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Celular</span>
            </button>
          </div>

          {/* Bell Icon */}
          <button 
            className="p-2 text-gray-500 hover:text-[#0c315b] hover:bg-gray-100 rounded-full transition relative"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-600"></span>
          </button>

          {/* User Avatar circle like in Reparto (Orange 'S' -> Polar Navy 'P') */}
          <div 
            className="w-8 h-8 rounded-full bg-[#0c315b] text-white font-bold text-sm flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90 transition"
            title="Soda y Agua Polar - Administrador"
          >
            P
          </div>
        </div>

      </div>

      {/* Mobile horizontal navigation bar */}
      <div className="lg:hidden flex overflow-x-auto px-3 py-2 border-t border-gray-100 space-x-1 scrollbar-none bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                isActive
                  ? 'bg-[#e0f2fe] text-[#0c315b] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
