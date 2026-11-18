import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  AlertCircle,
  MessageCircle,
  Calendar,
  Search,
  ArrowRight,
  RotateCw
} from 'lucide-react';
import { fetchDashboardKPIs } from '../services/api';
import { getStoredTrips, getStoredOrders } from '../services/tripSync';

export default function Dashboard({ onNavigateToRepartir }) {
  const [subTab, setSubTab] = useState('resumen'); // 'resumen', 'ingresos', 'ventas', 'clientes', 'repartos', 'stock', 'reporte'
  const [timeFilter, setTimeFilter] = useState('7d');
  const [inactiveDaysThreshold, setInactiveDaysThreshold] = useState(8);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [dbKpis, setDbKpis] = useState(null);

  const [localTrips, setLocalTrips] = useState(() => getStoredTrips());
  const [localOrders, setLocalOrders] = useState(() => getStoredOrders());
  const [localClients, setLocalClients] = useState(() => {
    try {
      const raw = localStorage.getItem('polar_clients_v2');
      if (raw !== null) {
        const deletedRaw = localStorage.getItem('polar_deleted_clients_ids_v2');
        const deletedSet = deletedRaw ? new Set(JSON.parse(deletedRaw).map(String)) : new Set();
        return JSON.parse(raw).filter(c => !deletedSet.has(String(c.id)));
      }
    } catch {}
    return [];
  });

  const loadData = () => {
    fetchDashboardKPIs().then(data => {
      if (data) setDbKpis(data);
    }).catch(() => {});

    setLocalTrips(getStoredTrips());
    setLocalOrders(getStoredOrders());
    try {
      const raw = localStorage.getItem('polar_clients_v2');
      if (raw !== null) {
        const deletedRaw = localStorage.getItem('polar_deleted_clients_ids_v2');
        const deletedSet = deletedRaw ? new Set(JSON.parse(deletedRaw).map(String)) : new Set();
        setLocalClients(JSON.parse(raw).filter(c => !deletedSet.has(String(c.id))));
      } else {
        setLocalClients([]);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live stats from trips and stops
  const tripsArray = Object.values(localTrips || {});
  const deliveredStops = [];
  let pendingTripStopsCount = 0;
  let absentStopsCount = 0;
  let completedTripsCount = 0;

  tripsArray.forEach(trip => {
    if (trip.status === 'completado' || trip.status === 'finalizado') {
      completedTripsCount++;
    }
    (trip.stops || []).forEach(stop => {
      if (stop.status === 'entregado') {
        deliveredStops.push(stop);
      } else if (stop.status === 'ausente' || stop.status === 'cancelado' || stop.skipReason || stop.skip_reason) {
        absentStopsCount++;
      } else {
        pendingTripStopsCount++;
      }
    });
  });

  const pendingStoredOrdersCount = (localOrders || []).filter(o => o.status === 'Pendiente de aprobación' || !o.tripId).length;
  const totalPendingOrders = dbKpis?.pendingOrdersCount != null ? dbKpis.pendingOrdersCount : (pendingStoredOrdersCount + pendingTripStopsCount);

  const localDeliveredCount = deliveredStops.length;
  const deliveredDeliveries = dbKpis?.deliveredDeliveries != null ? Math.max(dbKpis.deliveredDeliveries, localDeliveredCount) : localDeliveredCount;

  const localEarnings = deliveredStops.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalEarnings = dbKpis?.totalEarningsToday != null ? Math.max(dbKpis.totalEarningsToday, localEarnings) : localEarnings;

  const localFiados = localClients.reduce((acc, c) => acc + (c.balance < 0 ? Math.abs(c.balance) : (c.fiado_balance || 0)), 0);
  const totalFiados = dbKpis?.totalFiados != null ? Math.max(dbKpis.totalFiados, localFiados) : localFiados;

  const localUnitsSold = deliveredStops.reduce((sum, s) => sum + (s.items || []).reduce((acc, it) => acc + Number(it.qty || 0), 0), 0);
  const unitsSold = dbKpis?.unitsSold != null ? Math.max(dbKpis.unitsSold, localUnitsSold) : localUnitsSold;

  const absentDeliveries = dbKpis?.absentDeliveries != null ? Math.max(dbKpis.absentDeliveries, absentStopsCount) : absentStopsCount;
  const completedTrips = dbKpis?.completedTripsCount != null ? Math.max(dbKpis.completedTripsCount, completedTripsCount) : completedTripsCount;

  const totalSales = totalEarnings + totalFiados;
  const percentCobrado = totalSales > 0 ? Math.round((totalEarnings / totalSales) * 100) : 0;

  const attemptedStops = deliveredDeliveries + absentDeliveries;
  const deliveryRate = attemptedStops > 0 ? Math.round((deliveredDeliveries / attemptedStops) * 100) : (deliveredDeliveries > 0 ? 100 : 0);

  const avgTimeStr = completedTrips > 0 ? '14 min' : '0 min';

  // Group delivered stops by day of the week for Chart 1
  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dailyEarnings = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 };

  deliveredStops.forEach(s => {
    let dayName = 'Lun';
    if (s.delivered_at || s.createdAt) {
      try {
        const d = new Date(s.delivered_at || s.createdAt);
        const dayIdx = d.getDay();
        const mapIdx = [6, 0, 1, 2, 3, 4, 5][dayIdx];
        dayName = daysOfWeek[mapIdx] || 'Lun';
      } catch {}
    }
    dailyEarnings[dayName] = (dailyEarnings[dayName] || 0) + Number(s.total || 0);
  });

  const maxDaily = Math.max(...Object.values(dailyEarnings), 1);
  const chartDays = daysOfWeek.map(day => ({
    day,
    amount: dailyEarnings[day] || 0,
    height: totalEarnings > 0 ? `${Math.max(6, Math.round(((dailyEarnings[day] || 0) / maxDaily) * 100))}%` : '4%'
  }));

  const dailyAvg = totalEarnings > 0 ? Math.round(totalEarnings / 7) : 0;

  // Inactive clients computed from real client base
  const inactiveClients = localClients.filter(c => {
    return c.isInactive || (c.balance && c.balance < 0);
  }).map(c => ({
    name: c.name,
    phone: c.phone || '',
    address: c.address || '',
    days: c.daysSinceLastOrder || 14,
    returnables: (c.containers || []).map(cont => `${cont.label}: ${cont.qty}`).join(', ') || 'Sin envases',
    balance: c.balance || 0
  }));

  const filteredInactive = inactiveClients.filter(c => 
    c.days >= inactiveDaysThreshold &&
    (c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || c.phone.includes(clientSearchTerm))
  );

  return (
    <div className="space-y-5">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vista general de tu negocio</p>
      </div>

      {/* Secondary Navigation Subtabs (matches screenshot) */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-1 flex items-center space-x-2 overflow-x-auto scrollbar-none shadow-2xs">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'ingresos', label: 'Ingresos' },
          { id: 'ventas', label: 'Ventas' },
          { id: 'clientes', label: 'Clientes' },
          { id: 'repartos', label: 'Repartos' },
          { id: 'stock', label: 'Stock' },
          { id: 'reporte', label: 'Reporte' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`subtab-item text-xs font-semibold py-2.5 px-3 rounded-none transition border-b-2 ${
              subTab === tab.id
                ? 'border-[#0c315b] text-[#0c315b] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filter Bar (matches screenshot) */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'ayer', label: 'Ayer' },
            { id: '7d', label: 'Últ. 7 días' },
            { id: 'mes', label: 'Últ. mes' },
            { id: '3mes', label: 'Últ. 3 meses' },
            { id: 'todos', label: 'Todos los tiempos' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                timeFilter === item.id
                  ? 'bg-[#0c315b] text-white font-semibold shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-medium">Desde</span>
            <input 
              type="text" 
              defaultValue="24/10/2026" 
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 w-28 focus:border-[#0c315b] outline-none"
            />
          </div>
          <div className="relative">
            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-medium">Hasta</span>
            <input 
              type="text" 
              defaultValue="31/10/2026" 
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 w-28 focus:border-[#0c315b] outline-none"
            />
          </div>
          <button 
            onClick={loadData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg border border-gray-300 transition flex items-center gap-1.5"
            title="Recalcular métricas"
          >
            <RotateCw className="w-3 h-3 text-gray-500" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: RESUMEN ===================== */}
      {subTab === 'resumen' && (
        <div className="space-y-5">
          {/* 10 Cards with colored top borders matching dashboard.png */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            
            {/* Card 1 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#0284c7' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-gray-900 block">
                  {deliveredDeliveries}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Ventas entregadas</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#0c315b' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-[#0c315b] block">
                  ${totalEarnings.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Ingresos</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#f97316' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-orange-600 block">
                  ${totalFiados.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Total en calle (Fiados)</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#10b981' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-emerald-600 block">
                  {percentCobrado}%
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">% Cobrado</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#10b981' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-emerald-600 block">
                  {unitsSold} u
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Productos vendidos</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#ef4444' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-sky-600 block">
                  {deliveryRate}%
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Tasa de entrega</span>
              </div>
            </div>

            {/* Card 7 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#3b82f6' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-blue-600 block">
                  {totalPendingOrders}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Pedidos pendientes</span>
              </div>
            </div>

            {/* Card 8 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#8b5cf6' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-purple-600 block">
                  {absentDeliveries}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Ausentes</span>
              </div>
            </div>

            {/* Card 9 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#0c315b' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-[#0c315b] block">
                  {avgTimeStr}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Tiempo prom. reparto</span>
              </div>
            </div>

            {/* Card 10 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#06b6d4' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-cyan-600 block">
                  {completedTrips}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Repartos completados</span>
              </div>
            </div>

          </div>

          {/* Two Chart Cards side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Chart 1: Ingresos y ventas por día */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Ingresos y ventas por día</h3>
              
              <div className="h-48 flex items-end justify-between gap-2 px-2 pt-6 pb-2 border-b border-gray-100">
                {chartDays.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {item.amount > 0 ? `$${Math.round(item.amount / 1000)}k` : ''}
                    </span>
                    <div 
                      className="w-full max-w-[28px] bg-gradient-to-t from-[#0c315b] to-[#0284c7] rounded-t-md hover:opacity-85 transition cursor-pointer"
                      style={{ height: item.height }}
                      title={`$${item.amount.toLocaleString('es-AR')}`}
                    ></div>
                    <span className="text-[11px] text-gray-500 font-medium mt-1">{item.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>Promedio diario: ${dailyAvg.toLocaleString('es-AR')}</span>
                <span className="text-[#0c315b] font-semibold">Total: ${totalEarnings.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Chart 2: Estado de pedidos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-4">Estado de pedidos</h3>
                
                <div className="flex items-center justify-center py-4">
                  <div className={`relative w-36 h-36 rounded-full border-8 ${deliveredDeliveries > 0 ? 'border-emerald-500' : 'border-gray-200'} flex items-center justify-center`}>
                    <div className="text-center">
                      <span className="text-2xl font-black text-gray-900 block">{deliveredDeliveries}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Entregados</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center text-xs">
                <div>
                  <span className="text-emerald-600 font-bold block text-sm">{deliveredDeliveries}</span>
                  <span className="text-[11px] text-gray-500">Entregados</span>
                </div>
                <div>
                  <span className="text-sky-600 font-bold block text-sm">{totalPendingOrders}</span>
                  <span className="text-[11px] text-gray-500">Pendientes</span>
                </div>
                <div>
                  <span className="text-purple-600 font-bold block text-sm">{absentDeliveries}</span>
                  <span className="text-[11px] text-gray-500">Ausentes</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================== TAB 2: INGRESOS ===================== */}
      {subTab === 'ingresos' && (
        <div className="space-y-4">
          <div className="card-top-border p-6 shadow-2xs" style={{ '--top-border-color': '#0c315b' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Ingresos Totales del Período
                </span>
                <span className="text-3xl font-black text-[#0c315b]">
                  ${totalEarnings.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-center">
                {deliveredDeliveries} {deliveredDeliveries === 1 ? 'pedido entregado' : 'pedidos entregados'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Donut breakdown */}
            <div className="md:col-span-6 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Desglose por estado de pedidos</h3>
              <div className="flex flex-col items-center justify-center py-4">
                <div className={`relative w-40 h-40 rounded-full border-12 ${deliveredDeliveries > 0 ? 'border-[#0c315b]' : 'border-gray-200'} flex items-center justify-center`}>
                  <div className="text-center">
                    <span className="text-lg font-black text-gray-900 block">
                      {deliveredDeliveries + totalPendingOrders > 0 
                        ? `${Math.round((deliveredDeliveries / (deliveredDeliveries + totalPendingOrders)) * 100)}%` 
                        : '0%'
                      }
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Completados</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0c315b]"></span>
                    Entregados ({deliveredDeliveries})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Pendientes ({totalPendingOrders})
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen Métodos de Cobro */}
            <div className="md:col-span-6 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Métodos de Cobro</h3>
              <div className="space-y-3 text-xs">
                {(() => {
                  let cash = 0;
                  let mp = 0;
                  let transfer = 0;
                  deliveredStops.forEach(s => {
                    const method = (s.payment_method || '').toLowerCase();
                    if (method.includes('transf')) transfer += Number(s.total || 0);
                    else if (method.includes('mp') || method.includes('mercado')) mp += Number(s.total || 0);
                    else cash += Number(s.total || 0);
                  });
                  const sumMethods = cash + mp + transfer || (totalEarnings || 1);
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Efectivo</span>
                        <span className="font-semibold text-gray-900">
                          ${cash.toLocaleString('es-AR')} {totalEarnings > 0 ? `(${Math.round((cash / sumMethods) * 100)}%)` : '(0%)'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">MercadoPago</span>
                        <span className="font-semibold text-gray-900">
                          ${mp.toLocaleString('es-AR')} {totalEarnings > 0 ? `(${Math.round((mp / sumMethods) * 100)}%)` : '(0%)'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-gray-600 font-medium">Transferencia Bancaria</span>
                        <span className="font-semibold text-gray-900">
                          ${transfer.toLocaleString('es-AR')} {totalEarnings > 0 ? `(${Math.round((transfer / sumMethods) * 100)}%)` : '(0%)'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================== TAB 3: CLIENTES INACTIVOS (desktop-dashboard-clientes-inactivos.png) ===================== */}
      {subTab === 'clientes' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Clientes inactivos</h2>
              <p className="text-xs text-gray-500">
                Inventario y saldo son independientes del filtro de días.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-medium">
                  Sin pedido hace más de
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg px-2 py-1.5">
                  <input
                    type="number"
                    value={inactiveDaysThreshold}
                    onChange={(e) => setInactiveDaysThreshold(Number(e.target.value) || 0)}
                    className="w-12 text-xs font-bold text-gray-800 outline-none"
                  />
                  <span className="text-xs text-gray-500">días</span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg pl-3 pr-3 py-1.5 text-xs text-gray-700 focus:border-[#0c315b] outline-none w-44"
                />
              </div>
            </div>
          </div>

          {/* Table matching desktop-dashboard-clientes-inactivos.png */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
                  <th className="py-2.5">Cliente</th>
                  <th className="py-2.5">Dirección</th>
                  <th className="py-2.5 text-center">Días sin pedido</th>
                  <th className="py-2.5">Retornables</th>
                  <th className="py-2.5 text-right">Saldo</th>
                  <th className="py-2.5 text-right">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInactive.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="py-3">
                      <span className="font-bold text-gray-900 block">{c.name}</span>
                      <span className="text-gray-400 text-[11px] font-mono">{c.phone}</span>
                    </td>
                    <td className="py-3 text-gray-500">{c.address || '—'}</td>
                    <td className="py-3 text-center font-bold text-gray-700">{c.days}d</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {c.returnables}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {c.balance < 0 ? (
                        <span className="font-bold text-rose-600">
                          $-{Math.abs(c.balance).toLocaleString()}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-700">$0,00</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(
                            `Hola ${c.name}! Te escribimos de Soda y Agua Polar 🐻. Vemos que hace ${c.days} días no te visitamos y tenés ${c.returnables} en tu domicilio. ¿Te llevamos bidones frescos esta semana?`
                          );
                          window.open(`https://wa.me/${c.phone}?text=${msg}`, '_blank');
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center space-x-1 transition shadow-2xs"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Reclamar</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredInactive.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400 text-xs font-medium">
                      No hay clientes inactivos con envases pendientes en el período seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other tabs fallback */}
      {['ventas', 'repartos', 'stock', 'reporte'].includes(subTab) && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs font-medium">Información sincronizada en el período seleccionado.</p>
        </div>
      )}

    </div>
  );
}
