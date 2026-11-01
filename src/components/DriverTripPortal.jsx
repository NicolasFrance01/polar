import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  RotateCw, 
  Navigation, 
  Crosshair, 
  Check, 
  X,
  ArrowLeft,
  Radio,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredTrips, saveTrips } from '../services/tripSync';

export default function DriverTripPortal({ tripId = 'VIAJE-25', onBackToAdmin, onOpenComprobante }) {
  const [trips, setTrips] = useState(getStoredTrips);
  const currentTrip = trips[tripId] || trips['VIAJE-25'];

  const [activeStopModal, setActiveStopModal] = useState(null);
  const [deliveredQty20L, setDeliveredQty20L] = useState(2);
  const [returnedEmpty, setReturnedEmpty] = useState(2);
  const [paymentType, setPaymentType] = useState('Efectivo');
  const [isTransmittingGps, setIsTransmittingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Watch GPS if transmitting
  useEffect(() => {
    let watchId = null;
    if (isTransmittingGps && navigator.geolocation) {
      setGpsStatus('Transmitiendo señal GPS en vivo...');
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          // Update trip driverCoords and save
          const updated = {
            ...trips,
            [tripId]: {
              ...currentTrip,
              driverCoords: newCoords,
              lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          };
          setTrips(updated);
          saveTrips(updated);
          setGpsStatus(`GPS Activo: ±${Math.round(pos.coords.accuracy)}m`);
        },
        (err) => {
          setGpsStatus('No se pudo acceder al GPS del celular.');
        },
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTransmittingGps, tripId]);

  const handleOpenDelivery = (stop) => {
    setActiveStopModal(stop);
    setDeliveredQty20L(stop.items.find(i => i.name.includes('20L'))?.qty || 2);
    setReturnedEmpty(2);
    setPaymentType(stop.paymentMethod || 'Efectivo');
  };

  const handleConfirmDelivery = () => {
    if (!activeStopModal) return;

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (e) {}

    const updatedStops = currentTrip.stops.map(s => {
      if (s.id === activeStopModal.id) {
        return {
          ...s,
          status: 'entregado',
          deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          returnedEmpty: returnedEmpty,
          paymentMethod: paymentType
        };
      }
      return s;
    });

    // Mark next pending stop as next
    const nextIdx = updatedStops.findIndex(s => s.status !== 'entregado');
    if (nextIdx !== -1) {
      updatedStops.forEach((s, idx) => {
        s.isNext = idx === nextIdx;
      });
    }

    const updatedTrips = {
      ...trips,
      [tripId]: {
        ...currentTrip,
        stops: updatedStops,
        lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    };

    setTrips(updatedTrips);
    saveTrips(updatedTrips);
    setActiveStopModal(null);
  };

  const completedCount = currentTrip.stops.filter(s => s.status === 'entregado').length;
  const totalStops = currentTrip.stops.length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-12 flex flex-col justify-between">
      
      {/* Top Driver Header */}
      <header className="bg-[#0c315b] text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-sky-300">
              <img src="/images/logo-polar.png" alt="Polar" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm">Hoja de Ruta #{currentTrip.tripNumber}</span>
                <span className="px-1.5 py-0.2 bg-emerald-500 text-[10px] font-bold rounded">EN VIVO</span>
              </div>
              <span className="text-[11px] text-sky-200 block">{currentTrip.driverName} · {currentTrip.truck}</span>
            </div>
          </div>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-sky-200"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md w-full mx-auto p-4 space-y-3.5 flex-1">
        
        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-gray-700">Progreso del Reparto</span>
            <span className="text-[#0c315b] text-sm">{completedCount} de {totalStops} entregados</span>
          </div>
          
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalStops) * 100}%` }}
            ></div>
          </div>

          {/* GPS Live Transmission Button */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setIsTransmittingGps(!isTransmittingGps)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                isTransmittingGps
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isTransmittingGps ? 'animate-pulse text-white' : 'text-gray-500'}`} />
              <span>{isTransmittingGps ? 'GPS en Vivo Activado' : 'Transmitir GPS al Dueño'}</span>
            </button>

            <span className="text-[10px] text-gray-400 font-mono">
              {gpsStatus || 'Sincronizado'}
            </span>
          </div>
        </div>

        {/* Stops List */}
        <div className="space-y-3">
          {currentTrip.stops.map((stop) => {
            const isDelivered = stop.status === 'entregado';
            const isNext = stop.isNext && !isDelivered;

            return (
              <div
                key={stop.id}
                className={`rounded-2xl transition border overflow-hidden bg-white shadow-2xs ${
                  isNext
                    ? 'border-2 border-[#0c315b] ring-2 ring-sky-100'
                    : isDelivered
                    ? 'border-gray-200 opacity-80'
                    : 'border-gray-200'
                }`}
              >
                {/* Banner for Next Stop */}
                {isNext && (
                  <div className="bg-[#0c315b] text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider flex justify-between items-center">
                    <span>📍 PRÓXIMA PARADA</span>
                    <span className="text-[10px] text-sky-200">Parada #{stop.orderNumber}</span>
                  </div>
                )}

                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                        isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-[#0c315b] text-white'
                      }`}>
                        {isDelivered ? '✓' : `#${stop.orderNumber}`}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{stop.clientName}</h4>
                        <span className="text-[11px] text-gray-500">{stop.address}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-[#0c315b]'
                    }`}>
                      {isDelivered ? `Entregado ${stop.deliveredAt}` : 'En camino'}
                    </span>
                  </div>

                  {/* Products */}
                  <div className="bg-gray-50 p-2 rounded-lg text-xs font-semibold text-gray-700 flex justify-between items-center">
                    <span>{stop.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</span>
                    <strong className="text-[#0c315b] text-sm">${stop.total.toLocaleString()}</strong>
                  </div>

                  {/* Actions for Pending Stop */}
                  {!isDelivered ? (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                      <button
                        onClick={() => {
                          const q = encodeURIComponent(`${stop.address}, Córdoba`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
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
                  ) : (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold pt-1">
                      <span>✓ Entregado y cobrado ({stop.paymentMethod})</span>
                      <button
                        onClick={() => onOpenComprobante && onOpenComprobante(stop)}
                        className="text-[11px] text-[#0c315b] hover:underline flex items-center gap-0.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver recibo</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* DELIVERY MODAL FOR DRIVER */}
      {activeStopModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Registrar Entrega</h3>
                <span className="text-xs text-gray-500">{activeStopModal.clientName}</span>
              </div>
              <button onClick={() => setActiveStopModal(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Containers delivered */}
            <div>
              <span className="text-xs font-bold text-gray-700 block mb-1">Bidones Llenos Bajados:</span>
              <div className="flex items-center space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <button onClick={() => setDeliveredQty20L(Math.max(1, deliveredQty20L - 1))} className="w-8 h-8 rounded-lg bg-white border font-bold">-</button>
                <span className="font-black text-base flex-1 text-center">{deliveredQty20L}x Bidón 20L</span>
                <button onClick={() => setDeliveredQty20L(deliveredQty20L + 1)} className="w-8 h-8 rounded-lg bg-[#0c315b] text-white font-bold">+</button>
              </div>
            </div>

            {/* Containers collected */}
            <div>
              <span className="text-xs font-bold text-gray-700 block mb-1">Envases Vacíos Subidos al Camión:</span>
              <div className="flex items-center space-x-3 bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                <button onClick={() => setReturnedEmpty(Math.max(0, returnedEmpty - 1))} className="w-8 h-8 rounded-lg bg-white border font-bold">-</button>
                <span className="font-black text-base flex-1 text-center text-[#0c315b]">{returnedEmpty}x Vacíos</span>
                <button onClick={() => setReturnedEmpty(returnedEmpty + 1)} className="w-8 h-8 rounded-lg bg-[#0c315b] text-white font-bold">+</button>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <span className="text-xs font-bold text-gray-700 block mb-1">Forma de Pago:</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {['Efectivo', 'Transferencia', 'Fiado'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentType(m)}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      paymentType === m
                        ? 'bg-[#0c315b] text-white border-[#0c315b]'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-sm font-bold">
              <span>Total a cobrar:</span>
              <span className="text-base font-black text-[#0c315b]">${activeStopModal.total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleConfirmDelivery}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition"
            >
              CONFIRMAR Y SINCRONIZAR CON PLANTA
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-[11px] text-gray-400 py-2">
        Soda y Agua POLAR · Hoja de Ruta Activa
      </footer>

    </div>
  );
}
