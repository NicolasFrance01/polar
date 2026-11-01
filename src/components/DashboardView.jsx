import React from 'react';
import { 
  ShieldAlert, 
  Package, 
  Truck, 
  DollarSign, 
  AlertTriangle, 
  MessageCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Layers,
  Sparkles,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { POLAR_PRODUCTS } from '../data/mockData';

export default function DashboardView({ clients, todayRoute, onNavigateToRoute, onSendWhatsApp }) {
  // Compute KPIs
  const totalContainersInStreet = clients.reduce(
    (acc, c) => ({
      bidon_20l: acc.bidon_20l + (c.containers.bidon_20l || 0),
      bidon_12l: acc.bidon_12l + (c.containers.bidon_12l || 0),
      sifon_15l: acc.sifon_15l + (c.containers.sifon_15l || 0),
      dispenser_fc: acc.dispenser_fc + (c.containers.dispenser_fc || 0),
    }),
    { bidon_20l: 0, bidon_12l: 0, sifon_15l: 0, dispenser_fc: 0 }
  );

  const totalDebt = clients.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const inactiveClientsWithContainers = clients.filter(c => c.daysSinceLastOrder >= 14 && (c.containers.bidon_20l > 0 || c.containers.bidon_12l > 0 || c.containers.dispenser_fc > 0));

  const totalDeliveredToday = todayRoute.filter(r => r.status === 'entregado').length;
  const totalStops = todayRoute.length;
  const routeProgress = Math.round((totalDeliveredToday / (totalStops || 1)) * 100);

  const cashToday = todayRoute.reduce((sum, r) => sum + (r.status === 'entregado' ? (r.collectedAmount || 0) : 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a2544] via-[#0c315b] to-[#0284c7] p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Control Logístico Inteligente</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Soda y Agua <span className="text-sky-300">POLAR</span>
            </h2>
            <p className="text-sm text-sky-100/90 max-w-xl">
              Monitoreo en tiempo real de bidones en la calle, cobros diarios del camión y clientes inactivos para recuperar envases.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onNavigateToRoute}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm flex items-center space-x-2 hover:bg-sky-50 transition shadow-md"
            >
              <Truck className="w-4 h-4 text-sky-600" />
              <span>Ver Hoja de Ruta ({totalDeliveredToday}/{totalStops})</span>
            </button>
          </div>
        </div>

        {/* Subtle background graphics */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Envases en la Calle */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bidones en la Calle</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">
              {totalContainersInStreet.bidon_20l + totalContainersInStreet.bidon_12l}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Activos
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Bidones 20L:</span>
              <strong className="text-slate-800 font-bold">{totalContainersInStreet.bidon_20l} un.</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Bidones 12L:</span>
              <strong className="text-slate-800 font-bold">{totalContainersInStreet.bidon_12l} un.</strong>
            </div>
          </div>
        </div>

        {/* KPI 2: Dispensers y Sifones */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Comodatos y Soda</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalContainersInStreet.dispenser_fc}</span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Dispensers F/C
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Sifones 1.5L prestados:</span>
              <strong className="text-slate-800 font-bold">{totalContainersInStreet.sifon_15l} sifones</strong>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium self-end">Trazabilidad OK</span>
          </div>
        </div>

        {/* KPI 3: Recaudación del Reparto de Hoy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Caja Reparto Hoy</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">${cashToday.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Cobrado
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Progreso recorrido:</span>
            <span className="font-bold text-sky-700">{routeProgress}% ({totalDeliveredToday}/{totalStops})</span>
          </div>
        </div>

        {/* KPI 4: Deudores en Cuenta Corriente */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fiados / Cta. Cte.</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600">${totalDebt.toLocaleString()}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              Por cobrar
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>En 2 clientes activos</span>
            <span className="text-amber-600 font-bold">Ver deudores</span>
          </div>
        </div>
      </div>

      {/* KILLER FEATURE SECTION: Alerta de Recuperación de Envases Retenidos */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                Recuperación de Envases Inactivos
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                  {inactiveClientsWithContainers.length} Alertas
                </span>
              </h3>
              <p className="text-xs text-amber-800">
                Clientes que llevan más de 14 días sin pedir y aún retienen bidones o dispensers de Soda y Agua Polar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inactiveClientsWithContainers.map((client) => {
            const totalRetained = (client.containers.bidon_20l || 0) + (client.containers.bidon_12l || 0);
            return (
              <div 
                key={client.id}
                className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {client.address} ({client.neighborhood})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Hace {client.daysSinceLastOrder} días no pide
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bidones 20L:</span>
                      <strong className="text-slate-900 font-bold">{client.containers.bidon_20l}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bidones 12L:</span>
                      <strong className="text-slate-900 font-bold">{client.containers.bidon_12l}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dispenser F/C:</span>
                      <strong className="text-slate-900 font-bold">{client.containers.dispenser_fc}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Valor envases: <strong className="text-slate-800 font-semibold">${(totalRetained * 8500).toLocaleString()}</strong>
                  </span>
                  <button
                    onClick={() => onSendWhatsApp(client)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Reclamar / Ofrecer Recarga</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catálogo Oficial Polar Showcase */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Catálogo de Productos Polar</h3>
            <p className="text-xs text-slate-500">Imágenes oficiales y existencias en depósito vs en camión</p>
          </div>
          <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
            4 Productos Activos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POLAR_PRODUCTS.map((prod) => (
            <div 
              key={prod.id} 
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 flex flex-col justify-between hover:border-sky-300 transition"
            >
              <div className="h-44 bg-white flex items-center justify-center p-3 border-b border-slate-100">
                <img 
                  src={prod.image} 
                  alt={prod.name} 
                  className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-200"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded">
                    {prod.category} · {prod.size}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{prod.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Precio</span>
                    <strong className="text-base font-extrabold text-slate-900">
                      ${prod.price.toLocaleString()}
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Stock Camión</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-600 text-white font-bold text-xs">
                      {prod.stockCamion} un.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
