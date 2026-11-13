import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  Crosshair, 
  Truck, 
  ChevronDown,
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
import { fetchTrips } from '../services/api';
import { 
  getGoogleMapsRouteEmbedUrl, 
  getGoogleMapsDirectionsAppUrl, 
  fetchOSRMStreetRoute 
} from '../services/mapRouting';

export default function Repartos({ onOpenDriverTrip }) {
  const [activeSubtab, setActiveSubtab] = useState('repartos'); // 'repartos' | 'programar'
  const [liveMapMode, setLiveMapMode] = useState('google'); // 'google' | 'gps'
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [tripsData, setTripsData] = useState(getStoredTrips);
  
  const [showQueEsBalanceModal, setShowQueEsBalanceModal] = useState(false);
  const [showSugerenciasModal, setShowSugerenciasModal] = useState(false);
  const [limitParadas, setLimitParadas] = useState(20);
  const [limitActive, setLimitActive] = useState(true);

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [copiedLink, setCopiedLink] = useState(null);
  const [liveToast, setLiveToast] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});

  // Sync trips from PostgreSQL every 5 seconds for cross-device live tracking
  const syncFromDatabase = async (showToastOnUpdate = false) => {
    const dbTrips = await fetchTrips();
    if (dbTrips && typeof dbTrips === 'object' && Object.keys(dbTrips).length > 0) {
      setTripsData(dbTrips);
      const target = dbTrips[selectedTruckId] || Object.values(dbTrips)[0];
      if (target && !dbTrips[selectedTruckId]) {
        setSelectedTruckId(target.id);
      }
      if (target && leafletMapRef.current) {
        updateMapMarkers(target);
      }
      if (showToastOnUpdate && target) {
        setLiveToast(`🚚 GPS y estado actualizados (${target.driverName})`);
        setTimeout(() => setLiveToast(null), 3500);
      }
    }
  };

  useEffect(() => {
    syncFromDatabase(false);
    const interval = setInterval(() => {
      syncFromDatabase(false);
    }, 5000);

    const unsubscribe = subscribeToTripUpdates((updatedTrips) => {
      setTripsData(updatedTrips);
      const current = updatedTrips[selectedTruckId];
      if (current) {
        setLiveToast(`🚚 Actualización en vivo: ${current.driverName} actualizó su recorrido.`);
        setTimeout(() => setLiveToast(null), 4000);
        updateMapMarkers(current);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [selectedTruckId]);

  // Geolocation & Leaflet Map initialization
  useEffect(() => {
    let isMounted = true;
    const defaultPos = [-31.4089, -64.1956];

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return;
          setLoadingLocation(false);
          initLeafletMap([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          if (!isMounted) return;
          setLoadingLocation(false);
          initLeafletMap(defaultPos);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
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
      const trip = tripsData[selectedTruckId] || Object.values(tripsData)[0];
      updateMapMarkers(trip, map);
    } catch (err) {
      console.error('Leaflet init error:', err);
    }
  };

  const updateMapMarkers = (trip, mapInstance = leafletMapRef.current) => {
    if (!window.L || !mapInstance || !trip) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

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

    const latlngs = [[truckCoords.lat, truckCoords.lng]];

    (trip.stops || []).forEach((s) => {
      if (!s.coords?.lat || !s.coords?.lng) return;
      const isDelivered = s.status === 'entregado';
      const isAbsent = s.status === 'ausente';
      const isCancelled = s.status === 'cancelado';
      const isNext = s.isNext && !isDelivered && !isCancelled;
      const color = isDelivered ? '#10b981' : isAbsent ? '#f59e0b' : isCancelled ? '#ef4444' : isNext ? '#0c315b' : '#0284c7';

      const stopIcon = window.L.divIcon({
        className: 'custom-stop-pin',
        html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25); color: white; font-weight: bold; font-size: 12px;">${isDelivered ? '✓' : s.orderNumber}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const stopMarker = window.L.marker([s.coords.lat, s.coords.lng], { icon: stopIcon })
        .addTo(mapInstance)
        .bindPopup(`<strong>#${s.orderNumber} - ${s.clientName}</strong><br>${s.address}<br>Estado: <b>${String(s.status).toUpperCase()}</b>`);
      
      markersRef.current[s.id] = stopMarker;
      latlngs.push([s.coords.lat, s.coords.lng]);
    });

    if (markersRef.current['route']) markersRef.current['route'].remove();
    if (latlngs.length > 1) {
      fetchOSRMStreetRoute(latlngs).then((streetPath) => {
        if (!leafletMapRef.current) return;
        const coords = (streetPath && streetPath.length > 0) ? streetPath : latlngs;
        const routeLine = window.L.polyline(coords, {
          color: '#0284c7',
          weight: 4,
          opacity: 0.9
        }).addTo(mapInstance);
        markersRef.current['route'] = routeLine;
      });
    }
  };

  const handleCopyDriverLink = (trip) => {
    const url = `${window.location.origin}/ruta${trip.tripNumber}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(trip.id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSendLinkToDriverWhatsApp = (trip) => {
    const url = `${window.location.origin}/ruta${trip.tripNumber}`;
    const text = encodeURIComponent(
      `¡Hola ${trip.driverName}! 🚚 Acá tenés el enlace de tu Hoja de Ruta #${trip.tripNumber} para ${trip.truck}:\n\n` +
      `🔗 ${url}\n\n` +
      `Abrilo desde tu celular para seguir el recorrido, ver el mapa y registrar las entregas en vivo.`
    );
    window.open(`https://wa.me/${trip.driverPhone}?text=${text}`, '_blank');
  };

  const allTripsList = Object.values(tripsData);
  const currentTrip = tripsData[selectedTruckId] || allTripsList[0];
  const completedStops = currentTrip?.stops?.filter((s) => s.status === 'entregado').length || 0;
  const totalStops = currentTrip?.stops?.length || 0;

  return (
    <div className="space-y-4">
      {liveToast && (
        <div className="bg-[#0c315b] text-white p-3 rounded-xl shadow-lg flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold">{liveToast}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Sincronizado</span>
        </div>
      )}

      {/* Subtabs */}
      <div className="flex items-center space-x-6 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <button
          onClick={() => setActiveSubtab('repartos')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubtab === 'repartos'
              ? 'border-[#0c315b] text-[#0c315b] font-bold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          Repartos en Vivo
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

      {activeSubtab === 'repartos' && allTripsList.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 bg-sky-50 text-[#0c315b] rounded-2xl flex items-center justify-center mx-auto border border-sky-100">
            <Truck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No hay Hojas de Ruta activas</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No hay repartos en vivo en este momento. Podés armar una nueva hoja de ruta seleccionando pedidos en el módulo <strong>Repartir</strong>.
            </p>
          </div>
        </div>
      )}

      {activeSubtab === 'repartos' && currentTrip && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">Seguimiento en Tiempo Real</h2>
              <p className="text-xs text-gray-500">
                Seleccioná una Hoja de Ruta para seguir la ubicación GPS del repartidor y el estado de sus paradas.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GPS Sincronizado cada 5s</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTripsList.map((trip) => {
              const isSelected = currentTrip.id === trip.id;
              const stops = trip.stops || [];
              const delivered = stops.filter((s) => s.status === 'entregado').length;
              const total = stops.length || 1;
              const percent = Math.round((delivered / total) * 100);
              const isFinished = trip.status === 'finalizada';

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
                        <span className="font-extrabold text-sm text-gray-900">Hoja de Ruta #{trip.tripNumber}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFinished ? 'bg-emerald-100 text-emerald-800' : 'bg-[#0c315b] text-white'
                      }`}>
                        {isFinished ? 'Finalizada' : 'En progreso'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-800">{trip.driverName}</p>
                    <span className="text-[11px] text-gray-500 block">{trip.truck} · {trip.zone} · Últ. GPS: {trip.lastUpdate}</span>

                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-gray-500 font-medium mb-1">
                        <span>{delivered} / {stops.length} entregados</span>
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

                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyDriverLink(trip);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold text-gray-700 flex items-center justify-center space-x-1 transition"
                    >
                      {copiedLink === trip.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          <span>/ruta{trip.tripNumber}</span>
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
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDriverTrip(trip.id, trip.tripNumber);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-sky-50 text-[#0c315b] border border-sky-200 hover:bg-sky-100 font-bold flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Header of Map Card: Toggle Google Maps vs Satelital GPS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 p-3 shadow-2xs">
            <div className="flex items-center space-x-2 min-w-0">
              <Truck className="w-4 h-4 text-[#0c315b] flex-shrink-0" />
              <span className="font-bold text-xs text-gray-900 truncate">
                Recorrido de Hoja de Ruta #{currentTrip.tripNumber} ({currentTrip.driverName})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLiveMapMode('google')}
                  className={`px-3 py-1 rounded-md transition ${
                    liveMapMode === 'google' ? 'bg-white text-[#0c315b] shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Ruta Google Maps
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLiveMapMode('gps');
                    setTimeout(() => leafletMapRef.current?.invalidateSize(), 150);
                  }}
                  className={`px-3 py-1 rounded-md transition ${
                    liveMapMode === 'gps' ? 'bg-white text-[#0c315b] shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Radar GPS Satelital
                </button>
              </div>

              <a
                href={getGoogleMapsDirectionsAppUrl(currentTrip.stops || [], currentTrip.driverCoords ? `${currentTrip.driverCoords.lat},${currentTrip.driverCoords.lng}` : null)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0c315b] border border-sky-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Google Maps Route Container */}
          <div className={liveMapMode === 'google' ? 'flex flex-col h-84 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs' : 'hidden'}>
            <div className="px-3 py-1.5 bg-white border-b border-gray-200 text-[11px] flex items-center justify-between">
              <span className="font-bold text-[#0c315b] truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ruta multi-parada trazada en Google Maps</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {currentTrip.driverCoords ? `GPS Chofer: ${currentTrip.driverCoords.lat.toFixed(4)}, ${currentTrip.driverCoords.lng.toFixed(4)}` : 'Esperando señal GPS'}
              </span>
            </div>
            <iframe
              title="Google Maps Route Live"
              src={getGoogleMapsRouteEmbedUrl(currentTrip.stops || [], currentTrip.driverCoords ? `${currentTrip.driverCoords.lat},${currentTrip.driverCoords.lng}` : null)}
              className="w-full flex-1 border-0"
              loading="lazy"
            />
          </div>

          {/* Leaflet GPS Radar Container (Hidden when Google Maps is active to prevent overlap/DOM recreation) */}
          <div className={liveMapMode === 'gps' ? 'relative border border-gray-200 rounded-xl overflow-hidden h-84 bg-slate-50' : 'hidden'}>
            {loadingLocation && (
              <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-6 text-center space-y-3">
                <h3 className="text-base font-bold text-gray-900">Cargando mapa...</h3>
                <p className="text-xs text-gray-500">Conectando con seguimiento satelital</p>
              </div>
            )}

            <div ref={mapContainerRef} className="w-full h-full z-0"></div>

            <div className="absolute top-3 right-3 z-10 flex space-x-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-gray-200 shadow-2xs">
              <button 
                onClick={() => syncFromDatabase(true)}
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
                title="Centrar en el camión"
              >
                <Crosshair className="w-4 h-4 text-[#0c315b]" />
              </button>
            </div>

            <div className="absolute bottom-2 left-3 right-3 sm:right-auto z-10 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] text-gray-700 border border-gray-200 flex items-center space-x-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="truncate">
                Siguiendo a <strong>{currentTrip.driverName}</strong> · {completedStops}/{totalStops} paradas
              </span>
            </div>
          </div>
        </div>
      )}

      {activeSubtab === 'programar' && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start sm:items-center space-x-2 text-sky-900">
              <div className="w-4 h-4 rounded-full border border-sky-500 text-sky-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 sm:mt-0">
                i
              </div>
              <span>
                Tus repartos están bien distribuidos. Podés revisar sugerencias de balance geográfico entre zonas.
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
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center shadow-2xs space-y-3">
            <div className="w-12 h-12 bg-sky-50 text-[#0c315b] rounded-2xl flex items-center justify-center mx-auto border border-sky-100">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-gray-900">No hay recorridos fijos semanales</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No tenés recorridos semanales programados todavía. Podés armar tus hojas de ruta directamente desde el módulo <strong>Repartir</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {showQueEsBalanceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">¿Qué es Sugerir balance?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Sugerir balance agrupa clientes cercanos geográficamente para acortar distancias y ahorrar combustible en cada Hoja de Ruta.
            </p>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowQueEsBalanceModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#0c315b] text-white font-bold text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {showSugerenciasModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-gray-900">Sugerencias de balance</h3>
              <button onClick={() => setShowSugerenciasModal(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
              <input type="checkbox" checked={limitActive} onChange={(e) => setLimitActive(e.target.checked)} className="rounded text-[#0c315b]" />
              <span>Diferencia máx. de paradas:</span>
              <input type="number" value={limitParadas} onChange={(e) => setLimitParadas(Number(e.target.value))} className="w-14 px-2 py-0.5 border rounded text-center font-bold" />
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Tus repartos ya están bien distribuidos geográficamente.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
