import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  MessageCircle, 
  CheckCircle, 
  Navigation, 
  Check, 
  X,
  Radio,
  FileText,
  Map as MapIcon,
  ClipboardList,
  SkipForward,
  AlertTriangle,
  XCircle,
  Phone,
  Flag,
  ExternalLink,
  Plus,
  Trash2,
  ChevronDown,
  Package,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredTrips, saveTrips, subscribeToTripUpdates } from '../services/tripSync';
import { 
  fetchTripByNumber, 
  updateDriverCoords, 
  updateStopStatus, 
  setNextStop, 
  finishTrip 
} from '../services/api';
import {
  getGoogleMapsRouteEmbedUrl,
  getGoogleMapsDirectionsAppUrl,
  getWazeStopUrl,
  fetchOSRMStreetRoute
} from '../services/mapRouting';

export default function DriverTripPortal({ tripId = 'VIAJE-25', tripNumber = null, onBackToAdmin, onOpenComprobante }) {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'mapa'
  const [driverMapType, setDriverMapType] = useState('google'); // 'google' | 'gps'
  const [selectedMapStop, setSelectedMapStop] = useState(null);

  // Delivery modal with full multi-product breakdown & itemized empty containers
  const [activeStopModal, setActiveStopModal] = useState(null);
  const [deliveryItems, setDeliveryItems] = useState([]);
  const [returnedContainers, setReturnedContainers] = useState([]);
  const [showAddContainerMenu, setShowAddContainerMenu] = useState(false);
  const [paymentType, setPaymentType] = useState('Efectivo');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showAddProductMenu, setShowAddProductMenu] = useState(false);

  // Skip / Absent / Cancel modal
  const [skipModalStop, setSkipModalStop] = useState(null);
  const [skipAction, setSkipAction] = useState('ausente'); // 'ausente' | 'cancelado'
  const [skipReason, setSkipReason] = useState('No atendió timbre / Puerta cerrada');

  // Live GPS state (auto-connected so system tracks the driver continuously)
  const [isTransmittingGps, setIsTransmittingGps] = useState(true);
  const [driverCoords, setDriverCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Conectando GPS...');
  const lastPushRef = useRef(0);

  // Leaflet map refs for driver view
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);

  const resolvedTripNumber = tripNumber || (String(tripId).match(/\d+/)?.[0] ? parseInt(String(tripId).match(/\d+/)[0], 10) : 25);

  const loadTrip = async () => {
    const dbTrip = await fetchTripByNumber(resolvedTripNumber);
    if (dbTrip) {
      setCurrentTrip(dbTrip);
      if (!selectedMapStop && dbTrip.stops?.length) {
        const nextStop = dbTrip.stops.find((s) => s.isNext) || dbTrip.stops.find((s) => s.status !== 'entregado') || dbTrip.stops[0];
        setSelectedMapStop(nextStop);
      }
      setLoading(false);
      return;
    }

    // Fallback to localStorage if offline
    const stored = getStoredTrips();
    const fallback = stored[`VIAJE-${resolvedTripNumber}`] || stored[tripId] || Object.values(stored)[0];
    setCurrentTrip(fallback);
    setLoading(false);
  };

  useEffect(() => {
    loadTrip();
    const unsub = subscribeToTripUpdates((trips) => {
      if (!trips) return;
      const targetId = `VIAJE-${resolvedTripNumber}`;
      const match = trips[targetId] || trips[tripId];
      if (match) {
        setCurrentTrip(match);
      }
    });
    return () => {
      unsub && unsub();
    };
  }, [resolvedTripNumber, tripId]);

  // Continuous Live GPS Watch + periodic sync to PostgreSQL
  useEffect(() => {
    if (!isTransmittingGps || !navigator.geolocation || !currentTrip?.id) {
      if (!isTransmittingGps) setGpsStatus('GPS pausado');
      return;
    }

    setGpsStatus('Sincronizando GPS en vivo...');
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverCoords(newCoords);
        setGpsStatus(`GPS En Vivo (±${Math.round(pos.coords.accuracy)}m)`);

        const now = Date.now();
        if (now - lastPushRef.current > 5000) {
          lastPushRef.current = now;
          updateDriverCoords(currentTrip.id, newCoords.lat, newCoords.lng);

          // Also mirror to localStorage/BroadcastChannel for same-browser tabs
          const stored = getStoredTrips();
          if (stored[currentTrip.id]) {
            stored[currentTrip.id].driverCoords = newCoords;
            stored[currentTrip.id].lastUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            saveTrips(stored);
          }
        }
      },
      () => {
        setGpsStatus('Esperando permiso de ubicación...');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTransmittingGps, currentTrip?.id]);

  // Leaflet cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  // Render Leaflet map when switching to 'mapa' view
  useEffect(() => {
    if (viewMode !== 'mapa' || !window.L || !mapRef.current || !currentTrip) return;

    if (!leafletRef.current) {
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }
      const center = driverCoords
        ? [driverCoords.lat, driverCoords.lng]
        : currentTrip.driverCoords
        ? [currentTrip.driverCoords.lat, currentTrip.driverCoords.lng]
        : [-31.4089, -64.1956];

      const map = window.L.map(mapRef.current, { center, zoom: 14 });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map);
      leafletRef.current = map;
    }

    const map = leafletRef.current;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const activeDriverPos = driverCoords || currentTrip.driverCoords;
    if (activeDriverPos) {
      const truckIcon = window.L.divIcon({
        className: 'driver-live-pin',
        html: `<div style="background:#0c315b;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #38bdf8;box-shadow:0 3px 10px rgba(0,0,0,0.35);font-size:16px;">🚚</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      const tm = window.L.marker([activeDriverPos.lat, activeDriverPos.lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup('Tu ubicación actual');
      markersRef.current.push(tm);
    }

    const latlngs = [];
    if (activeDriverPos) {
      latlngs.push([activeDriverPos.lat, activeDriverPos.lng]);
    }
    (currentTrip.stops || []).forEach((s) => {
      if (!s.coords?.lat || !s.coords?.lng) return;
      const color =
        s.status === 'entregado'
          ? '#10b981'
          : s.status === 'ausente'
          ? '#f59e0b'
          : s.status === 'cancelado'
          ? '#ef4444'
          : s.isNext
          ? '#0c315b'
          : '#0284c7';

      const stopIcon = window.L.divIcon({
        className: 'stop-map-pin',
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);color:white;font-weight:800;font-size:12px;">${s.status === 'entregado' ? '✓' : s.orderNumber}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const sm = window.L.marker([s.coords.lat, s.coords.lng], { icon: stopIcon })
        .addTo(map)
        .on('click', () => setSelectedMapStop(s));
      markersRef.current.push(sm);
      latlngs.push([s.coords.lat, s.coords.lng]);
    });

    if (latlngs.length > 1) {
      fetchOSRMStreetRoute(latlngs).then((streetPath) => {
        if (!leafletRef.current) return;
        const lineCoords = (streetPath && streetPath.length > 0) ? streetPath : latlngs;
        const line = window.L.polyline(lineCoords, {
          color: '#0284c7',
          weight: 4,
          opacity: 0.9
        }).addTo(map);
        markersRef.current.push(line);
      });
    }

    setTimeout(() => map.invalidateSize(), 150);
  }, [viewMode, driverMapType, currentTrip, driverCoords]);

  const CATALOG_PRODUCTS = [
    { name: 'Bidón de Agua de Mesa 20L', price: 4200 },
    { name: 'Bidón de Agua 12L con Canilla', price: 3300 },
    { name: 'Sifón de Soda 1,5 Litros', price: 1300 },
    { name: 'Dispenser Natural Frío/Calor POLAR', price: 48000 }
  ];

  const RETURNABLE_CONTAINER_CATALOG = [
    { type: 'bidon20L', name: 'Bidón 20L Vacío' },
    { type: 'sifon', name: 'Sifón Soda 1,5L Vacío' },
    { type: 'bidon12L', name: 'Bidón 12L Vacío' }
  ];

  const handleOpenDelivery = (stop) => {
    setActiveStopModal(stop);
    let items = [];
    if (Array.isArray(stop.items)) {
      items = stop.items;
    } else if (typeof stop.items === 'string') {
      try { items = JSON.parse(stop.items); } catch { items = []; }
    }
    if (!Array.isArray(items) || items.length === 0) {
      items = [{ name: 'Bidón de Agua de Mesa 20L', qty: 1, price: 4200 }];
    }

    const cloned = items.map((it) => {
      const name = it.name || 'Bidón de Agua de Mesa 20L';
      let defaultPrice = 4200;
      const lower = name.toLowerCase();
      if (lower.includes('12l')) defaultPrice = 3300;
      else if (lower.includes('sif') || lower.includes('soda')) defaultPrice = 1300;
      else if (lower.includes('dispenser')) defaultPrice = 48000;

      return {
        name,
        qty: Number(it.qty) || 1,
        price: Number(it.price) || defaultPrice
      };
    });

    setDeliveryItems(cloned);

    // Initial itemized empty containers: dynamically detect from items ordered (1:1 exchange)
    const returnableMap = {};
    cloned.forEach((it) => {
      const lower = (it.name || '').toLowerCase();
      const q = Number(it.qty) || 0;
      if (q <= 0) return;

      if (lower.includes('12l') || (lower.includes('bid') && lower.includes('12'))) {
        returnableMap['bidon12L'] = (returnableMap['bidon12L'] || 0) + q;
      } else if (lower.includes('20l') || (lower.includes('bid') && !lower.includes('12'))) {
        returnableMap['bidon20L'] = (returnableMap['bidon20L'] || 0) + q;
      } else if (lower.includes('sif') || lower.includes('soda')) {
        returnableMap['sifon'] = (returnableMap['sifon'] || 0) + q;
      }
    });

    const initialReturned = [];
    if (returnableMap['bidon20L']) {
      initialReturned.push({ type: 'bidon20L', name: 'Bidón 20L Vacío', qty: returnableMap['bidon20L'] });
    }
    if (returnableMap['sifon']) {
      initialReturned.push({ type: 'sifon', name: 'Sifón Soda 1,5L Vacío', qty: returnableMap['sifon'] });
    }
    if (returnableMap['bidon12L']) {
      initialReturned.push({ type: 'bidon12L', name: 'Bidón 12L Vacío', qty: returnableMap['bidon12L'] });
    }

    if (initialReturned.length === 0) {
      initialReturned.push({ type: 'bidon20L', name: 'Bidón 20L Vacío', qty: 0 });
    }

    setReturnedContainers(initialReturned);
    setShowAddContainerMenu(false);

    setPaymentType(stop.paymentMethod || 'Efectivo');
    setDeliveryNotes(stop.notes || '');
    setShowAddProductMenu(false);
  };

  const handleUpdateItemQty = (index, delta) => {
    setDeliveryItems(prev => {
      const updated = [...prev];
      const newQty = Math.max(0, (Number(updated[index].qty) || 0) + delta);
      updated[index] = { ...updated[index], qty: newQty };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setDeliveryItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddCatalogProduct = (prod) => {
    setDeliveryItems(prev => {
      const existingIdx = prev.findIndex(it => it.name.toLowerCase() === prod.name.toLowerCase());
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], qty: (Number(updated[existingIdx].qty) || 0) + 1 };
        return updated;
      }
      return [...prev, { name: prod.name, qty: 1, price: prod.price }];
    });
    setShowAddProductMenu(false);
  };

  const handleUpdateContainerQty = (index, delta) => {
    setReturnedContainers(prev => {
      const updated = [...prev];
      const newQty = Math.max(0, (Number(updated[index].qty) || 0) + delta);
      updated[index] = { ...updated[index], qty: newQty };
      return updated;
    });
  };

  const handleRemoveContainer = (index) => {
    setReturnedContainers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddReturnedContainer = (cont) => {
    setReturnedContainers(prev => {
      const existingIdx = prev.findIndex(c => c.type === cont.type);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], qty: (Number(updated[existingIdx].qty) || 0) + 1 };
        return updated;
      }
      return [...prev, { type: cont.type, name: cont.name, qty: 1 }];
    });
    setShowAddContainerMenu(false);
  };

  const calculatedTotal = deliveryItems.reduce((acc, it) => acc + ((Number(it.qty) || 0) * (Number(it.price) || 0)), 0);
  const totalReturnedEmpty = returnedContainers.reduce((acc, c) => acc + (Number(c.qty) || 0), 0);

  const handleConfirmDelivery = async () => {
    if (!activeStopModal || !currentTrip) return;

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (e) {}

    const deliveredTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalItems = deliveryItems.filter(it => (Number(it.qty) || 0) > 0);
    const activeReturnedContainers = returnedContainers.filter(c => (Number(c.qty) || 0) > 0);
    const totalReturnedCount = activeReturnedContainers.reduce((sum, c) => sum + (Number(c.qty) || 0), 0);

    // 1. API update
    await updateStopStatus(activeStopModal.id, {
      tripId: currentTrip.id,
      status: 'entregado',
      deliveredAt: deliveredTime,
      returnedEmpty: totalReturnedCount,
      returnedContainers: activeReturnedContainers,
      paymentMethod: paymentType,
      items: finalItems,
      total: calculatedTotal,
      notes: deliveryNotes,
      isNext: false,
      driverLat: driverCoords?.lat ?? null,
      driverLng: driverCoords?.lng ?? null
    });

    // 2. LocalStorage sync for offline / same-browser instant reflection
    const stored = getStoredTrips();
    if (stored && stored[currentTrip.id]) {
      const stopIdx = stored[currentTrip.id].stops?.findIndex(s => s.id === activeStopModal.id);
      if (stopIdx >= 0) {
        stored[currentTrip.id].stops[stopIdx] = {
          ...stored[currentTrip.id].stops[stopIdx],
          status: 'entregado',
          deliveredAt: deliveredTime,
          delivered_at: deliveredTime,
          returnedEmpty: totalReturnedCount,
          returned_empty: totalReturnedCount,
          returnedContainers: activeReturnedContainers,
          returned_containers: activeReturnedContainers,
          paymentMethod: paymentType,
          payment_method: paymentType,
          items: finalItems,
          total: calculatedTotal,
          notes: deliveryNotes,
          isNext: false
        };
        // Auto-advance next pending stop
        const nextPending = stored[currentTrip.id].stops.find(s => s.status === 'pendiente' || s.status === 'en_camino');
        if (nextPending) {
          nextPending.isNext = true;
          nextPending.status = 'en_camino';
        }
        saveTrips(stored);
      }
    }

    // 3. Update client containers and balance in localStorage if client exists
    try {
      const rawClients = localStorage.getItem('polar_clients_v2');
      if (rawClients) {
        const clients = JSON.parse(rawClients);
        const cliIdx = clients.findIndex(c => c.id === activeStopModal.clientId || c.name === activeStopModal.clientName);
        if (cliIdx >= 0) {
          if (paymentType === 'Fiado') {
            clients[cliIdx].balance = (Number(clients[cliIdx].balance) || 0) - calculatedTotal;
          }

          // Count delivered per container type
          const del20 = finalItems.filter(i => {
            const n = (i.name || '').toLowerCase();
            return n.includes('20') || (n.includes('bid') && !n.includes('12'));
          }).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

          const del12 = finalItems.filter(i => {
            const n = (i.name || '').toLowerCase();
            return n.includes('12');
          }).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

          const delSif = finalItems.filter(i => {
            const n = (i.name || '').toLowerCase();
            return n.includes('sif') || n.includes('soda');
          }).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

          // Count returned empty per container type
          const ret20 = activeReturnedContainers.filter(c => {
            const t = (c.type || c.name || '').toLowerCase();
            return t.includes('20') || (t.includes('bid') && !t.includes('12'));
          }).reduce((sum, c) => sum + (Number(c.qty) || 0), 0);

          const ret12 = activeReturnedContainers.filter(c => {
            const t = (c.type || c.name || '').toLowerCase();
            return t.includes('12');
          }).reduce((sum, c) => sum + (Number(c.qty) || 0), 0);

          const retSif = activeReturnedContainers.filter(c => {
            const t = (c.type || c.name || '').toLowerCase();
            return t.includes('sif') || t.includes('soda');
          }).reduce((sum, c) => sum + (Number(c.qty) || 0), 0);

          const currentHeld = clients[cliIdx].containersHeld || { bidon20L: 0, bidon12L: 0, sifon: 0 };
          const updatedHeld = {
            bidon20L: Math.max(0, (Number(currentHeld.bidon20L) || 0) + del20 - ret20),
            bidon12L: Math.max(0, (Number(currentHeld.bidon12L) || 0) + del12 - ret12),
            sifon: Math.max(0, (Number(currentHeld.sifon) || 0) + delSif - retSif)
          };

          clients[cliIdx].containersHeld = updatedHeld;
          clients[cliIdx].containers = [
            { label: 'Bidón 20L', qty: updatedHeld.bidon20L },
            { label: 'Bidón 12L', qty: updatedHeld.bidon12L },
            { label: 'Sifón Soda 1.5L', qty: updatedHeld.sifon }
          ].filter(c => c.qty > 0);

          // Add to client delivery history
          const deliveryRecord = {
            id: `del-${Date.now()}`,
            date: new Date().toLocaleDateString('es-AR') + ' ' + deliveredTime,
            tripNumber: currentTrip.tripNumber,
            itemsDelivered: finalItems.map(it => ({ name: it.name, qty: it.qty, price: it.price })),
            returnedContainers: activeReturnedContainers.map(c => ({ name: c.name, type: c.type, qty: c.qty })),
            totalEmpty: totalReturnedCount,
            totalAmount: calculatedTotal,
            paymentMethod: paymentType
          };

          clients[cliIdx].deliveryHistory = [deliveryRecord, ...(clients[cliIdx].deliveryHistory || [])];
          localStorage.setItem('polar_clients_v2', JSON.stringify(clients));
        }
      }
    } catch (e) {
      console.warn('Local client balance sync warning:', e);
    }

    setActiveStopModal(null);
    await loadTrip();
  };

  // Non-linear: Jump directly to any stop and set it as 📍 PRÓXIMA PARADA
  const handleSetAsNextStop = async (stop) => {
    if (!currentTrip) return;
    await setNextStop(currentTrip.id, stop.id, driverCoords);
    await loadTrip();
  };

  // Skip / mark Ausente or Cancelado and auto-advance to next stop
  const handleConfirmSkip = async () => {
    if (!skipModalStop || !currentTrip) return;
    await updateStopStatus(skipModalStop.id, {
      tripId: currentTrip.id,
      status: skipAction,
      skipReason,
      isNext: false,
      driverLat: driverCoords?.lat ?? null,
      driverLng: driverCoords?.lng ?? null
    });
    setSkipModalStop(null);
    await loadTrip();
  };

  const handleFinishRoute = async () => {
    if (!currentTrip) return;
    if (!window.confirm(`¿Finalizar la Hoja de Ruta #${currentTrip.tripNumber} y guardarla en el historial?`)) return;
    await finishTrip(currentTrip.id);
    await loadTrip();
    alert(`¡Hoja de Ruta #${currentTrip.tripNumber} finalizada y guardada en el historial!`);
  };

  if (loading || !currentTrip) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="w-8 h-8 border-4 border-[#0c315b] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-700">Cargando Hoja de Ruta #{resolvedTripNumber}...</p>
        </div>
      </div>
    );
  }

  const stops = currentTrip.stops || [];
  const completedCount = stops.filter((s) => s.status === 'entregado').length;
  const totalStops = stops.length || 1;
  const nextStopObj = stops.find((s) => s.isNext && s.status !== 'entregado') || stops.find((s) => s.status === 'en_camino' || s.status === 'pendiente');

  // Origin from driver live coordinates or device location
  const driverOrigin = (driverCoords?.lat && driverCoords?.lng)
    ? `${driverCoords.lat},${driverCoords.lng}`
    : (currentTrip.driverCoords?.lat && currentTrip.driverCoords?.lng)
    ? `${currentTrip.driverCoords.lat},${currentTrip.driverCoords.lng}`
    : null;

  // Active pending stops for navigation
  const pendingStops = stops.filter((s) => s.status !== 'entregado');
  const activeRouteStops = pendingStops.length > 0 ? pendingStops : stops;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-12 flex flex-col justify-between">
      {/* Top Driver Header */}
      <header className="bg-[#0c315b] text-white p-3.5 sm:p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-sky-300 flex-shrink-0">
              <img src="/images/logo-polar.png" alt="Polar" className="w-full h-full object-contain rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm truncate">Hoja de Ruta #{currentTrip.tripNumber}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  currentTrip.status === 'finalizada' ? 'bg-gray-500' : 'bg-emerald-500'
                }`}>
                  {currentTrip.status === 'finalizada' ? 'FINALIZADA' : 'EN VIVO'}
                </span>
              </div>
              <span className="text-[11px] text-sky-200 block truncate">
                {currentTrip.driverName} · {currentTrip.truck}
              </span>
            </div>
          </div>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-sky-100 flex-shrink-0"
            >
              Volver
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg w-full mx-auto p-3 sm:p-4 space-y-3.5 flex-1">
        {/* Progress & GPS Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-gray-700">Progreso del Reparto</span>
            <span className="text-[#0c315b] text-sm">{completedCount} de {stops.length} entregados</span>
          </div>

          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((completedCount / totalStops) * 100)}%` }}
            ></div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setIsTransmittingGps(!isTransmittingGps)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                isTransmittingGps
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isTransmittingGps ? 'animate-pulse text-white' : 'text-gray-500'}`} />
              <span>{isTransmittingGps ? 'GPS Conectado al Sistema' : 'Activar GPS en Vivo'}</span>
            </button>

            <span className="text-[10px] text-gray-500 font-mono">{gpsStatus}</span>
          </div>
        </div>

        {/* Launch Google Maps Multi-Stop Navigation from Driver Current Location */}
        {stops.length > 0 && (
          <a
            href={getGoogleMapsDirectionsAppUrl(activeRouteStops, driverOrigin)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-gradient-to-r from-[#0c315b] to-[#1e5aa0] hover:from-[#092546] hover:to-[#174880] text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
          >
            <Navigation className="w-4 h-4 text-sky-300 animate-pulse" />
            <span>Navegar en Google Maps (Desde mi ubicación)</span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
          </a>
        )}

        {/* Toggle: Lista de Paradas vs Mapa en Vivo */}
        <div className="grid grid-cols-2 gap-2 bg-gray-200/70 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode('lista')}
            className={`py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              viewMode === 'lista' ? 'bg-[#0c315b] text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Paradas ({stops.length})</span>
          </button>
          <button
            onClick={() => setViewMode('mapa')}
            className={`py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
              viewMode === 'mapa' ? 'bg-[#0c315b] text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Mapa y GPS</span>
          </button>
        </div>

        {/* ===================== VIEW: MAPA EN VIVO ===================== */}
        {viewMode === 'mapa' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200 text-xs font-bold shadow-2xs">
              <span className="text-gray-700">Tipo de mapa:</span>
              <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setDriverMapType('google')}
                  className={`px-3 py-1 rounded-md transition ${
                    driverMapType === 'google' ? 'bg-white text-[#0c315b] shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Ruta Google Maps
                </button>
                <button
                  onClick={() => {
                    setDriverMapType('gps');
                    setTimeout(() => leafletRef.current?.invalidateSize(), 150);
                  }}
                  className={`px-3 py-1 rounded-md transition ${
                    driverMapType === 'gps' ? 'bg-white text-[#0c315b] shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  GPS Satelital
                </button>
              </div>
            </div>

            {/* Google Maps Route Container (Clean display, never unmounted to avoid overlap) */}
            <div className={driverMapType === 'google' ? 'flex flex-col h-96 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm' : 'hidden'}>
              <div className="px-3 py-2 bg-white border-b border-gray-200 text-[11px] flex items-center justify-between">
                <span className="font-bold text-[#0c315b] truncate">
                  🛣️ Recorrido desde tu ubicación ({activeRouteStops.length} paradas)
                </span>
                <a
                  href={getGoogleMapsDirectionsAppUrl(activeRouteStops, driverOrigin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded flex items-center gap-1"
                >
                  <span>Abrir en Maps</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <iframe
                title="Google Maps Route"
                src={getGoogleMapsRouteEmbedUrl(activeRouteStops, driverOrigin)}
                className="w-full flex-1 border-0"
                loading="lazy"
              />
            </div>

            {/* Leaflet GPS Radar Container (Hidden when Google Maps is active, preventing container leaks) */}
            <div className={driverMapType === 'gps' ? 'relative h-96 rounded-2xl overflow-hidden border border-gray-200 bg-slate-200 shadow-sm' : 'hidden'}>
              <div ref={mapRef} className="w-full h-full z-0" />

              {selectedMapStop && (
                <div className="absolute bottom-3 left-3 right-3 z-20 bg-white p-3.5 rounded-xl border border-gray-200 shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-[#0c315b] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{selectedMapStop.orderNumber}
                      </span>
                      <strong className="text-xs text-gray-900 truncate">{selectedMapStop.clientName}</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0c315b] uppercase">
                      {selectedMapStop.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">📍 {selectedMapStop.address}</p>

                  <div className="grid grid-cols-3 gap-1.5 text-xs pt-1">
                    <button
                      onClick={() => handleSetAsNextStop(selectedMapStop)}
                      className="py-1.5 rounded-lg border border-[#0c315b] text-[#0c315b] font-bold hover:bg-sky-50"
                    >
                      Ir ahora
                    </button>
                    <button
                      onClick={() => {
                        const q = encodeURIComponent(`${selectedMapStop.address}`);
                        const originParam = driverOrigin ? `&origin=${encodeURIComponent(driverOrigin)}` : '';
                        window.open(`https://www.google.com/maps/dir/?api=1${originParam}&destination=${q}&travelmode=driving`, '_blank');
                      }}
                      className="py-1.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
                    >
                      Google Maps
                    </button>
                    <button
                      onClick={() => handleOpenDelivery(selectedMapStop)}
                      className="py-1.5 rounded-lg bg-[#0c315b] text-white font-bold hover:bg-[#082342]"
                    >
                      Entregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW: LISTA DE PARADAS ===================== */}
        {viewMode === 'lista' && (
          <div className="space-y-3">
            {stops.map((stop) => {
              const isDelivered = stop.status === 'entregado';
              const isAbsent = stop.status === 'ausente';
              const isCancelled = stop.status === 'cancelado';
              const isNext = nextStopObj?.id === stop.id && !isDelivered && !isCancelled;

              return (
                <div
                  key={stop.id}
                  className={`rounded-2xl transition border overflow-hidden bg-white shadow-2xs ${
                    isNext
                      ? 'border-2 border-[#0c315b] ring-2 ring-sky-100'
                      : isDelivered
                      ? 'border-emerald-200 opacity-85'
                      : isAbsent
                      ? 'border-amber-300 bg-amber-50/20'
                      : isCancelled
                      ? 'border-rose-200 opacity-70'
                      : 'border-gray-200'
                  }`}
                >
                  {isNext && (
                    <div className="bg-[#0c315b] text-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider flex justify-between items-center">
                      <span>📍 PRÓXIMA PARADA</span>
                      <span className="text-[10px] text-sky-200">Parada #{stop.orderNumber}</span>
                    </div>
                  )}

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAbsent
                            ? 'bg-amber-100 text-amber-800'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-[#0c315b] text-white'
                        }`}>
                          {isDelivered ? '✓' : `#${stop.orderNumber}`}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">{stop.clientName}</h4>
                          <span className="text-[11px] text-gray-500 block">{stop.address}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 uppercase ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isAbsent
                          ? 'bg-amber-100 text-amber-800'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-sky-100 text-[#0c315b]'
                      }`}>
                        {isDelivered ? `Entregado ${stop.deliveredAt || ''}` : stop.status}
                      </span>
                    </div>

                    {stop.skipReason && (isAbsent || isCancelled) && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium">
                        Motivo: {stop.skipReason}
                      </div>
                    )}

                    {/* Products */}
                    <div className="bg-gray-50 p-2.5 rounded-lg text-xs font-semibold text-gray-700 flex justify-between items-center gap-2">
                      <span className="truncate">{(stop.items || []).map((i) => `${i.qty}x ${i.name}`).join(', ') || 'Bidones Polar'}</span>
                      <strong className="text-[#0c315b] text-sm flex-shrink-0">${Number(stop.total || 0).toLocaleString()}</strong>
                    </div>

                    {/* Actions */}
                    {!isDelivered && !isCancelled ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <button
                            onClick={() => {
                              const q = stop.coords?.lat && stop.coords?.lng
                                ? `${stop.coords.lat},${stop.coords.lng}`
                                : encodeURIComponent(`${stop.address}`);
                              const originParam = driverOrigin ? `&origin=${encodeURIComponent(driverOrigin)}` : '';
                              window.open(`https://www.google.com/maps/dir/?api=1${originParam}&destination=${q}&travelmode=driving`, '_blank');
                            }}
                            className="py-2 rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-1"
                          >
                            <Navigation className="w-3.5 h-3.5 text-sky-600" />
                            <span>GPS</span>
                          </button>

                          <button
                            onClick={() => {
                              const msg = encodeURIComponent(`Hola ${stop.clientName}! Estamos llegando con tu pedido Polar.`);
                              window.open(`https://wa.me/${stop.phone}?text=${msg}`, '_blank');
                            }}
                            className="py-2 rounded-lg border border-emerald-400 text-emerald-700 font-bold hover:bg-emerald-50 flex items-center justify-center space-x-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Avisar</span>
                          </button>

                          <button
                            onClick={() => handleOpenDelivery(stop)}
                            className="py-2 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold flex items-center justify-center space-x-1 shadow-2xs"
                          >
                            <Check className="w-4 h-4" />
                            <span>Entregar</span>
                          </button>
                        </div>

                        {/* Non-linear controls: jump to stop OR skip/mark absent/cancelled */}
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          {!isNext ? (
                            <button
                              onClick={() => handleSetAsNextStop(stop)}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[#0c315b] font-bold hover:bg-sky-100 flex items-center justify-center gap-1"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                              <span>{isAbsent ? 'Reintentar / Ir ahora' : 'Saltar aquí (Próxima)'}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 font-medium">Parada activa en curso</span>
                          )}

                          <button
                            onClick={() => {
                              setSkipModalStop(stop);
                              setSkipAction('ausente');
                              setSkipReason('No atendió timbre / Puerta cerrada');
                            }}
                            className="py-1.5 px-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>No atendió / Saltar</span>
                          </button>
                        </div>
                      </div>
                    ) : isDelivered ? (
                      <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold pt-1">
                        <span>✓ Entregado ({stop.paymentMethod}) · {stop.returnedEmpty || 0} vacíos</span>
                        {onOpenComprobante && (
                          <button
                            onClick={() => onOpenComprobante(stop)}
                            className="text-[11px] text-[#0c315b] hover:underline flex items-center gap-0.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Recibo</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-xs text-rose-700 font-semibold pt-1">
                        <span>✕ Pedido cancelado</span>
                        <button
                          onClick={() => handleSetAsNextStop(stop)}
                          className="text-[11px] text-[#0c315b] hover:underline font-bold"
                        >
                          Reactivar parada
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Finish Trip Button */}
        {currentTrip.status !== 'finalizada' && (
          <button
            onClick={handleFinishRoute}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition"
          >
            <Flag className="w-4 h-4" />
            <span>Finalizar Hoja de Ruta #{currentTrip.tripNumber}</span>
          </button>
        )}
      </main>

      {/* DELIVERY MODAL */}
      {activeStopModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  Parada #{activeStopModal.orderNumber}
                </span>
                <h3 className="font-black text-base text-gray-900 leading-tight">
                  {activeStopModal.clientName}
                </h3>
                <span className="text-xs text-gray-500 block truncate max-w-[280px]">
                  {activeStopModal.address}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setActiveStopModal(null)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Products (All items from the client's order) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#0c315b]" />
                  <span>Productos a Entregar ({deliveryItems.length}):</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Ajustá cantidades si hubo cambios
                </span>
              </div>

              <div className="space-y-1.5">
                {deliveryItems.map((item, idx) => {
                  const itemSubtotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100/70 p-2.5 rounded-xl border border-gray-200 gap-2 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-gray-900 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          ${Number(item.price || 0).toLocaleString('es-AR')} c/u
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center transition active:scale-95 text-xs shadow-2xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-black text-xs text-[#0c315b]">
                          {item.qty}x
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-[#0c315b] text-white font-bold hover:bg-[#082342] flex items-center justify-center transition active:scale-95 text-xs shadow-2xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="w-18 text-right font-black text-xs text-gray-900 flex-shrink-0 font-mono">
                        ${itemSubtotal.toLocaleString('es-AR')}
                      </div>

                      {/* Remove item button if 0 */}
                      {item.qty === 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Quitar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Extra Product Toggle */}
              <div className="pt-1">
                {!showAddProductMenu ? (
                  <button
                    type="button"
                    onClick={() => setShowAddProductMenu(true)}
                    className="text-[11px] font-bold text-[#0c315b] hover:text-sky-700 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar otro producto que pidió el cliente en puerta</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#0c315b]">
                      <span>Seleccioná el producto a sumar:</span>
                      <button 
                        type="button"
                        onClick={() => setShowAddProductMenu(false)}
                        className="text-gray-400 hover:text-gray-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {CATALOG_PRODUCTS.map((prod, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleAddCatalogProduct(prod)}
                          className="text-left p-2 rounded-lg bg-white border border-gray-200 hover:border-[#0c315b] hover:bg-sky-50 text-xs transition flex justify-between items-center"
                        >
                          <span className="font-semibold text-gray-900 truncate mr-1">{prod.name}</span>
                          <span className="font-bold text-[#0c315b] flex-shrink-0">${prod.price.toLocaleString('es-AR')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Envases Vacíos Retirados (Desglose individual por tipo de envase/producto) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <RotateCcw className="w-4 h-4 text-[#0c315b]" />
                  <span>Envases Vacíos Retirados:</span>
                </span>
                <span className="text-[10px] text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  Total vacíos: {totalReturnedEmpty}
                </span>
              </div>

              <div className="space-y-1.5">
                {returnedContainers.map((cont, cIdx) => (
                  <div 
                    key={cIdx}
                    className="flex items-center justify-between bg-sky-50/60 hover:bg-sky-50 p-2.5 rounded-xl border border-sky-200 gap-2 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-gray-900 block truncate">
                        {cont.name}
                      </span>
                      <span className="text-[10px] text-sky-700 font-medium">
                        Envase retornable
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateContainerQty(cIdx, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-sky-300 font-bold text-gray-700 hover:bg-sky-100 flex items-center justify-center transition active:scale-95 text-xs shadow-2xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black text-xs text-[#0c315b]">
                        {cont.qty}x
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateContainerQty(cIdx, 1)}
                        className="w-7 h-7 rounded-lg bg-[#0c315b] text-white font-bold hover:bg-[#082342] flex items-center justify-center transition active:scale-95 text-xs shadow-2xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove button if 0 and multiple */}
                    {cont.qty === 0 && returnedContainers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContainer(cIdx)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        title="Quitar este envase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Extra Empty Container Type */}
              <div className="pt-0.5">
                {!showAddContainerMenu ? (
                  <button
                    type="button"
                    onClick={() => setShowAddContainerMenu(true)}
                    className="text-[11px] font-bold text-[#0c315b] hover:text-sky-700 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar otro tipo de envase vacío retirado</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-sky-100/70 border border-sky-300 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#0c315b]">
                      <span>Elegí el envase vacío a incorporar:</span>
                      <button
                        type="button"
                        onClick={() => setShowAddContainerMenu(false)}
                        className="text-gray-400 hover:text-gray-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {RETURNABLE_CONTAINER_CATALOG.map((rc, rcIdx) => (
                        <button
                          key={rcIdx}
                          type="button"
                          onClick={() => handleAddReturnedContainer(rc)}
                          className="text-left p-2 rounded-lg bg-white border border-sky-200 hover:border-[#0c315b] hover:bg-sky-50 text-xs font-semibold text-gray-800 transition flex items-center justify-between"
                        >
                          <span className="truncate mr-1">{rc.name}</span>
                          <Plus className="w-3 h-3 text-[#0c315b] flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Forma de Pago */}
            <div>
              <span className="text-xs font-bold text-gray-700 block mb-1">Forma de Pago:</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {['Efectivo', 'Transferencia', 'Fiado'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentType(m)}
                    className={`py-2 rounded-lg font-bold border transition ${
                      paymentType === m
                        ? 'bg-[#0c315b] text-white border-[#0c315b] shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {paymentType === 'Fiado' && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-1.5 border border-amber-200 font-medium">
                  ⚠️ Se anotará en la cuenta corriente del cliente (Cobro $0 en mano).
                </p>
              )}
            </div>

            {/* Total a Cobrar Dinámico */}
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-500 block text-[11px] font-medium">Total de la Entrega:</span>
                <span className="text-[10px] text-gray-400">
                  {deliveryItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0)} unidades bajadas
                </span>
              </div>
              <span className="text-lg font-black text-[#0c315b] font-mono">
                ${calculatedTotal.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmDelivery}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-md transition uppercase tracking-wider flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>CONFIRMAR ENTREGA (${calculatedTotal.toLocaleString('es-AR')})</span>
            </button>
          </div>
        </div>
      )}

      {/* SKIP / ABSENT / CANCEL MODAL */}
      {skipModalStop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Saltar / Marcar Parada</h3>
                <span className="text-xs text-gray-500">{skipModalStop.clientName}</span>
              </div>
              <button onClick={() => setSkipModalStop(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSkipAction('ausente');
                  setSkipReason('No atendió timbre / Puerta cerrada');
                }}
                className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1 ${
                  skipAction === 'ausente' ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>No atendió</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSkipAction('cancelado');
                  setSkipReason('Cliente canceló el pedido');
                }}
                className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1 ${
                  skipAction === 'cancelado' ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Cancelado</span>
              </button>
            </div>

            <div className="text-xs">
              <label className="font-bold text-gray-700 block mb-1">Motivo / Observación:</label>
              <input
                type="text"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
              />
            </div>

            <button
              onClick={handleConfirmSkip}
              className="w-full py-3 rounded-xl bg-[#0c315b] hover:bg-[#082342] text-white font-extrabold text-xs shadow-md transition"
            >
              GUARDAR Y PASAR A SIGUIENTE PARADA
            </button>
          </div>
        </div>
      )}

      <footer className="text-center text-[11px] text-gray-400 py-2">
        Soda y Agua POLAR · Hoja de Ruta #{currentTrip.tripNumber}
      </footer>
    </div>
  );
}
