import React, { useState } from 'react';
import { 
  Navigation, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  DollarSign, 
  Package, 
  RotateCcw, 
  Plus, 
  Minus, 
  AlertCircle,
  Truck,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DriverRouteView({ route, onUpdateStop, clients }) {
  const [activeStopIndex, setActiveStopIndex] = useState(() => {
    const firstPending = route.findIndex(s => s.status !== 'entregado');
    return firstPending >= 0 ? firstPending : 0;
  });

  const activeStop = route[activeStopIndex] || route[0];

  // Delivery form state for the active stop
  const [returned20L, setReturned20L] = useState(activeStop?.expectedContainersToReturn?.bidon_20l || 0);
  const [returned12L, setReturned12L] = useState(activeStop?.expectedContainersToReturn?.bidon_12l || 0);
  const [returnedSoda, setReturnedSoda] = useState(activeStop?.expectedContainersToReturn?.sifon_15l || 0);
  const [paymentType, setPaymentType] = useState(activeStop?.paymentMethod || 'Efectivo');
  const [notes, setNotes] = useState('');

  // Sync state when active stop changes
  React.useEffect(() => {
    if (activeStop) {
      setReturned20L(activeStop.expectedContainersToReturn?.bidon_20l || 0);
      setReturned12L(activeStop.expectedContainersToReturn?.bidon_12l || 0);
      setReturnedSoda(activeStop.expectedContainersToReturn?.sifon_15l || 0);
      setPaymentType(activeStop.paymentMethod || 'Efectivo');
      setNotes('');
    }
  }, [activeStopIndex, activeStop?.orderId]);

  const handleConfirmDelivery = () => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // fallback if canvas-confetti is not loaded
    }

    const updated = {
      ...activeStop,
      status: 'entregado',
      deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      collectedAmount: activeStop.totalAmount,
      paymentMethod: paymentType,
      returnedContainers: {
        bidon_20l: returned20L,
        bidon_12l: returned12L,
        sifon_15l: returnedSoda
      },
      driverNotes: notes
    };

    onUpdateStop(activeStop.orderId, updated);

    // Auto-advance to next pending stop
    const nextPending = route.findIndex((s, idx) => idx > activeStopIndex && s.status !== 'entregado');
    if (nextPending !== -1) {
      setActiveStopIndex(nextPending);
    }
  };

  const handleOpenMaps = (address) => {
    const query = encodeURIComponent(`${address}, Cordoba, Argentina`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  const handleSendArrivalWhatsApp = (stop) => {
    const text = encodeURIComponent(
      `¡Hola ${stop.clientName}! 🚚 Te avisamos desde Soda y Agua POLAR que nuestro repartidor está llegando a tu domicilio (${stop.address}) en aproximadamente 5 minutos con tu pedido.`
    );
    window.open(`https://wa.me/${stop.phone}?text=${text}`, '_blank');
  };

  // Stats
  const completedCount = route.filter(s => s.status === 'entregado').length;
  const totalStops = route.length;
  const totalMoney = route.filter(s => s.status === 'entregado').reduce((sum, s) => sum + s.collectedAmount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Driver Bar */}
      <div className="bg-[#0a2544] text-white p-4 rounded-2xl shadow-lg border border-sky-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base text-white">Camión #2 · Zona Alberdi y Centro</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Turno Mañana
              </span>
            </div>
            <p className="text-xs text-sky-200/80">Chofer: Matías Luján · 4 paradas programadas</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
          <div>
            <span className="text-sky-300 block text-[10px] uppercase">Progreso</span>
            <span className="font-extrabold text-white text-sm">{completedCount} de {totalStops}</span>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <div>
            <span className="text-sky-300 block text-[10px] uppercase">Recaudado</span>
            <span className="font-extrabold text-emerald-400 text-sm">${totalMoney.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Parada Activa & Lista de Paradas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Detalle de Parada Activa (Móvil First) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border-2 border-sky-600/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                  #{activeStop.stopNumber}
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    {activeStop.clientName}
                  </h3>
                  <span className="text-xs text-sky-700 font-semibold">{activeStop.neighborhood}</span>
                </div>
              </div>

              {activeStop.status === 'entregado' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Entregado a las {activeStop.deliveredAt}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Próxima Parada</span>
                </span>
              )}
            </div>

            {/* Dirección y Botones de Acción de Chofer */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 mb-4">
              <div className="flex items-start space-x-2 text-slate-800 text-sm font-medium mb-3">
                <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{activeStop.address}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {clients.find(c => c.id === activeStop.clientId)?.notes || 'Tocar timbre al llegar.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenMaps(activeStop.address)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                >
                  <Navigation className="w-4 h-4 text-sky-400" />
                  <span>Abrir GPS / Mapa</span>
                </button>

                <button
                  onClick={() => handleSendArrivalWhatsApp(activeStop)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Avisar x WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Artículos a Bajar del Camión */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Productos a entregar
              </h4>
              <div className="space-y-2">
                {activeStop.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-600 text-white font-extrabold text-xs">
                        x{item.qty}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ${(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 px-1 text-sm font-bold text-slate-700">
                <span>Total a cobrar:</span>
                <span className="text-lg font-black text-sky-700">${activeStop.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Registro de Devolución de Envases */}
            <div className="border-t border-slate-200 pt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-sky-600" />
                  <span>Envases Retirados (Vacíos)</span>
                </h4>
                <span className="text-[11px] text-slate-400">Control de retorno</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Bidón 20L */}
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-700 block">Bidón 20L</span>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <button 
                      onClick={() => setReturned20L(Math.max(0, returned20L - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-black text-slate-900 text-base w-6">{returned20L}</span>
                    <button 
                      onClick={() => setReturned20L(returned20L + 1)}
                      className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bidón 12L */}
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-700 block">Bidón 12L</span>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <button 
                      onClick={() => setReturned12L(Math.max(0, returned12L - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-black text-slate-900 text-base w-6">{returned12L}</span>
                    <button 
                      onClick={() => setReturned12L(returned12L + 1)}
                      className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Sifones */}
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-700 block">Sifones 1.5L</span>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <button 
                      onClick={() => setReturnedSoda(Math.max(0, returnedSoda - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-black text-slate-900 text-base w-6">{returnedSoda}</span>
                    <button 
                      onClick={() => setReturnedSoda(returnedSoda + 1)}
                      className="w-7 h-7 rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="border-t border-slate-200 pt-3 mb-4">
              <span className="text-xs font-bold text-slate-600 block mb-2">Forma de Pago del Cliente:</span>
              <div className="grid grid-cols-3 gap-2">
                {['Efectivo', 'Transferencia', 'Cuenta Corriente'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentType(method)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                      paymentType === method
                        ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentType === 'Transferencia' && (
                <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <span>Alias para cobrar: <strong className="font-mono font-bold">POLAR.AGUA</strong></span>
                  <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded font-bold">Titular: Soda y Agua Polar</span>
                </div>
              )}
            </div>

            {/* Botón de Confirmación Principal */}
            {activeStop.status !== 'entregado' ? (
              <button
                onClick={handleConfirmDelivery}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base flex items-center justify-center space-x-2 shadow-lg transition transform active:scale-98"
              >
                <CheckCircle className="w-5 h-5" />
                <span>CONFIRMAR ENTREGA Y COBRO</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-emerald-800 font-bold text-sm">
                  ✓ Parada confirmada y registrada en el sistema
                </span>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Lista de Todas las Paradas del Día */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Recorrido de Hoy ({route.length} paradas)
            </h3>
            <span className="text-xs text-slate-500 font-medium">Orden de visita</span>
          </div>

          <div className="space-y-2.5">
            {route.map((stop, index) => {
              const isSelected = index === activeStopIndex;
              const isDelivered = stop.status === 'entregado';

              return (
                <div
                  key={stop.orderId}
                  onClick={() => setActiveStopIndex(index)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 shadow-sm ring-1 ring-sky-400'
                      : isDelivered
                      ? 'bg-emerald-50/40 border-emerald-200 opacity-80'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                      isDelivered 
                        ? 'bg-emerald-600 text-white' 
                        : isSelected 
                        ? 'bg-sky-600 text-white' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isDelivered ? '✓' : `#${stop.stopNumber}`}
                    </span>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{stop.clientName}</h4>
                      <p className="text-xs text-slate-500">{stop.address}</p>
                      <div className="flex items-center space-x-2 mt-1 text-[11px]">
                        <span className="font-semibold text-slate-700">
                          {stop.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm block">
                      ${stop.totalAmount.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isDelivered ? 'Entregado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Truck Stock Summary */}
          <div className="bg-slate-900 text-white p-4 rounded-xl text-xs space-y-2 mt-4">
            <div className="flex items-center justify-between font-bold text-sky-300">
              <span>Inventario a bordo del camión:</span>
              <span>Camión #2</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
              <div>
                <span className="text-slate-400 block text-[10px]">Bidones 20L</span>
                <strong className="text-white text-sm">36 llenos / 9 vacíos</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Bidones 12L</span>
                <strong className="text-white text-sm">24 llenos / 2 vacíos</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sifones 1.5L</span>
                <strong className="text-white text-sm">56 llenos / 6 vacíos</strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
