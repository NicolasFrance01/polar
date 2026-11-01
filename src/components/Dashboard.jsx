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
  ArrowRight
} from 'lucide-react';
import { fetchDashboardKPIs } from '../services/api';

export default function Dashboard({ onNavigateToRepartir }) {
  const [subTab, setSubTab] = useState('resumen'); // 'resumen', 'ingresos', 'ventas', 'clientes', 'repartos', 'stock', 'reporte'
  const [timeFilter, setTimeFilter] = useState('7d');
  const [inactiveDaysThreshold, setInactiveDaysThreshold] = useState(8);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [dbKpis, setDbKpis] = useState(null);

  useEffect(() => {
    fetchDashboardKPIs().then(data => {
      if (data) setDbKpis(data);
    });
  }, []);

  // Sample data matching the screenshots
  const inactiveClients = [
    { name: 'Silvia Peralta', phone: '5491155550104', address: 'Av. Colón 1240', days: 23, returnables: 'Bidón 12L: 3', balance: -4800 },
    { name: 'Panadería La Espiga', phone: '5491155550112', address: 'Juan B. Justo 3420', days: 22, returnables: 'Bidón 20L: 7', balance: -15300 },
    { name: 'Graciela Sosa', phone: '5491155550109', address: 'Santa Rosa 890', days: 18, returnables: 'Bidón 20L: 5', balance: -8200 },
    { name: 'Oscar Benítez', phone: '5491155550110', address: 'Caseros 650', days: 16, returnables: 'Bidón 20L: 3', balance: 0 },
    { name: 'Claudia Ferreyra', phone: '5491155550111', address: 'Chacabuco 430', days: 14, returnables: 'Pack x6 Sifones 1.5L: 2', balance: 0 },
    { name: 'Héctor Ríos', phone: '5491155550113', address: 'Castro Barros 1120', days: 12, returnables: 'Bidón 12L: 2', balance: 0 },
    { name: 'Marta Villalba', phone: '5491155550114', address: 'San Jerónimo 210', days: 11, returnables: 'Bidón 20L: 2', balance: 0 },
  ];

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
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg border border-gray-300 transition">
            Aplicar
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
                  {dbKpis ? dbKpis.deliveredDeliveries : 12}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Ventas entregadas</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#0c315b' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-[#0c315b] block">
                  {dbKpis ? `$${dbKpis.totalEarningsToday.toLocaleString()}` : '$174.300'}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Ingresos</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#f97316' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-orange-600 block">
                  {dbKpis ? `$${dbKpis.totalFiados.toLocaleString()}` : '$50.500'}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Total en calle (Fiados)</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#10b981' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-emerald-600 block">78%</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">% Cobrado</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#10b981' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-emerald-600 block">46 u</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Productos vendidos</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#ef4444' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-sky-600 block">92%</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Tasa de entrega</span>
              </div>
            </div>

            {/* Card 7 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#3b82f6' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-blue-600 block">4</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Pedidos pendientes</span>
              </div>
            </div>

            {/* Card 8 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#8b5cf6' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-purple-600 block">1</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Ausentes</span>
              </div>
            </div>

            {/* Card 9 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#0c315b' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-[#0c315b] block">14 min</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Tiempo prom. reparto</span>
              </div>
            </div>

            {/* Card 10 */}
            <div className="card-top-border p-4 shadow-2xs" style={{ '--top-border-color': '#06b6d4' }}>
              <div className="text-center py-1">
                <span className="text-2xl font-black text-cyan-600 block">2</span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Repartos completados</span>
              </div>
            </div>

          </div>

          {/* Two Chart Cards side-by-side (matches dashboard.png) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Chart 1: Ingresos y ventas por día */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Ingresos y ventas por día</h3>
              
              {/* Simulated clean chart bars */}
              <div className="h-48 flex items-end justify-between gap-2 px-2 pt-6 pb-2 border-b border-gray-100">
                {[
                  { day: 'Lun', amount: 28000, height: '45%' },
                  { day: 'Mar', amount: 35000, height: '60%' },
                  { day: 'Mié', amount: 18000, height: '30%' },
                  { day: 'Jue', amount: 42000, height: '75%' },
                  { day: 'Vie', amount: 51300, height: '90%' },
                  { day: 'Sáb', amount: 0, height: '5%' },
                  { day: 'Dom', amount: 0, height: '5%' },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {item.amount > 0 ? `$${Math.round(item.amount / 1000)}k` : ''}
                    </span>
                    <div 
                      className="w-full max-w-[28px] bg-gradient-to-t from-[#0c315b] to-[#0284c7] rounded-t-md hover:opacity-85 transition cursor-pointer"
                      style={{ height: item.height }}
                      title={`$${item.amount.toLocaleString()}`}
                    ></div>
                    <span className="text-[11px] text-gray-500 font-medium mt-1">{item.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>Promedio diario: $34.860</span>
                <span className="text-[#0c315b] font-semibold">Total: $174.300</span>
              </div>
            </div>

            {/* Chart 2: Estado de pedidos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-4">Estado de pedidos</h3>
                
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-36 h-36 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-2xl font-black text-gray-900 block">12</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Entregados</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center text-xs">
                <div>
                  <span className="text-emerald-600 font-bold block text-sm">12</span>
                  <span className="text-[11px] text-gray-500">Entregados</span>
                </div>
                <div>
                  <span className="text-sky-600 font-bold block text-sm">4</span>
                  <span className="text-[11px] text-gray-500">Pendientes</span>
                </div>
                <div>
                  <span className="text-purple-600 font-bold block text-sm">1</span>
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
          {/* Banner matching desktop-dashboard-ingresos.png */}
          <div className="card-top-border p-6 shadow-2xs" style={{ '--top-border-color': '#0c315b' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Ingresos Totales del Período
                </span>
                <span className="text-3xl font-black text-[#0c315b]">
                  $174.300,00
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-center">
                12 pedidos entregados
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Donut breakdown */}
            <div className="md:col-span-6 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Desglose por tipo de pedido</h3>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-40 h-40 rounded-full border-12 border-[#0c315b] border-t-amber-400 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-lg font-black text-gray-900 block">81.9%</span>
                    <span className="text-[10px] text-gray-400 font-medium">Programados</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Entrega inmediata (18.1%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0c315b]"></span>
                    Pedidos normales (81.9%)
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen rápido table */}
            <div className="md:col-span-6 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Resumen rápido</h3>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px]">
                    <th className="py-2 font-semibold">Tipo</th>
                    <th className="py-2 font-semibold text-center">Cant.</th>
                    <th className="py-2 font-semibold text-right">Ingresos</th>
                    <th className="py-2 font-semibold text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span>Pagos directos</span>
                    </td>
                    <td className="py-2.5 text-center font-medium">0</td>
                    <td className="py-2.5 text-right font-medium">$0,00</td>
                    <td className="py-2.5 text-right font-semibold text-orange-600">0.0%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Entrega inmediata</span>
                    </td>
                    <td className="py-2.5 text-center font-medium">3</td>
                    <td className="py-2.5 text-right font-medium">$31.500,00</td>
                    <td className="py-2.5 text-right font-semibold text-amber-600">18.1%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0c315b]"></span>
                      <span>Pedidos normales</span>
                    </td>
                    <td className="py-2.5 text-center font-medium">9</td>
                    <td className="py-2.5 text-right font-medium">$142.800,00</td>
                    <td className="py-2.5 text-right font-semibold text-[#0c315b]">81.9%</td>
                  </tr>
                </tbody>
              </table>

              {/* Métodos de Pago table matching desktop-caja-fiados.png */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-800">Métodos de Cobro</h4>
                  <span className="text-sm font-black text-[#0c315b]">$50.500</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Efectivo</span>
                    <span className="font-semibold text-gray-900">$28.000 (55%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">MercadoPago</span>
                    <span className="font-semibold text-gray-900">$13.500 (27%)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Transferencia</span>
                    <span className="font-semibold text-gray-900">$9.000 (18%)</span>
                  </div>
                </div>
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
