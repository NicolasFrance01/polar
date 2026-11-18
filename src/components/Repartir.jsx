import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Check,
  Truck,
  Plus,
  Copy,
  ExternalLink,
  History,
  Route,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Search,
  X
} from 'lucide-react';
import {
  fetchOrders,
  fetchTrips,
  fetchUsers,
  createTrip
} from '../services/api';
import { getStoredOrders } from '../services/tripSync';
import { 
  getGoogleMapsRouteEmbedUrl, 
  getGoogleMapsDirectionsAppUrl, 
  getWazeStopUrl 
} from '../services/mapRouting';

const DEFAULT_DRIVERS = [
  { id: 'usr-marcos', name: 'Marcos Gutiérrez', phone: '5491155550100', truck: 'Camión #1 (Mercedes Sprinter)' },
  { id: 'usr-sofia', name: 'Sofía Ramos', phone: '5491155550200', truck: 'Camión #2 (Renault Master)' }
];

export default function Repartir({ onOpenDriverTrip }) {
  const [subtab, setSubtab] = useState('armar'); // 'armar' | 'historial'
  const [orders, setOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [focusedOrder, setFocusedOrder] = useState(null);
  const [drivers, setDrivers] = useState(DEFAULT_DRIVERS);
  const [availableSearch, setAvailableSearch] = useState('');

  // Live user/depot GPS coordinates for route starting point
  const [userCoords, setUserCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Detectando ubicación...');
  const [gpsReady, setGpsReady] = useState(false);

  // Route creation form
  const [selectedDriverName, setSelectedDriverName] = useState(DEFAULT_DRIVERS[0].name);
  const [driverPhone, setDriverPhone] = useState(DEFAULT_DRIVERS[0].phone);
  const [truck, setTruck] = useState(DEFAULT_DRIVERS[0].truck);
  const [routeNotes, setRouteNotes] = useState('');
  const [creatingRoute, setCreatingRoute] = useState(false);
  const [createdRouteResult, setCreatedRouteResult] = useState(null);
  const [copiedPath, setCopiedPath] = useState(null);

  // History state
  const [tripsHistory, setTripsHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('todos'); // 'todos' | 'en_curso' | 'finalizada'
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS no disponible');
      return;
    }
    setGpsStatus('Buscando GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setGpsReady(true);
        setGpsStatus(`GPS Activo (±${Math.round(pos.coords.accuracy || 10)}m)`);
      },
      (err) => {
        console.warn('GPS error in Repartir:', err);
        setGpsStatus('Permiso de GPS pendiente');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [dbOrders, dbTrips, dbUsers] = await Promise.all([
        fetchOrders(),
        fetchTrips(),
        fetchUsers()
      ]);

      // Merge DB orders with fallback sample orders if DB has none pending
      const rawOrders = Array.isArray(dbOrders) && dbOrders.length > 0 ? dbOrders : getStoredOrders();
      const normalized = rawOrders.map((o, idx) => {
        const lat = o.lat ?? o.coords?.lat ?? null;
        const lng = o.lng ?? o.coords?.lng ?? null;
        return {
          orderId: o.orderId || o.id || `POLAR-${90100 + idx}`,
          clientName: o.clientName || o.client_name || 'Cliente Polar',
          clientPhone: o.clientPhone || o.client_phone || '',
          address: o.address || '',
          neighborhood: o.neighborhood || '',
          notes: o.notes || '',
          coords: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null,
          items: Array.isArray(o.items) ? o.items : [],
          total: Number(o.total) || 0,
          status: o.status || 'Pendiente de aprobación',
          tripId: o.tripId || o.trip_id || null,
          createdAt: o.createdAt || o.created_at || new Date().toISOString()
        };
      });

      setOrders(normalized);
      if (!focusedOrder && normalized.length > 0) {
        setFocusedOrder(normalized[0]);
      }

      if (dbTrips && typeof dbTrips === 'object') {
        const list = Object.values(dbTrips).sort((a, b) => (b.tripNumber || 0) - (a.tripNumber || 0));
        setTripsHistory(list);
      }

      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        const repartidores = dbUsers.filter((u) => u.role === 'repartidor');
        if (repartidores.length > 0) {
          const mapped = repartidores.map((u, i) => ({
            id: u.id,
            name: u.name,
            phone: u.phone || '5493510000000',
            truck: `Camión #${i + 1}`
          }));
          setDrivers(mapped);
          setSelectedDriverName(mapped[0].name);
          setDriverPhone(mapped[0].phone);
          setTruck(mapped[0].truck);
        }
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
    requestUserLocation();
  }, []);

  const toggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const moveSelectedOrder = (idx, direction) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= selectedOrderIds.length) return;
    const copy = [...selectedOrderIds];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    setSelectedOrderIds(copy);
  };

  const selectedOrders = selectedOrderIds
    .map((id) => orders.find((o) => o.orderId === id))
    .filter(Boolean);

  const handleDriverSelect = (name) => {
    setSelectedDriverName(name);
    const found = drivers.find((d) => d.name === name);
    if (found) {
      setDriverPhone(found.phone);
      setTruck(found.truck);
    }
  };

  const handleCreateRoute = async () => {
    if (selectedOrders.length === 0) {
      alert('Seleccioná al menos un pedido para armar la Hoja de Ruta.');
      return;
    }

    setCreatingRoute(true);
    try {
      const stopsPayload = selectedOrders.map((o) => ({
        orderRef: o.orderId,
        clientName: o.clientName,
        address: `${o.address}${o.neighborhood ? `, ${o.neighborhood}` : ''}`,
        phone: o.clientPhone,
        coords: o.coords,
        items: o.items,
        total: o.total,
        notes: o.notes
      }));

      const res = await createTrip({
        driverName: selectedDriverName,
        driverPhone,
        truck,
        zone: 'General',
        notes: routeNotes,
        stops: stopsPayload,
        initialCoords: userCoords
      });

      setCreatedRouteResult({
        tripId: res.tripId,
        tripNumber: res.tripNumber,
        routePath: res.routePath || `/ruta${res.tripNumber}`,
        driverName: selectedDriverName,
        driverPhone,
        stopsCount: selectedOrders.length
      });

      setSelectedOrderIds([]);
      setRouteNotes('');
      await loadAllData();
    } catch (err) {
      alert('Error al programar la ruta: ' + err.message);
    } finally {
      setCreatingRoute(false);
    }
  };

  const handleCopyRouteLink = (tripNumber) => {
    const url = `${window.location.origin}/ruta${tripNumber}`;
    navigator.clipboard?.writeText(url);
    setCopiedPath(tripNumber);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const handleSendWhatsAppRoute = (tripNumber, dName, dPhone) => {
    const url = `${window.location.origin}/ruta${tripNumber}`;
    const text = encodeURIComponent(
      `¡Hola ${dName}! 🚚 Te asignamos la *Hoja de Ruta #${tripNumber}* de Soda y Agua POLAR.\n\n` +
      `Abrí este link desde tu celular para ver el mapa, las paradas y registrar cada entrega:\n` +
      `🔗 ${url}`
    );
    window.open(`https://wa.me/${dPhone}?text=${text}`, '_blank');
  };

  // Filter available orders with search input
  const filteredAvailableOrders = orders.filter((o) => {
    if (!availableSearch.trim()) return true;
    const term = availableSearch.toLowerCase();
    return (
      (o.clientName && o.clientName.toLowerCase().includes(term)) ||
      (o.address && o.address.toLowerCase().includes(term)) ||
      (o.neighborhood && o.neighborhood.toLowerCase().includes(term)) ||
      (o.orderId && o.orderId.toLowerCase().includes(term)) ||
      (o.clientPhone && o.clientPhone.toLowerCase().includes(term))
    );
  });

  const filteredHistory = tripsHistory.filter((t) => {
    if (historyFilter === 'todos') return true;
    return t.status === historyFilter;
  });

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Repartir — Armar Hoja de Ruta
          </h1>
          <p className="text-xs text-gray-500">
            Seleccioná pedidos en el mapa, asignalos a un repartidor y generá su link exclusivo /rutaXX
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 shadow-2xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Subtabs */}
      <div className="flex items-center space-x-6 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <button
          onClick={() => setSubtab('armar')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
            subtab === 'armar'
              ? 'border-[#0c315b] text-[#0c315b] font-bold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Programar Ruta</span>
        </button>
        <button
          onClick={() => setSubtab('historial')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
            subtab === 'historial'
              ? 'border-[#0c315b] text-[#0c315b] font-bold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Hojas de Ruta ({tripsHistory.length})</span>
        </button>
      </div>

      {/* ===================== TAB 1: ARMAR RUTA ===================== */}
      {subtab === 'armar' && (
        <div className="space-y-4">
          {createdRouteResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>¡Hoja de Ruta #{createdRouteResult.tripNumber} programada!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Asignada a <strong>{createdRouteResult.driverName}</strong> con {createdRouteResult.stopsCount} paradas. Link: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">{createdRouteResult.routePath}</code>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => handleCopyRouteLink(createdRouteResult.tripNumber)}
                  className="px-3 py-2 rounded-lg bg-white border border-emerald-300 font-bold text-emerald-800 hover:bg-emerald-100 flex items-center space-x-1"
                >
                  {copiedPath === createdRouteResult.tripNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath === createdRouteResult.tripNumber ? '¡Copiado!' : 'Copiar /ruta' + createdRouteResult.tripNumber}</span>
                </button>
                <button
                  onClick={() => handleSendWhatsAppRoute(createdRouteResult.tripNumber, createdRouteResult.driverName, createdRouteResult.driverPhone)}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enviar al Chofer</span>
                </button>
                <button
                  onClick={() => onOpenDriverTrip && onOpenDriverTrip(`VIAJE-${createdRouteResult.tripNumber}`, createdRouteResult.tripNumber)}
                  className="px-3 py-2 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir /ruta{createdRouteResult.tripNumber}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Orders list + Map */}
            <div className="lg:col-span-7 space-y-4">
              {/* Route Map Card (Google Maps Real Street Routing) */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0c315b]" />
                    <h2 className="text-sm font-bold text-gray-900">
                      Ruta Multi-Parada en Google Maps
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Inicia en Tu Ubicación
                    </span>
                    {selectedOrders.length >= 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0c315b]">
                        +{selectedOrders.length} {selectedOrders.length === 1 ? 'parada' : 'paradas'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleMapsDirectionsAppUrl(selectedOrders.length > 0 ? selectedOrders : (focusedOrder ? [focusedOrder] : []), userCoords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0c315b] border border-sky-200 text-xs font-bold flex items-center gap-1 transition"
                      title="Abrir recorrido multi-parada completo en Google Maps iniciando desde mi ubicación"
                    >
                      <span>Abrir en Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Google Maps Embed Full Container */}
                <div className="flex flex-col h-72 sm:h-84 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner">
                  <div className="px-3 py-1.5 bg-white border-b border-gray-200 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#0c315b] truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>
                        {selectedOrders.length > 0 ? (
                          <>
                            📍 Inicio: Mi ubicación ➔ {selectedOrders.map((o, idx) => `${idx + 1}. ${o.clientName}`).join(' ➔ ')}
                          </>
                        ) : focusedOrder ? (
                          <>📍 Inicio: Mi ubicación ➔ 1. {focusedOrder.clientName} ({focusedOrder.address})</>
                        ) : (
                          <>Google Maps · Seleccioná pedidos para unir las paradas desde tu ubicación actual</>
                        )}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={requestUserLocation}
                      className="text-gray-500 hover:text-[#0c315b] text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Actualizar mi ubicación actual"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>{gpsStatus}</span>
                    </button>
                  </div>

                  <iframe
                    title="Google Maps Route"
                    src={getGoogleMapsRouteEmbedUrl(selectedOrders.length > 0 ? selectedOrders : (focusedOrder ? [focusedOrder] : []), userCoords)}
                    className="w-full flex-1 border-0"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Selectable Orders List with Search */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">
                    Pedidos Disponibles ({filteredAvailableOrders.length} de {orders.length})
                  </h3>
                  <span className="text-xs font-bold text-[#0c315b]">
                    {selectedOrderIds.length} seleccionados
                  </span>
                </div>

                {/* Search Bar for Available Orders */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={availableSearch}
                    onChange={(e) => setAvailableSearch(e.target.value)}
                    placeholder="Buscar pedido por cliente, dirección o #ID..."
                    className="w-full pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
                  />
                  {availableSearch && (
                    <button
                      onClick={() => setAvailableSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredAvailableOrders.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      {orders.length === 0 
                        ? 'No hay pedidos cargados todavía. Los pedidos ingresados desde /cliente aparecerán aquí.' 
                        : 'No se encontraron pedidos que coincidan con la búsqueda.'}
                    </div>
                  ) : filteredAvailableOrders.map((ord) => {
                    const isSelected = selectedOrderIds.includes(ord.orderId);
                    const isFocused = focusedOrder?.orderId === ord.orderId;
                    const alreadyAssigned = Boolean(ord.tripId);

                    return (
                      <div
                        key={ord.orderId}
                        onClick={() => setFocusedOrder(ord)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-[#0c315b] bg-sky-50/50 ring-1 ring-[#0c315b]/20'
                            : isFocused
                            ? 'border-orange-300 bg-orange-50/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectOrder(ord.orderId);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 rounded text-[#0c315b] w-4 h-4 cursor-pointer flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-gray-500">#{ord.orderId}</span>
                              <strong className="text-xs sm:text-sm text-gray-900 truncate">{ord.clientName}</strong>
                              {alreadyAssigned && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  En {ord.tripId}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              📍 {ord.address}{ord.neighborhood ? ` (${ord.neighborhood})` : ''}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {ord.items.map((it) => `${it.qty}x ${it.name}`).join(', ') || 'Pedido Polar'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-black text-sm text-[#0c315b] block">
                            ${Number(ord.total || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Route Builder & Driver Assignment */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 sticky top-18">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0c315b] text-white flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Programar Hoja de Ruta</h3>
                    <span className="text-[11px] text-gray-500">Se creará el link /rutaXX para el chofer</span>
                  </div>
                </div>

                {/* Driver & Truck Inputs without "Zona" */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Repartidor Asignado</label>
                    <select
                      value={selectedDriverName}
                      onChange={(e) => handleDriverSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-semibold text-gray-900 outline-none focus:border-[#0c315b]"
                    >
                      {drivers.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Vehículo / Camión</label>
                      <input
                        type="text"
                        value={truck}
                        onChange={(e) => setTruck(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">WhatsApp del Chofer</label>
                      <input
                        type="text"
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        placeholder="549351..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
                      />
                    </div>
                  </div>
                </div>

                {/* Ordered Stops Preview */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">
                      Orden de Paradas ({selectedOrders.length})
                    </span>
                    {selectedOrders.length > 0 && (
                      <button
                        onClick={() => setSelectedOrderIds([])}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>

                  {selectedOrders.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-400">
                      Marcá los pedidos de la lista para agregarlos a esta Hoja de Ruta.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {/* Fixed Stop 0: User Current Location (Start point) */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs shadow-2xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                            0
                          </span>
                          <div className="min-w-0">
                            <strong className="text-emerald-950 block truncate">📍 Inicio: Mi Ubicación Actual</strong>
                            <span className="text-[10px] text-emerald-700 block truncate">
                              {userCoords ? `GPS: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : 'Detectando tu posición actual'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          Punto de partida
                        </span>
                      </div>

                      {/* Selected Stops In Exact Order */}
                      {selectedOrders.map((ord, idx) => (
                        <div
                          key={ord.orderId}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="w-5 h-5 rounded bg-[#0c315b] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <strong className="text-gray-900 block truncate">{ord.clientName}</strong>
                              <span className="text-[10px] text-gray-500 block truncate">{ord.address}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSelectedOrder(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-gray-500 hover:text-[#0c315b] disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSelectedOrder(idx, 1)}
                              disabled={idx === selectedOrders.length - 1}
                              className="p-1 text-gray-500 hover:text-[#0c315b] disabled:opacity-30"
                              title="Bajar"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSelectOrder(ord.orderId)}
                              className="p-1 text-gray-400 hover:text-rose-600"
                              title="Quitar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600">Total estimado de ruta:</span>
                    <span className="text-base font-black text-[#0c315b]">
                      ${selectedOrders.reduce((s, o) => s + Number(o.total || 0), 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={creatingRoute || selectedOrders.length === 0}
                    onClick={handleCreateRoute}
                    className="w-full py-3 rounded-xl bg-[#0c315b] hover:bg-[#082342] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition"
                  >
                    {creatingRoute ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando Hoja de Ruta...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Programar Ruta y Asignar Chofer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: HISTORIAL DE HOJAS DE RUTA ===================== */}
      {subtab === 'historial' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Historial de Hojas de Ruta</h2>
              <p className="text-xs text-gray-500">
                Todas las rutas generadas, estado en tiempo real, entregas, ausentes y acceso directo a /rutaXX.
              </p>
            </div>

            <div className="flex items-center space-x-1.5 text-xs bg-gray-100 p-1 rounded-lg self-start">
              {[
                { id: 'todos', label: 'Todas' },
                { id: 'en_curso', label: 'En curso' },
                { id: 'finalizada', label: 'Finalizadas' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setHistoryFilter(f.id)}
                  className={`px-3 py-1 rounded-md font-bold transition ${
                    historyFilter === f.id ? 'bg-white text-[#0c315b] shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredHistory.map((trip) => {
              const stops = trip.stops || [];
              const delivered = stops.filter((s) => s.status === 'entregado');
              const absent = stops.filter((s) => s.status === 'ausente');
              const cancelled = stops.filter((s) => s.status === 'cancelado');
              const totalCollected = delivered.reduce((acc, s) => acc + Number(s.total || 0), 0);
              const totalEmpty = delivered.reduce((acc, s) => acc + Number(s.returnedEmpty || 0), 0);
              const isExpanded = expandedTripId === trip.id;
              const isFinished = trip.status === 'finalizada';

              return (
                <div key={trip.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-[#0c315b]">
                          Hoja de Ruta #{trip.tripNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isFinished ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-[#0c315b]'
                        }`}>
                          {isFinished ? 'Finalizada' : 'En curso'}
                        </span>
                        <code className="text-[11px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          /ruta{trip.tripNumber}
                        </code>
                      </div>

                      <p className="text-xs text-gray-700 font-semibold">
                        🚚 {trip.driverName} · {trip.truck}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                        <span>✓ {delivered.length}/{stops.length} entregadas</span>
                        {absent.length > 0 && <span className="text-amber-600 font-semibold">⚠ {absent.length} ausentes</span>}
                        {cancelled.length > 0 && <span className="text-rose-600 font-semibold">✕ {cancelled.length} canceladas</span>}
                        <span className="font-bold text-gray-800">Cobrado: ${totalCollected.toLocaleString()}</span>
                        <span>Vacíos: {totalEmpty}</span>
                        <span>Últ. act: {trip.lastUpdate || '—'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() => handleCopyRouteLink(trip.tripNumber)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold text-gray-700 flex items-center space-x-1"
                      >
                        {copiedPath === trip.tripNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPath === trip.tripNumber ? 'Copiado' : `Copiar /ruta${trip.tripNumber}`}</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppRoute(trip.tripNumber, trip.driverName, trip.driverPhone)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => onOpenDriverTrip && onOpenDriverTrip(trip.id, trip.tripNumber)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </button>

                      <button
                        onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
                        title="Ver paradas"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-3 sm:p-4 space-y-2 text-xs">
                      {stops.map((st) => (
                        <div key={st.id} className="bg-white p-2.5 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded bg-gray-100 font-bold text-gray-700 flex items-center justify-center text-[11px]">
                              #{st.orderNumber}
                            </span>
                            <div>
                              <strong className="text-gray-900">{st.clientName}</strong>
                              <span className="text-gray-500 block text-[11px]">{st.address}</span>
                              {st.skipReason && (
                                <span className="text-[10px] text-amber-700 font-semibold block">Motivo: {st.skipReason}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <span className="font-bold text-[#0c315b]">${Number(st.total || 0).toLocaleString()}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              st.status === 'entregado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.status === 'ausente'
                                ? 'bg-amber-100 text-amber-800'
                                : st.status === 'cancelado'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-sky-100 text-[#0c315b]'
                            }`}>
                              {st.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
