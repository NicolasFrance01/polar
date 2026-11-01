import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  Crosshair, 
  Search, 
  Plus, 
  MapPin, 
  Truck, 
  Calendar, 
  Filter, 
  Layers,
  ChevronDown,
  ArrowUpDown,
  Navigation,
  Share2,
  Copy,
  MessageCircle,
  HelpCircle,
  Wand2,
  Trash2,
  Download,
  Check,
  X,
  ExternalLink,
  Radio
} from 'lucide-react';
import { getStoredTrips, subscribeToTripUpdates } from '../services/tripSync';

export default function Repartos({ onSelectRoute, onOpenDriverTrip }) {
  const [activeSubtab, setActiveSubtab] = useState('repartos'); // 'repartos' | 'programar'
  const [selectedTruckId, setSelectedTruckId] = useState('VIAJE-25');
  const [tripsData, setTripsData] = useState(getStoredTrips);
  
  // Modals from user's new screenshots
  const [showQueEsBalanceModal, setShowQueEsBalanceModal] = useState(false);
  const [showSugerenciasModal, setShowSugerenciasModal] = useState(false);
  const [limitParadas, setLimitParadas] = useState(20);
  const [limitActive, setLimitActive] = useState(true);

  // Map & location state
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [liveToast, setLiveToast] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});

  // Subscribe to real-time driver updates
  useEffect(() => {
    const unsubscribe = subscribeToTripUpdates((updatedTrips) => {
      setTripsData(updatedTrips);

      // Show live toast feedback
      const current = updatedTrips[selectedTruckId];
      if (current) {
        setLiveToast(`🚚 Actualización en vivo: ${current.driverName} actualizó su recorrido.`);
        setTimeout(() => setLiveToast(null), 4000);
      }

      // Update map pins dynamically
      updateMapMarkers(updatedTrips[selectedTruckId]);
    });

    return () => unsubscribe();
  }, [selectedTruckId]);

  // Geolocation & Leaflet Map initialization
  useEffect(() => {
    let isMounted = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return;
          const userPos = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(userPos);
          setLoadingLocation(false);
          initLeafletMap(userPos);
        },
        (err) => {
          if (!isMounted) return;
          const defaultPos = [-31.4089, -64.1956]; // Córdoba / Buenos Aires fallback
          setUserLocation(defaultPos);
          setLocationError('Ubicación predeterminada');
          setLoadingLocation(false);
          initLeafletMap(defaultPos);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const defaultPos = [-31.4089, -64.1956];
      setUserLocation(defaultPos);
      setLoadingLocation(false);
      initLeafletMap(defaultPos);
    }

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
    };
  }, []);

  const initLeafletMap = (centerCoords) => {
    if (!window.L || !mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    try {
      const map = window.L.map(mapContainerRef.current, {
        center: centerCoords,
        zoom: 14,
        zoomControl: false
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Leaflet | © OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      leafletMapRef.current = map;
      updateMapMarkers(tripsData[selectedTruckId], map);
    } catch (err) {
      console.error('Leaflet init error:', err);
    }
  };

  const updateMapMarkers = (trip, mapInstance = leafletMapRef.current) => {
    if (!window.L || !mapInstance || !trip) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // 1. Truck / Driver live position
    const truckCoords = trip.driverCoords || { lat: -31.4089, lng: -64.1956 };
    const truckIcon = window.L.divIcon({
      className: 'custom-truck-pin',
      html: `<div style="background-color: #0c315b; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><span style="color: white; font-size: 16px;">🚚</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const truckMarker = window.L.marker([truckCoords.lat, truckCoords.lng], { icon: truckIcon })
      .addTo(mapInstance)
      .bindPopup(`<strong>${trip.truck}</strong><br>Chofer: ${trip.driverName}<br>Última actualización: ${trip.lastUpdate}`);
    markersRef.current['truck'] = truckMarker;

    // 2. Customer delivery pins
    const latlngs = [[truckCoords.lat, truckCoords.lng]];

    trip.stops.forEach((s) => {
      const isDelivered = s.status === 'entregado';
      const isNext = s.isNext && !isDelivered;
      const color = isDelivered ? '#10b981' : isNext ? '#0c315b' : '#0284c7';

      const stopIcon = window.L.divIcon({
        className: 'custom-stop-pin',
        html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25); color: white; font-weight: bold; font-size: 12px;">${isDelivered ? '✓' : s.orderNumber}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const stopMarker = window.L.marker([s.coords.lat, s.coords.lng], { icon: stopIcon })
        .addTo(mapInstance)
        .bindPopup(`<strong>#${s.orderNumber} - ${s.clientName}</strong><br>${s.address}<br>Estado: <b>${s.status.toUpperCase()}</b>`);
      
      markersRef.current[s.id] = stopMarker;
      latlngs.push([s.coords.lat, s.coords.lng]);
    });

    // Draw route path
    if (markersRef.current['route']) markersRef.current['route'].remove();
    const routeLine = window.L.polyline(latlngs, {
      color: '#0c315b',
      weight: 3.5,
      opacity: 0.8,
      dashArray: '6, 6'
    }).addTo(mapInstance);
    markersRef.current['route'] = routeLine;
  };

  const handleCopyDriverLink = (tripId) => {
    const url = `${window.location.origin}/?viaje=${tripId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(tripId);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSendLinkToDriverWhatsApp = (trip) => {
    const url = `${window.location.origin}/?viaje=${trip.id}`;
    const text = encodeURIComponent(
      `¡Hola ${trip.driverName}! 🚚 Acá tenés el enlace de tu hoja de ruta en vivo de hoy para ${trip.truck}:\n\n` +
      `🔗 ${url}\n\n` +
      `Abrilo desde tu celular para seguir el recorrido, ver direcciones y registrar las entregas en tiempo real.`
    );
    window.open(`https://wa.me/${trip.driverPhone}?text=${text}`, '_blank');
  };

  const currentTrip = tripsData[selectedTruckId] || tripsData['VIAJE-25'];
  const completedStops = currentTrip.stops.filter(s => s.status === 'entregado').length;
  const totalStops = currentTrip.stops.length;

  return (
    <div className="space-y-4">
      
      {/* Live notification ticker */}
      {liveToast && (
        <div className="bg-[#0c315b] text-white p-3 rounded-xl shadow-lg flex items-center justify-between text-xs animate-bounce">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold">{liveToast}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Sincronizado</span>
        </div>
      )}

      {/* Subtabs: REPARTOS | PROGRAMAR REPARTOS (matches user screenshot) */}
      <div className="flex items-center space-x-6 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <button
          onClick={() => setActiveSubtab('repartos')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubtab === 'repartos'
              ? 'border-[#0c315b] text-[#0c315b] font-bold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          Repartos
        </button>
        <button
          onClick={() => setActiveSubtab('programar')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubtab === 'programar'
              ? 'border-[#0c315b] text-[#0c315b] font-bold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          Programar Repartos
        </button>
      </div>

      {/* ===================== VISTA 1: REPARTOS EN CURSO (CON LINKS DE CHOFER Y MAPA) ===================== */}
      {activeSubtab === 'repartos' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">Repartos en progreso</h2>
              <p className="text-xs text-gray-500">
                Seleccioná un camión para ver su recorrido y enviarle su link de viaje en vivo.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Sincronización en Tiempo Real Activa</span>
              </span>
            </div>
          </div>

          {/* Multi-Truck Cards with Trip Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {Object.values(tripsData).map((trip) => {
              const isSelected = selectedTruckId === trip.id;
              const delivered = trip.stops.filter(s => s.status === 'entregado').length;
              const total = trip.stops.length;
              const percent = Math.round((delivered / total) * 100);

              return (
                <div
                  key={trip.id}
                  onClick={() => {
                    setSelectedTruckId(trip.id);
                    if (leafletMapRef.current) updateMapMarkers(trip);
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#0c315b] bg-sky-50/40 shadow-xs ring-2 ring-[#0c315b]/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-[#0c315b]" />
                        <span className="font-extrabold text-sm text-gray-900">Reparto #{trip.tripNumber}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0c315b] text-white">
                        En progreso
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-800">{trip.driverName}</p>
                    <span className="text-[11px] text-gray-500 block">{trip.truck} · {trip.zone}</span>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-gray-500 font-medium mb-1">
                        <span>{delivered} / {total} entregados</span>
                        <span className="font-bold text-[#0c315b]">{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Links Actions (Requested by User) */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyDriverLink(trip.id);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold text-gray-700 flex items-center justify-center space-x-1 transition"
                      title="Copiar enlace para el chofer"
                    >
                      {copiedLink === trip.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          <span>Copiar Link Chofer</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendLinkToDriverWhatsApp(trip);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1 transition shadow-2xs"
                      title="Enviar hoja de ruta por WhatsApp al chofer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDriverTrip(trip.id);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-sky-50 text-[#0c315b] border border-sky-200 hover:bg-sky-100 font-bold flex items-center space-x-1"
                      title="Abrir vista del chofer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </button>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Interactive Leaflet Map with Live Stream */}
          <div className="relative border border-gray-200 rounded-xl overflow-hidden h-80 bg-slate-50">
            
            {loadingLocation && (
              <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-6 text-center space-y-3">
                <h3 className="text-base font-bold text-gray-900">Cargando mapa...</h3>
                <p className="text-xs text-gray-500">Obteniendo tu ubicación satelital</p>
                <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0c315b] to-[#0284c7] w-2/3 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}

            <div ref={mapContainerRef} className="w-full h-full z-0"></div>

            {/* Map Controls */}
            <div className="absolute top-3 right-3 z-10 flex space-x-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-gray-200 shadow-2xs">
              <button 
                onClick={() => updateMapMarkers(currentTrip)}
                className="p-1.5 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition" 
                title="Actualizar posiciones"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  if (leafletMapRef.current && currentTrip.driverCoords) {
                    leafletMapRef.current.setView([currentTrip.driverCoords.lat, currentTrip.driverCoords.lng], 15, { animate: true });
                  }
                }}
                className="p-1.5 text-[#0c315b] hover:bg-sky-50 rounded-md transition" 
                title="Seguir posición del camión"
              >
                <Crosshair className="w-4 h-4 text-[#0c315b]" />
              </button>
            </div>

            {/* Live GPS feed info */}
            <div className="absolute bottom-2 left-3 z-10 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] text-gray-700 border border-gray-200 flex items-center space-x-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Siguiendo a <strong>{currentTrip.driverName}</strong> ({currentTrip.truck}) · {completedStops}/{totalStops} paradas</span>
            </div>
          </div>

          {/* Delivery Zones Breakdown */}
          <div className="pt-2">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Zonas de Reparto</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 relative overflow-hidden">
                <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Zona Norte
                </span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">18</span>
                <span className="text-[11px] text-gray-500">pedidos</span>
              </div>
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5 relative overflow-hidden">
                <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Zona Este
                </span>
                <span className="text-2xl font-black text-sky-700 block mt-1">12</span>
                <span className="text-[11px] text-gray-500">pedidos</span>
              </div>
              <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3.5 relative overflow-hidden">
                <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Zona Oeste
                </span>
                <span className="text-2xl font-black text-purple-700 block mt-1">9</span>
                <span className="text-[11px] text-gray-500">pedidos</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 relative overflow-hidden">
                <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Zona Sur
                </span>
                <span className="text-2xl font-black text-amber-700 block mt-1">22</span>
                <span className="text-[11px] text-gray-500">pedidos</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ===================== VISTA 2: PROGRAMAR REPARTOS & SUGERIR BALANCE (MATCHING NEW SCREENSHOTS) ===================== */}
      {activeSubtab === 'programar' && (
        <div className="space-y-4">
          
          {/* Top Info Banner matching user screenshot 2 */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start sm:items-center space-x-2 text-sky-900">
              <div className="w-4 h-4 rounded-full border border-sky-500 text-sky-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 sm:mt-0">
                i
              </div>
              <span>
                Tus repartos están bien distribuidos (0.0 km promedio). Podés revisar sugerencias para optimizar aún más o ajustar el balance de paradas.
              </span>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
              <button
                onClick={() => setShowSugerenciasModal(true)}
                className="text-[#0c315b] hover:text-[#082342] font-bold flex items-center space-x-1.5 px-2.5 py-1 rounded-lg hover:bg-sky-100 transition"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#0c315b]" />
                <span>Sugerir balance</span>
              </button>

              <button
                onClick={() => setShowQueEsBalanceModal(true)}
                className="text-sky-700 hover:text-sky-900"
                title="¿Qué es Sugerir balance?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section: Repartos Programados with Export and Create buttons */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-gray-700">
                <Trash2 className="w-4 h-4 text-gray-400" />
                <h3 className="font-bold text-base text-gray-900">Repartos programados</h3>
              </div>

              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 flex items-center space-x-1">
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                <button 
                  onClick={() => alert('Crear nuevo reparto programado por día / zona.')}
                  className="px-4 py-2 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs shadow-xs"
                >
                  Crear reparto programado
                </button>
              </div>
            </div>

            {/* Scheduled Trips Table / Days */}
            <div className="divide-y divide-gray-100 pt-2 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-gray-900 block text-sm">Lunes y Jueves · Recorrido Centro / Alberdi</strong>
                  <span className="text-gray-500">18 clientes fijos · Camión #1 (Marcos Gutiérrez)</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                  Activo
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-gray-900 block text-sm">Martes y Viernes · Recorrido Zona Norte</strong>
                  <span className="text-gray-500">22 clientes fijos · Camión #2 (Sofía Ramos)</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                  Activo
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-gray-900 block text-sm">Miércoles · Recorrido Empresas / Dispensers F/C</strong>
                  <span className="text-gray-500">12 clientes corporativos · Abonos mensuales</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                  Activo
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ===================== MODAL 1: ¿QUÉ ES SUGERIR BALANCE? (MATCHING SCREENSHOT 1) ===================== */}
      {showQueEsBalanceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative border border-gray-200 text-gray-900 font-sans">
            <h3 className="text-lg font-bold text-gray-900">
              ¿Qué es Sugerir balance?
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              Cuando tenés varios repartos programados durante la semana, a veces algunos clientes terminan asignados a un día que les queda lejos de la zona donde van el resto de los clientes de ese mismo día. Esto hace que tu repartidor tenga que cruzar la ciudad de un punto a otro y la ruta se haga más larga.
            </p>

            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Sugerir balance</strong> mira la ubicación de todos tus clientes y te propone moverlos entre días para que cada reparto agrupe clientes que estén cerca entre sí. El resultado: rutas más cortas, menos combustible y entregas más rápidas.
            </p>

            <p className="text-xs text-gray-600 leading-relaxed">
              Vas a ver una lista con los clientes que conviene cambiar de día, cuánto mejora la distancia al centro de su zona, y un mapa para revisar visualmente antes de aplicar los cambios. <strong>Podés aceptar todas las sugerencias o sólo las que te convengan</strong> — tu repartidor y tus clientes no notan ningún cambio hasta que vos confirmás.
            </p>

            {/* Alert info box */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex items-start space-x-2">
              <span className="font-bold text-sky-700">ⓘ</span>
              <span>Esta función está optimizada para la logística de Soda y Agua Polar.</span>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowQueEsBalanceModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs transition shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: SUGERENCIAS DE BALANCE (MATCHING SCREENSHOT 3) ===================== */}
      {showSugerenciasModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative border border-gray-200 text-gray-900 font-sans">
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Sugerencias de balance
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Redistribución geográfica optimizada entre todos los repartos activos
                </p>
              </div>
              <button
                onClick={() => setShowSugerenciasModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkbox option */}
            <div className="border border-gray-200 rounded-xl p-3 flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                id="limitDiff"
                checked={limitActive}
                onChange={(e) => setLimitActive(e.target.checked)}
                className="rounded text-[#0c315b]"
              />
              <label htmlFor="limitDiff" className="text-gray-700 font-medium">
                Limitar diferencia máxima de paradas entre repartos
              </label>
              <input
                type="number"
                value={limitParadas}
                onChange={(e) => setLimitParadas(Number(e.target.value))}
                className="w-14 px-2 py-0.5 border border-gray-300 rounded text-center font-bold text-gray-900 outline-none"
              />
              <span className="text-gray-500">paradas</span>
            </div>

            {/* Projection status */}
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block mb-2">
                Distribución actual → proyectada (según selección)
              </span>

              {/* Green status card matching screenshot 3 */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Tus repartos ya están bien distribuidos geográficamente. No hay sugerencias.</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSugerenciasModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition"
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
