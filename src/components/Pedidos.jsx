import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Plus, 
  Download, 
  CreditCard, 
  Clock, 
  CheckCircle,
  Truck,
  ArrowUpDown
} from 'lucide-react';
import { getStoredOrders } from '../services/tripSync';

export default function Pedidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [onlyFiados, setOnlyFiados] = useState(false);
  const [onlyPayments, setOnlyPayments] = useState(false);

  const sampleOrders = [
    {
      id: '901532',
      client: 'Roberto Fernández',
      address: 'Aguirre 750, Villa Crespo',
      items: '4x Bidón 20L Polar',
      date: '31/10/2026',
      total: 18000,
      paymentMethod: 'Efectivo',
      status: 'Entregado',
      truck: 'Camión #1'
    },
    {
      id: '901531',
      client: 'Raúl Medina',
      address: 'Neuquén 750, Caballito',
      items: '2x Bidón 12L c/ canilla',
      date: '31/10/2026',
      total: 6600,
      paymentMethod: 'Fiado (Cta. Cte.)',
      status: 'En camino',
      truck: 'Camión #1'
    },
    {
      id: '901529',
      client: 'Rubén Álvarez',
      address: 'Vera 620, Villa Crespo',
      items: '3x Bidón 20L Polar',
      date: '31/10/2026',
      total: 12600,
      paymentMethod: 'Transferencia',
      status: 'En camino',
      truck: 'Camión #2'
    },
    {
      id: '901528',
      client: 'María Esther López',
      address: 'Camargo 460, Villa Crespo',
      items: '2x Bidón 20L Polar',
      date: '31/10/2026',
      total: 8400,
      paymentMethod: 'Efectivo',
      status: 'En camino',
      truck: 'Camión #1'
    },
    {
      id: '901527',
      client: 'Consultorio Dental Crespo',
      address: 'Corrientes 4800, Piso 2',
      items: '3x Bidón 20L Polar',
      date: '31/10/2026',
      total: 12600,
      paymentMethod: 'Transferencia',
      status: 'Entregado',
      truck: 'Camión #2'
    },
    {
      id: '901526',
      client: 'Familia Rossi',
      address: 'Serrano 540, Villa Crespo',
      items: '1x Bidón 20L + 2 Sifones',
      date: '31/10/2026',
      total: 6800,
      paymentMethod: 'Efectivo',
      status: 'Entregado',
      truck: 'Camión #1'
    }
  ];

  const storedClientOrders = getStoredOrders().map(o => ({
    id: o.orderId.replace('POLAR-', ''),
    client: o.clientName,
    address: `${o.address}${o.neighborhood ? ` (${o.neighborhood})` : ''}`,
    items: o.items ? o.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Bidones Polar',
    date: new Date(o.createdAt || Date.now()).toLocaleDateString('es-AR'),
    total: o.total,
    paymentMethod: 'Efectivo',
    status: o.status === 'Aprobado y en hoja de ruta' ? 'En camino' : 'Pendiente',
    truck: 'Camión #1'
  }));

  const allOrders = [...storedClientOrders, ...sampleOrders];

  const filteredOrders = allOrders.filter(o => {
    const match = o.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  o.id.includes(searchTerm) || 
                  o.address.toLowerCase().includes(searchTerm.toLowerCase());
    if (!match) return false;
    if (onlyFiados && !o.paymentMethod.includes('Fiado')) return false;
    if (statusFilter !== 'Todos' && o.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Title matching pedidos.png */}
      <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
        Pedidos
      </h1>

      {/* Main Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
        
        {/* Search input with outline style */}
        <div className="relative">
          <span className="absolute -top-2 left-2.5 bg-white px-1 text-[11px] text-gray-500 font-medium">
            Buscar por cliente, comentario o "#42" por ID
          </span>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-800 focus:border-[#0c315b] outline-none"
            />
          </div>
        </div>

        {/* Filter Row matching pedidos.png */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Dates */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-medium">Desde</span>
                <input type="text" defaultValue="dd/mm/aaaa" className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-500 w-28 outline-none" />
              </div>
              <div className="relative">
                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-medium">Hasta</span>
                <input type="text" defaultValue="dd/mm/aaaa" className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-500 w-28 outline-none" />
              </div>
            </div>

            {/* Estado */}
            <div className="border border-gray-300 rounded-lg px-2.5 py-1.5 flex items-center space-x-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-medium text-gray-700"
              >
                <option value="Todos">Estado</option>
                <option value="En camino">En camino</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>

            {/* Medio de Pago */}
            <div className="border border-gray-300 rounded-lg px-2.5 py-1.5 flex items-center space-x-1">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-medium text-gray-700"
              >
                <option value="Todos">Medio de pago</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Fiado">Fiados</option>
              </select>
            </div>

            {/* Checkbox Fiados */}
            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={onlyFiados}
                onChange={(e) => setOnlyFiados(e.target.checked)}
                className="rounded text-[#0c315b]"
              />
              <span>Fiados</span>
            </label>

            {/* Checkbox Ver solo pagos */}
            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={onlyPayments}
                onChange={(e) => setOnlyPayments(e.target.checked)}
                className="rounded text-[#0c315b]"
              />
              <span>Ver solo pagos</span>
            </label>
          </div>

          {/* Action buttons matching pedidos.png */}
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition">
              Importar Pagos
            </button>
            <button className="px-3 py-2 rounded-lg border border-[#0c315b] text-[#0c315b] font-bold hover:bg-sky-50 transition">
              Cargar Pago
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold transition shadow-xs flex items-center space-x-1">
              <Plus className="w-4 h-4" />
              <span>Crear Pedido</span>
            </button>
          </div>

        </div>

        {/* Table of Orders */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
                <th className="py-2.5"># ID</th>
                <th className="py-2.5">Cliente</th>
                <th className="py-2.5">Detalle Productos</th>
                <th className="py-2.5 text-center">Estado</th>
                <th className="py-2.5">Medio de Pago</th>
                <th className="py-2.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 font-mono font-bold text-gray-700">#{ord.id}</td>
                  <td className="py-3">
                    <strong className="text-gray-900 block">{ord.client}</strong>
                    <span className="text-gray-400 text-[11px]">{ord.address}</span>
                  </td>
                  <td className="py-3 font-medium text-gray-800">{ord.items}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ord.status === 'Entregado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-[#0c315b]'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${
                      ord.paymentMethod.includes('Fiado') ? 'text-amber-600 font-bold' : 'text-gray-700'
                    }`}>
                      {ord.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-black text-gray-900 text-sm">
                    ${ord.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
