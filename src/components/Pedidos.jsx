import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  X,
  RotateCw,
  Trash2,
  Package
} from 'lucide-react';
import { fetchOrders, createOrder, fetchProducts } from '../services/api';
import { getStoredOrders } from '../services/tripSync';

export default function Pedidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [onlyFiados, setOnlyFiados] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Available catalog products
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Create order form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('Alberdi');
  const [orderItems, setOrderItems] = useState([]);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const dbOrders = await fetchOrders();
      const source = Array.isArray(dbOrders) && dbOrders.length > 0 ? dbOrders : getStoredOrders();
      const normalized = source.map((o) => ({
        id: (o.orderId || o.id || '').replace('POLAR-', ''),
        rawId: o.orderId || o.id,
        client: o.clientName || o.client_name || 'Cliente',
        address: `${o.address || ''}${o.neighborhood ? ` (${o.neighborhood})` : ''}`,
        items: Array.isArray(o.items) && o.items.length > 0
          ? o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')
          : 'Bidones Polar',
        date: new Date(o.createdAt || o.created_at || Date.now()).toLocaleDateString('es-AR'),
        total: Number(o.total) || 0,
        paymentMethod: o.paymentMethod || 'Efectivo',
        status: o.status || 'Pendiente',
        tripId: o.tripId || o.trip_id || null
      }));
      setOrders(normalized);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const prods = await fetchProducts();
      if (Array.isArray(prods) && prods.length > 0) {
        setCatalogProducts(prods);
        if (!selectedProdId) {
          setSelectedProdId(prods[0].id);
        }
      } else {
        const fallback = [
          { id: 'prod-20l', name: 'Bidón de Agua de Mesa 20L', price: 4200 },
          { id: 'prod-12l', name: 'Bidón 12L c/ canilla', price: 3300 },
          { id: 'prod-sifon', name: 'Sifón de Soda 1,5 Litros', price: 1300 }
        ];
        setCatalogProducts(fallback);
        if (!selectedProdId) setSelectedProdId(fallback[0].id);
      }
    } catch {
      const fallback = [
        { id: 'prod-20l', name: 'Bidón de Agua de Mesa 20L', price: 4200 },
        { id: 'prod-12l', name: 'Bidón 12L c/ canilla', price: 3300 },
        { id: 'prod-sifon', name: 'Sifón de Soda 1,5 Litros', price: 1300 }
      ];
      setCatalogProducts(fallback);
      if (!selectedProdId) setSelectedProdId(fallback[0].id);
    }
  };

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const handleAddProductToOrder = () => {
    const prod = catalogProducts.find((p) => p.id === selectedProdId) || catalogProducts[0];
    if (!prod) return;
    const qty = Number(selectedQty) || 1;
    if (qty <= 0) return;

    setOrderItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === prod.id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].qty += qty;
        return copy;
      }
      return [...prev, {
        id: prod.id,
        name: prod.name,
        price: Number(prod.price) || 0,
        qty
      }];
    });
    setSelectedQty(1);
  };

  const handleRemoveOrderItem = (index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].qty + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].qty = newQty;
      return copy;
    });
  };

  const orderTotal = orderItems.reduce((acc, i) => acc + (i.price * i.qty), 0);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Por favor agregá al menos un producto al pedido.');
      return;
    }

    await createOrder({
      clientName,
      clientPhone,
      address,
      neighborhood,
      items: orderItems,
      total: orderTotal,
      status: 'Pendiente de aprobación'
    });

    setShowCreateModal(false);
    setClientName('');
    setClientPhone('');
    setAddress('');
    setOrderItems([]);
    await loadOrders();
  };

  const filteredOrders = orders.filter((o) => {
    const match =
      o.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.address.toLowerCase().includes(searchTerm.toLowerCase());
    if (!match) return false;
    if (onlyFiados && !o.paymentMethod.includes('Fiado')) return false;
    if (statusFilter !== 'Todos' && !o.status.toLowerCase().includes(statusFilter.toLowerCase())) return false;
    if (paymentFilter !== 'Todos' && !o.paymentMethod.includes(paymentFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Pedidos</h1>
        <button
          onClick={loadOrders}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="relative">
          <span className="absolute -top-2 left-2.5 bg-white px-1 text-[11px] text-gray-500 font-medium z-10">
            Buscar por cliente, dirección o ID
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none cursor-pointer font-medium text-gray-700"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="ruta">En hoja de ruta</option>
              <option value="Entregado">Entregado</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none cursor-pointer font-medium text-gray-700"
            >
              <option value="Todos">Medio de pago</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Fiado">Fiados</option>
            </select>

            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={onlyFiados}
                onChange={(e) => setOnlyFiados(e.target.checked)}
                className="rounded text-[#0c315b]"
              />
              <span>Solo Fiados</span>
            </label>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold transition shadow-xs flex items-center justify-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Pedido</span>
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto pt-2">
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
                <tr key={ord.rawId || ord.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 font-mono font-bold text-gray-700">#{ord.id}</td>
                  <td className="py-3">
                    <strong className="text-gray-900 block">{ord.client}</strong>
                    <span className="text-gray-400 text-[11px]">{ord.address}</span>
                  </td>
                  <td className="py-3 font-medium text-gray-800">{ord.items}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ord.status.toLowerCase().includes('entregado')
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.status.toLowerCase().includes('pendiente')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-[#0c315b]'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-gray-700">{ord.paymentMethod}</td>
                  <td className="py-3 text-right font-black text-gray-900 text-sm">
                    ${ord.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2.5 pt-1">
          {filteredOrders.map((ord) => (
            <div key={ord.rawId || ord.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-gray-500">#{ord.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  ord.status.toLowerCase().includes('entregado')
                    ? 'bg-emerald-100 text-emerald-800'
                    : ord.status.toLowerCase().includes('pendiente')
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-sky-100 text-[#0c315b]'
                }`}>
                  {ord.status}
                </span>
              </div>
              <strong className="text-gray-900 block text-sm">{ord.client}</strong>
              <p className="text-gray-500 text-[11px]">📍 {ord.address}</p>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/70">
                <span className="text-gray-700 font-medium truncate pr-2">{ord.items}</span>
                <strong className="text-[#0c315b] font-black text-sm">${ord.total.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <h3 className="font-bold text-sm text-gray-900">Cargar Pedido Manual</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Cliente *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Barrio</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Dirección *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                />
              </div>
              {/* Dynamic Products Selector */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <label className="font-bold text-gray-700 block text-xs">
                  Productos del Pedido *
                </label>

                {/* Add product bar */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-xs bg-white outline-none focus:border-[#0c315b]"
                  >
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${Number(p.price).toLocaleString()}
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-2 border rounded-lg text-xs text-center font-bold outline-none focus:border-[#0c315b]"
                      placeholder="Cant."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProductToOrder}
                    className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-[#0c315b] border border-sky-200 font-bold rounded-lg text-xs flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Items Table / List */}
                {orderItems.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 bg-gray-50/50">
                    <Package className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                    Seleccioná productos arriba y hacé clic en "Agregar"
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden bg-white text-xs">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-gray-800 block truncate">{item.name}</span>
                          <span className="text-[11px] text-gray-500">
                            ${item.price.toLocaleString()} c/u
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, -1)}
                            className="w-6 h-6 rounded border border-gray-200 bg-white hover:bg-gray-100 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-extrabold text-gray-900">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, 1)}
                            className="w-6 h-6 rounded border border-gray-200 bg-white hover:bg-gray-100 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-extrabold text-gray-900 w-20 text-right">
                          ${(item.price * item.qty).toLocaleString()}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItem(idx)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="p-2.5 bg-gray-50 flex items-center justify-between font-bold text-xs">
                      <span className="text-gray-700">Total del Pedido:</span>
                      <span className="text-base font-black text-[#0c315b]">
                        ${orderTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setOrderItems([]);
                  }} 
                  className="px-3 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#0c315b] hover:bg-[#082342] text-white font-bold rounded-lg transition"
                >
                  Guardar Pedido (${orderTotal.toLocaleString()})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
