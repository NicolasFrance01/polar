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
  X,
  Users,
  User,
  Package,
  Layers,
  Send
} from 'lucide-react';
import {
  fetchOrders,
  fetchTrips,
  fetchUsers,
  fetchClients,
  createTrip,
  deleteTrip,
  addStopToTrip
} from '../services/api';
import { getStoredOrders, deleteStoredTrip, getStoredTrips, saveTrips } from '../services/tripSync';
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
  const [sourceTab, setSourceTab] = useState('pedidos'); // 'pedidos' | 'clientes'
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]);
  const [focusedOrder, setFocusedOrder] = useState(null);
  const [drivers, setDrivers] = useState(DEFAULT_DRIVERS);
  const [availableSearch, setAvailableSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Per-client delivery configuration when selecting from "Por Clientes"
  const [clientItemsQty, setClientItemsQty] = useState({});
  const [clientProductType, setClientProductType] = useState({});

  // Route assignment mode: 'nueva' (create new trip) or 'sumar_existente' (add stops to an active trip)
  const [routeMode, setRouteMode] = useState('nueva'); // 'nueva' | 'sumar_existente'
  const [targetTripId, setTargetTripId] = useState('');

  // Modal: Add stop/order directly to an existing route
  const [addStopModalTrip, setAddStopModalTrip] = useState(null);
  const [modalSourceTab, setModalSourceTab] = useState('pedidos'); // 'pedidos' | 'clientes'
  const [modalSearch, setModalSearch] = useState('');
  const [modalFeedback, setModalFeedback] = useState('');
  const [addingStop, setAddingStop] = useState(false);

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
      const [dbOrders, dbTrips, dbUsers, dbClients] = await Promise.all([
        fetchOrders(),
        fetchTrips(),
        fetchUsers(),
        fetchClients()
      ]);

      // Normalize orders
      const rawOrders = Array.isArray(dbOrders) && dbOrders.length > 0 ? dbOrders : getStoredOrders();
      const normalized = rawOrders.map((o, idx) => {
        const lat = o.lat ?? o.coords?.lat ?? null;
        const lng = o.lng ?? o.coords?.lng ?? null;
        return {
          orderId: o.orderId || o.id || `POLAR-${90100 + idx}`,
          clientId: o.clientId || o.client_id || null,
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

      // Normalize clients
      let rawClients = Array.isArray(dbClients) && dbClients.length > 0 ? dbClients : [];
      if (rawClients.length === 0) {
        try {
          const storedRaw = localStorage.getItem('polar_clients_v2');
          if (storedRaw) rawClients = JSON.parse(storedRaw);
        } catch (e) {}
      }
      const normalizedClients = (Array.isArray(rawClients) ? rawClients : []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        addressRaw: c.addressRaw || c.address || '',
        address: c.address || c.addressRaw || '',
        neighborhood: c.neighborhood || '',
        containersHeld: c.containersHeld || c.containers_held || { bidon20L: 0, bidon12L: 0, sifon: 0 },
        lat: c.lat || null,
        lng: c.lng || null,
        notes: c.notes || ''
      }));
      setClients(normalizedClients);

      // Normalize trips
      let tripList = [];
      if (dbTrips && typeof dbTrips === 'object') {
        tripList = Object.values(dbTrips).sort((a, b) => (b.tripNumber || 0) - (a.tripNumber || 0));
      } else {
        const stored = getStoredTrips();
        tripList = Object.values(stored).sort((a, b) => (b.tripNumber || 0) - (a.tripNumber || 0));
      }
      setTripsHistory(tripList);
      if (!targetTripId && tripList.length > 0) {
        const activeTrip = tripList.find(t => t.status !== 'finalizada') || tripList[0];
        setTargetTripId(activeTrip.id);
      }

      // Normalize drivers
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

  const isStopSelected = (stopId) => selectedStops.some((s) => s.id === stopId);

  const toggleSelectOrder = (ord) => {
    setFocusedOrder(ord);
    setSelectedStops((prev) => {
      if (prev.some((s) => s.id === ord.orderId)) {
        return prev.filter((s) => s.id !== ord.orderId);
      }
      return [
        ...prev,
        {
          id: ord.orderId,
          source: 'order',
          orderRef: ord.orderId,
          clientId: ord.clientId || null,
          clientName: ord.clientName,
          clientPhone: ord.clientPhone,
          address: `${ord.address}${ord.neighborhood ? `, ${ord.neighborhood}` : ''}`,
          neighborhood: ord.neighborhood || '',
          coords: ord.coords,
          items: ord.items?.length ? ord.items : [{ name: 'Bidón de Agua de Mesa 20L', qty: 1, price: 4200 }],
          total: Number(ord.total) || 4200,
          notes: ord.notes || ''
        }
      ];
    });
  };

  const toggleSelectClient = (cli) => {
    const stopId = `cli-${cli.id}`;
    setSelectedStops((prev) => {
      if (prev.some((s) => s.id === stopId)) {
        return prev.filter((s) => s.id !== stopId);
      }
      const qty = clientItemsQty[cli.id] || 2;
      const pType = clientProductType[cli.id] || 'bidon20';
      let prodName = 'Bidón de Agua de Mesa 20L';
      let price = 4200;
      if (pType === 'sifon') {
        prodName = 'Sifón de Soda 1,5 Litros';
        price = 1300;
      } else if (pType === 'bidon12') {
        prodName = 'Bidón de Agua 12L con Canilla';
        price = 3300;
      }
      const items = [{ name: prodName, qty, price }];
      const total = qty * price;

      return [
        ...prev,
        {
          id: stopId,
          source: 'client',
          orderRef: null,
          clientId: cli.id,
          clientName: cli.name,
          clientPhone: cli.phone || '',
          address: `${cli.address || cli.addressRaw || ''}`,
          neighborhood: cli.neighborhood || '',
          coords: (cli.lat && cli.lng) ? { lat: Number(cli.lat), lng: Number(cli.lng) } : null,
          items,
          total,
          notes: cli.notes || ''
        }
      ];
    });
  };

  const updateStopQty = (stopId, delta) => {
    setSelectedStops((prev) =>
      prev.map((s) => {
        if (s.id !== stopId) return s;
        const first = s.items?.[0] || { name: 'Bidón de Agua de Mesa 20L', qty: 1, price: 4200 };
        const newQty = Math.max(1, (Number(first.qty) || 1) + delta);
        const updatedItems = [{ ...first, qty: newQty }];
        const newTotal = updatedItems.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
        return {
          ...s,
          items: updatedItems,
          total: newTotal
        };
      })
    );
  };

  const removeSelectedStop = (stopId) => {
    setSelectedStops((prev) => prev.filter((s) => s.id !== stopId));
  };

  const moveSelectedStop = (idx, direction) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= selectedStops.length) return;
    const copy = [...selectedStops];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    setSelectedStops(copy);
  };

  const handleDriverSelect = (name) => {
    setSelectedDriverName(name);
    const found = drivers.find((d) => d.name === name);
    if (found) {
      setDriverPhone(found.phone);
      setTruck(found.truck);
    }
  };

  const handleCreateRoute = async () => {
    if (selectedStops.length === 0) {
      alert('Seleccioná al menos un pedido o cliente para armar la Hoja de Ruta.');
      return;
    }

    setCreatingRoute(true);
    try {
      // MODE 1: Create a brand new trip
      if (routeMode === 'nueva') {
        const stopsPayload = selectedStops.map((s) => ({
          orderRef: s.orderRef || null,
          clientId: s.clientId || null,
          clientName: s.clientName,
          address: s.address,
          phone: s.clientPhone,
          coords: s.coords,
          items: s.items,
          total: s.total,
          notes: s.notes
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

        // Mirror to localStorage and broadcast event to driver portal
        const nextTripNumber = res.tripNumber;
        const newTripId = res.tripId || `VIAJE-${nextTripNumber}`;
        const stored = getStoredTrips();
        stored[newTripId] = {
          id: newTripId,
          tripNumber: nextTripNumber,
          driverName: selectedDriverName,
          driverPhone,
          truck,
          zone: 'General',
          status: 'en_curso',
          lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stops: stopsPayload.map((sp, idx) => ({
            id: `stop-${Date.now()}-${idx}`,
            orderNumber: idx + 1,
            orderRef: sp.orderRef,
            clientId: sp.clientId,
            clientName: sp.clientName,
            address: sp.address,
            phone: sp.phone,
            coords: sp.coords,
            items: sp.items,
            total: sp.total,
            status: idx === 0 ? 'en_camino' : 'pendiente',
            isNext: idx === 0,
            notes: sp.notes
          }))
        };
        saveTrips(stored);

        setCreatedRouteResult({
          tripId: newTripId,
          tripNumber: nextTripNumber,
          routePath: res.routePath || `/ruta${nextTripNumber}`,
          driverName: selectedDriverName,
          driverPhone,
          stopsCount: selectedStops.length
        });

        setSelectedStops([]);
        setRouteNotes('');
        await loadAllData();
      } else {
        // MODE 2: Add selected stops to an EXISTING active trip
        const targetTrip = tripsHistory.find((t) => t.id === targetTripId);
        if (!targetTrip) {
          alert('Por favor seleccioná una Hoja de Ruta de destino.');
          return;
        }

        for (const s of selectedStops) {
          await addStopToTrip(targetTrip.id, {
            orderRef: s.orderRef || null,
            clientId: s.clientId || null,
            clientName: s.clientName,
            address: s.address,
            phone: s.clientPhone,
            coords: s.coords,
            items: s.items,
            total: s.total,
            notes: s.notes
          });
        }

        // Mirror to localStorage and broadcast to driver portal
        const stored = getStoredTrips();
        if (stored && stored[targetTrip.id]) {
          const currentStops = stored[targetTrip.id].stops || [];
          let currentOrderNum = currentStops.length;
          const newStops = selectedStops.map((s, idx) => ({
            id: `stop-${Date.now()}-${idx}`,
            orderNumber: currentOrderNum + idx + 1,
            orderRef: s.orderRef || null,
            clientId: s.clientId || null,
            clientName: s.clientName,
            address: s.address,
            phone: s.clientPhone,
            coords: s.coords,
            items: s.items,
            total: s.total,
            status: 'pendiente',
            isNext: false,
            notes: s.notes || ''
          }));
          stored[targetTrip.id].stops = [...currentStops, ...newStops];
          stored[targetTrip.id].lastUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          saveTrips(stored);
        }

        alert(`¡Se sumaron ${selectedStops.length} paradas a la Hoja de Ruta #${targetTrip.tripNumber}! El repartidor ya tiene la ruta actualizada.`);
        setSelectedStops([]);
        await loadAllData();
      }
    } catch (err) {
      alert('Error al programar la ruta: ' + err.message);
    } finally {
      setCreatingRoute(false);
    }
  };

  // Add a single stop (order or client) directly to an existing route from modal
  const handleAddStopToExistingTrip = async (trip, stopData) => {
    setAddingStop(true);
    setModalFeedback('');
    try {
      const payload = {
        orderRef: stopData.orderRef || null,
        clientId: stopData.clientId || null,
        clientName: stopData.clientName,
        address: stopData.address,
        phone: stopData.clientPhone || stopData.phone || '',
        coords: stopData.coords || null,
        items: stopData.items || [{ name: 'Bidón de Agua de Mesa 20L', qty: 2, price: 4200 }],
        total: Number(stopData.total) || 8400,
        notes: stopData.notes || ''
      };

      const res = await addStopToTrip(trip.id, payload);

      // Local storage update & live broadcast to driver
      const stored = getStoredTrips();
      if (stored && stored[trip.id]) {
        const currentStops = stored[trip.id].stops || [];
        const newStop = {
          id: res?.stopId || `stop-${Date.now()}`,
          orderNumber: currentStops.length + 1,
          orderRef: payload.orderRef,
          clientId: payload.clientId,
          clientName: payload.clientName,
          address: payload.address,
          phone: payload.phone,
          coords: payload.coords,
          items: payload.items,
          total: payload.total,
          status: 'pendiente',
          isNext: currentStops.length === 0,
          notes: payload.notes
        };
        stored[trip.id].stops = [...currentStops, newStop];
        stored[trip.id].lastUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        saveTrips(stored);
      }

      setModalFeedback(`¡Parada agregada con éxito a ${stopData.clientName}! Se actualizó la ruta del chofer.`);
      await loadAllData();
      setTimeout(() => {
        setModalFeedback('');
      }, 2000);
    } catch (err) {
      alert('Error al agregar parada: ' + err.message);
    } finally {
      setAddingStop(false);
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

  const handleDeleteTripFromHistory = async (trip) => {
    if (!window.confirm(`¿Estás seguro de que deseás eliminar la Hoja de Ruta #${trip.tripNumber} del historial?\n\nLos pedidos incluidos volverán a quedar disponibles en la lista de pedidos.`)) {
      return;
    }
    try {
      await deleteTrip(trip.id);
      deleteStoredTrip(trip.id);
      await loadAllData();
    } catch (err) {
      alert('Error al eliminar la hoja de ruta: ' + err.message);
    }
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
                  type="button"
                  onClick={() => {
                    const foundTrip = tripsHistory.find(t => t.tripNumber === createdRouteResult.tripNumber) || {
                      id: createdRouteResult.tripId || `VIAJE-${createdRouteResult.tripNumber}`,
                      tripNumber: createdRouteResult.tripNumber,
                      driverName: createdRouteResult.driverName,
                      truck: truck
                    };
                    setAddStopModalTrip(foundTrip);
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1 shadow-2xs"
                  title="Sumar más paradas a esta ruta"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Sumar Parada a esta Ruta</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyRouteLink(createdRouteResult.tripNumber)}
                  className="px-3 py-2 rounded-lg bg-white border border-emerald-300 font-bold text-emerald-800 hover:bg-emerald-100 flex items-center space-x-1"
                >
                  {copiedPath === createdRouteResult.tripNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath === createdRouteResult.tripNumber ? '¡Copiado!' : 'Copiar /ruta' + createdRouteResult.tripNumber}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppRoute(createdRouteResult.tripNumber, createdRouteResult.driverName, createdRouteResult.driverPhone)}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enviar al Chofer</span>
                </button>
                <button
                  type="button"
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
            {/* LEFT: Orders list / Clients list + Map */}
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
                    {selectedStops.length >= 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0c315b]">
                        +{selectedStops.length} {selectedStops.length === 1 ? 'parada' : 'paradas'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleMapsDirectionsAppUrl(selectedStops.length > 0 ? selectedStops : (focusedOrder ? [focusedOrder] : []), userCoords)}
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
                        {selectedStops.length > 0 ? (
                          <>
                            📍 Inicio: Mi ubicación ➔ {selectedStops.map((s, idx) => `${idx + 1}. ${s.clientName}`).join(' ➔ ')}
                          </>
                        ) : focusedOrder ? (
                          <>📍 Inicio: Mi ubicación ➔ 1. {focusedOrder.clientName} ({focusedOrder.address})</>
                        ) : (
                          <>Google Maps · Seleccioná pedidos o clientes para unir las paradas desde tu ubicación actual</>
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
                    src={getGoogleMapsRouteEmbedUrl(selectedStops.length > 0 ? selectedStops : (focusedOrder ? [focusedOrder] : []), userCoords)}
                    className="w-full flex-1 border-0"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* DUAL SELECTOR: Pedidos Disponibles vs Por Clientes */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
                  <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSourceTab('pedidos')}
                      className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                        sourceTab === 'pedidos' ? 'bg-[#0c315b] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Pedidos Disponibles ({filteredAvailableOrders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceTab('clientes')}
                      className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                        sourceTab === 'clientes' ? 'bg-[#0c315b] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Por Clientes ({filteredClients.length})</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold text-[#0c315b] self-end sm:self-auto">
                    {selectedStops.length} paradas en ruta
                  </span>
                </div>

                {/* TAB CONTENT 1: PEDIDOS DISPONIBLES */}
                {sourceTab === 'pedidos' && (
                  <div className="space-y-2.5">
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
                        const isSelected = isStopSelected(ord.orderId);
                        const isFocused = focusedOrder?.orderId === ord.orderId;
                        const alreadyAssigned = Boolean(ord.tripId);

                        return (
                          <div
                            key={ord.orderId}
                            onClick={() => toggleSelectOrder(ord)}
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
                                  toggleSelectOrder(ord);
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
                )}

                {/* TAB CONTENT 2: POR CLIENTES */}
                {sourceTab === 'clientes' && (
                  <div className="space-y-2.5">
                    {/* Search Bar for Clients */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar cliente por nombre, dirección o teléfono..."
                        className="w-full pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
                      />
                      {clientSearch && (
                        <button
                          onClick={() => setClientSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-xs text-gray-400">
                          {clients.length === 0 
                            ? 'No hay clientes cargados en el sistema.' 
                            : 'No se encontraron clientes que coincidan con la búsqueda.'}
                        </div>
                      ) : filteredClients.map((cli) => {
                        const stopId = `cli-${cli.id}`;
                        const isSelected = isStopSelected(stopId);

                        return (
                          <div
                            key={cli.id}
                            className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-[#0c315b] bg-sky-50/50 ring-1 ring-[#0c315b]/20'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[#0c315b]" />
                                <strong className="text-xs sm:text-sm text-gray-900 truncate">{cli.name}</strong>
                                {cli.phone && (
                                  <span className="text-[11px] text-gray-500 font-mono flex items-center gap-0.5">
                                    <Phone className="w-2.5 h-2.5 text-gray-400" />
                                    {cli.phone}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                📍 {cli.address}{cli.neighborhood ? ` (${cli.neighborhood})` : ''}
                              </p>

                              {/* Containers held badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                                <span className="text-gray-400 font-medium">Envases:</span>
                                <span className="bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                                  20L: {cli.containersHeld?.bidon20L || 0}
                                </span>
                                <span className="bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                                  12L: {cli.containersHeld?.bidon12L || 0}
                                </span>
                                <span className="bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                                  Sifón: {cli.containersHeld?.sifon || 0}
                                </span>
                              </div>
                            </div>

                            {/* Client item config and add button */}
                            <div className="flex flex-wrap items-center gap-2 sm:self-center">
                              <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs">
                                <select
                                  value={clientProductType[cli.id] || 'bidon20'}
                                  onChange={(e) => setClientProductType({ ...clientProductType, [cli.id]: e.target.value })}
                                  disabled={isSelected}
                                  className="bg-transparent font-bold text-gray-700 outline-none text-xs"
                                >
                                  <option value="bidon20">Bidón 20L ($4.200)</option>
                                  <option value="sifon">Sifón 1.5L ($1.300)</option>
                                  <option value="bidon12">Bidón 12L ($3.300)</option>
                                </select>

                                <div className="flex items-center space-x-1 pl-1 border-l border-gray-200">
                                  <button
                                    type="button"
                                    disabled={isSelected}
                                    onClick={() => {
                                      const cur = clientItemsQty[cli.id] || 2;
                                      setClientItemsQty({ ...clientItemsQty, [cli.id]: Math.max(1, cur - 1) });
                                    }}
                                    className="w-5 h-5 rounded bg-white border border-gray-300 font-bold flex items-center justify-center text-[11px]"
                                  >
                                    -
                                  </button>
                                  <span className="w-5 text-center font-black text-xs text-[#0c315b]">
                                    {clientItemsQty[cli.id] || 2}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isSelected}
                                    onClick={() => {
                                      const cur = clientItemsQty[cli.id] || 2;
                                      setClientItemsQty({ ...clientItemsQty, [cli.id]: cur + 1 });
                                    }}
                                    className="w-5 h-5 rounded bg-[#0c315b] text-white font-bold flex items-center justify-center text-[11px]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleSelectClient(cli)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-2xs ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-[#0c315b] text-white hover:bg-[#082342]'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>En la Ruta</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Agregar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                    <span className="text-[11px] text-gray-500">Asigná pedidos o clientes al chofer en tiempo real</span>
                  </div>
                </div>

                {/* Assignment Mode Toggle: Nueva Ruta vs Sumar a Ruta Existente */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRouteMode('nueva')}
                    className={`py-1.5 rounded-lg transition ${
                      routeMode === 'nueva' ? 'bg-[#0c315b] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    + Nueva Hoja de Ruta
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteMode('sumar_existente')}
                    className={`py-1.5 rounded-lg transition ${
                      routeMode === 'sumar_existente' ? 'bg-[#0c315b] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🚚 Sumar a Ruta en Curso
                  </button>
                </div>

                {/* MODE 1: Driver & Truck Inputs */}
                {routeMode === 'nueva' ? (
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
                ) : (
                  /* MODE 2: Target existing route picker */
                  <div className="space-y-2 text-xs">
                    <label className="font-bold text-gray-700 block">Elegir Hoja de Ruta Activa para Sumar:</label>
                    <select
                      value={targetTripId}
                      onChange={(e) => setTargetTripId(e.target.value)}
                      className="w-full px-3 py-2 border border-sky-300 bg-sky-50/50 rounded-lg font-bold text-gray-900 outline-none focus:border-[#0c315b]"
                    >
                      {tripsHistory.filter(t => t.status !== 'finalizada').length === 0 ? (
                        <option value="">No hay rutas en curso activas</option>
                      ) : tripsHistory.filter(t => t.status !== 'finalizada').map((t) => (
                        <option key={t.id} value={t.id}>
                          Hoja de Ruta #{t.tripNumber} — {t.driverName} ({t.stops?.length || 0} paradas)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-sky-800 bg-sky-50 p-2 rounded-lg border border-sky-200">
                      💡 Las paradas marcadas se sumarán al final de esta ruta y el repartidor verá el nuevo mapa al instante sin recargar.
                    </p>
                  </div>
                )}

                {/* Ordered Stops Preview */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">
                      Orden de Paradas ({selectedStops.length})
                    </span>
                    {selectedStops.length > 0 && (
                      <button
                        onClick={() => setSelectedStops([])}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>

                  {selectedStops.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-400">
                      Marcá pedidos o clientes de las pestañas de la izquierda para armar el recorrido.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
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
                      {selectedStops.map((st, idx) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded bg-[#0c315b] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <strong className="text-gray-900 truncate">{st.clientName}</strong>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  st.source === 'client' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                                }`}>
                                  {st.source === 'client' ? 'Cliente' : `#${st.orderRef}`}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 block truncate">{st.address}</span>

                              {/* Items and Stepper */}
                              <div className="flex items-center justify-between gap-1 pt-1 mt-0.5 border-t border-gray-200/60">
                                <span className="text-[10px] text-gray-600 truncate">
                                  {st.items.map(it => `${it.qty}x ${it.name}`).join(', ')}
                                </span>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateStopQty(st.id, -1)}
                                    className="w-4 h-4 rounded bg-white border border-gray-300 font-bold flex items-center justify-center text-[10px]"
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateStopQty(st.id, 1)}
                                    className="w-4 h-4 rounded bg-[#0c315b] text-white font-bold flex items-center justify-center text-[10px]"
                                  >
                                    +
                                  </button>
                                  <strong className="text-[#0c315b] text-[11px] font-mono pl-1">
                                    ${Number(st.total || 0).toLocaleString()}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSelectedStop(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-gray-500 hover:text-[#0c315b] disabled:opacity-30"
                              title="Subir"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSelectedStop(idx, 1)}
                              disabled={idx === selectedStops.length - 1}
                              className="p-1 text-gray-500 hover:text-[#0c315b] disabled:opacity-30"
                              title="Bajar"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSelectedStop(st.id)}
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
                      ${selectedStops.reduce((s, st) => s + Number(st.total || 0), 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={creatingRoute || selectedStops.length === 0}
                    onClick={handleCreateRoute}
                    className="w-full py-3 rounded-xl bg-[#0c315b] hover:bg-[#082342] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition"
                  >
                    {creatingRoute ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{routeMode === 'nueva' ? 'Generando Hoja de Ruta...' : 'Sumando paradas a la ruta...'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>
                          {routeMode === 'nueva'
                            ? `Programar Ruta y Asignar Chofer (${selectedStops.length} paradas)`
                            : `Sumar ${selectedStops.length} Paradas a Hoja de Ruta #${tripsHistory.find(t => t.id === targetTripId)?.tripNumber || ''}`}
                        </span>
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
                      {/* Button to add a stop/order to this route */}
                      {!isFinished && (
                        <button
                          type="button"
                          onClick={() => setAddStopModalTrip(trip)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0c315b] border border-sky-300 font-bold flex items-center space-x-1 transition shadow-2xs"
                          title="Sumar pedido o cliente a esta hoja de ruta en curso"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Sumar Parada</span>
                        </button>
                      )}

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
                        onClick={() => handleDeleteTripFromHistory(trip)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                        title="Eliminar hoja de ruta del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      {/* ===================== MODAL: AGREGAR PARADA A HOJA DE RUTA EXISTENTE ===================== */}
      {addStopModalTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  Hoja de Ruta #{addStopModalTrip.tripNumber} en Curso
                </span>
                <h3 className="font-black text-base text-gray-900 leading-tight">
                  Sumar Parada / Pedido a la Ruta
                </h3>
                <span className="text-xs text-gray-500 block">
                  Chofer: <strong>{addStopModalTrip.driverName}</strong> · {addStopModalTrip.truck}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAddStopModalTrip(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{modalFeedback}</span>
              </div>
            )}

            {/* Modal Source Tabs */}
            <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalSourceTab('pedidos')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                  modalSourceTab === 'pedidos' ? 'bg-[#0c315b] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Pedidos Disponibles</span>
              </button>
              <button
                type="button"
                onClick={() => setModalSourceTab('clientes')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                  modalSourceTab === 'clientes' ? 'bg-[#0c315b] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Clientes del Sistema</span>
              </button>
            </div>

            {/* Modal Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Buscar por cliente, dirección o teléfono..."
                className="w-full pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
              />
              {modalSearch && (
                <button
                  onClick={() => setModalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Modal Lists */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {modalSourceTab === 'pedidos' ? (
                orders
                  .filter((o) => {
                    if (o.tripId === addStopModalTrip.id) return false;
                    if (!modalSearch.trim()) return true;
                    const term = modalSearch.toLowerCase();
                    return (
                      (o.clientName && o.clientName.toLowerCase().includes(term)) ||
                      (o.address && o.address.toLowerCase().includes(term)) ||
                      (o.orderId && o.orderId.toLowerCase().includes(term))
                    );
                  })
                  .map((ord) => (
                    <div
                      key={ord.orderId}
                      className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <strong className="text-xs text-gray-900 block truncate">{ord.clientName}</strong>
                        <span className="text-[10px] text-gray-500 block truncate">📍 {ord.address}</span>
                        <span className="text-[10px] text-sky-800 font-bold block">
                          ${Number(ord.total || 0).toLocaleString()} · {ord.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={addingStop}
                        onClick={() => handleAddStopToExistingTrip(addStopModalTrip, {
                          orderRef: ord.orderId,
                          clientId: ord.clientId,
                          clientName: ord.clientName,
                          clientPhone: ord.clientPhone,
                          address: `${ord.address}${ord.neighborhood ? `, ${ord.neighborhood}` : ''}`,
                          coords: ord.coords,
                          items: ord.items,
                          total: ord.total,
                          notes: ord.notes
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs flex items-center space-x-1 flex-shrink-0 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Sumar a Ruta</span>
                      </button>
                    </div>
                  ))
              ) : (
                clients
                  .filter((c) => {
                    if (!modalSearch.trim()) return true;
                    const term = modalSearch.toLowerCase();
                    return (
                      (c.name && c.name.toLowerCase().includes(term)) ||
                      (c.address && c.address.toLowerCase().includes(term)) ||
                      (c.phone && c.phone.toLowerCase().includes(term))
                    );
                  })
                  .map((cli) => (
                    <div
                      key={cli.id}
                      className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <strong className="text-xs text-gray-900 block truncate">{cli.name}</strong>
                        <span className="text-[10px] text-gray-500 block truncate">📍 {cli.address}</span>
                        <span className="text-[10px] text-gray-400 block font-mono">📞 {cli.phone || 'Sin tel'}</span>
                      </div>
                      <button
                        type="button"
                        disabled={addingStop}
                        onClick={() => handleAddStopToExistingTrip(addStopModalTrip, {
                          orderRef: null,
                          clientId: cli.id,
                          clientName: cli.name,
                          clientPhone: cli.phone,
                          address: `${cli.address}${cli.neighborhood ? `, ${cli.neighborhood}` : ''}`,
                          coords: (cli.lat && cli.lng) ? { lat: Number(cli.lat), lng: Number(cli.lng) } : null,
                          items: [{ name: 'Bidón de Agua de Mesa 20L', qty: 2, price: 4200 }],
                          total: 8400,
                          notes: cli.notes || ''
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs flex items-center space-x-1 flex-shrink-0 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Sumar a Ruta</span>
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAddStopModalTrip(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
