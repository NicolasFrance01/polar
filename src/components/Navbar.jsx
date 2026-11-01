import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Package, 
  Bot, 
  QrCode, 
  Wallet,
  Smartphone,
  ShieldCheck,
  Droplets
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, appMode, setAppMode, alertCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reparto', label: 'Hoja de Ruta (Chofer)', icon: Truck, badge: 'En Vivo' },
    { id: 'clientes', label: 'Clientes y Envases', icon: Users, alertCount: alertCount },
    { id: 'productos', label: 'Productos y Precios', icon: Package },
    { id: 'whatsapp-ai', label: 'WhatsApp IA & QR', icon: Bot, highlight: true },
    { id: 'caja', label: 'Caja y Liquidación', icon: Wallet },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a2544] text-white border-b border-sky-900/60 shadow-lg">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between border-b border-white/10 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sistema Conectado</span>
          </div>
          <span className="text-sky-300/80 hidden sm:inline">|</span>
          <span className="text-sky-200/90 hidden sm:inline font-medium">Planta Central · Reparto Activo</span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-sky-800/60">
          <button
            onClick={() => setAppMode('admin')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              appMode === 'admin' 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-sky-200 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin / Dueño</span>
          </button>

          <button
            onClick={() => {
              setAppMode('driver');
              setActiveTab('reparto');
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              appMode === 'driver' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-sky-200 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Modo Celular Chofer</span>
          </button>

          <button
            onClick={() => {
              setAppMode('client');
              setActiveTab('portal-cliente');
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              appMode === 'client' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-sky-200 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Portal QR Cliente</span>
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-sky-400/80 shadow-md bg-white p-0.5">
              <img 
                src="/images/logo-polar.png" 
                alt="Soda y Agua Polar" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-wider text-white uppercase font-sans">
                  Soda y Agua <span className="text-sky-400">Polar</span>
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  REPARTO CLOUD
                </span>
              </div>
              <p className="text-[11px] text-sky-200/70 font-medium">Trazabilidad de envases y logística</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'reparto') setAppMode('admin');
                  }}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
                    isActive
                      ? 'bg-sky-500/20 text-white border border-sky-400/40 shadow-sm'
                      : 'text-sky-200/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-sky-300/70'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {item.alertCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 font-mono">
                      {item.alertCount}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex overflow-x-auto px-2 py-2 border-t border-sky-800/40 space-x-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-sky-500/30 text-white border border-sky-400/40'
                  : 'text-sky-200/80 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
