import React, { useState } from 'react';
import { 
  RotateCw, 
  Plus, 
  FileText, 
  Search, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Map as MapIcon, 
  ClipboardList, 
  Check, 
  CheckCircle,
  Clock, 
  ChevronRight,
  ArrowUp,
  X,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Repartir({ onOpenComprobante }) {
  const [subtab, setSubtab] = useState('reparto'); // 'reparto' | 'programados'
  const [mode, setMode] = useState('pedidos'); // 'pedidos' | 'mapa'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedStopForDelivery, setSelectedStopForDelivery] = useState(null);
  const [deliveredQty20L, setDeliveredQty20L] = useState(2);
  const [deliveredQty12L, setDeliveredQty12L] = useState(0);
  const [deliveredQtySoda, setDeliveredQtySoda] = useState(2);
  const [collectedEmpty20L, setCollectedEmpty20L] = useState(2);
  const [paymentType, setPaymentType] = useState('Efectivo');

  // List of stops matching visual-mobile.png & comprobantes.png
  const [stops, setStops] = useState([
    {
      id: '901525',
      orderNumber: 1,
      clientName: 'Don Mario Talleres',
      address: 'Loyola 320, Villa Crespo',
      phone: '5491155550101',
      lastDelivery: 'hace 4 días (15/09) · 2x Bidón 20L',
      balance: 0,
      time: '15:20',
      status: 'entregado',
      items: [{ name: 'Bidón 20L', qty: 2, price: 4200 }],
      total: 8400
    },
    {
      id: '901526',
      orderNumber: 2,
      clientName: 'Familia Rossi',
      address: 'Serrano 540, Villa Crespo',
      phone: '5491155550102',
      lastDelivery: 'hace 7 días (12/09) · 1x Bidón 20L + 2 Sifones',
      balance: 0,
      time: '15:35',
      status: 'entregado',
      items: [
        { name: 'Bidón 20L', qty: 1, price: 4200 },
        { name: 'Sifón Soda 1.5L', qty: 2, price: 1300 }
      ],
      total: 6800
    },
    {
      id: '901527',
      orderNumber: 3,
      clientName: 'Consultorio Dental Crespo',
      address: 'Corrientes 4800, Piso 2',
      phone: '5491155550103',
      lastDelivery: 'hace 5 días (14/09) · 3x Bidón 20L',
      balance: 0,
      time: '15:45',
      status: 'entregado',
      items: [{ name: 'Bidón 20L', qty: 3, price: 4200 }],
      total: 12600
    },
    {
      id: '901528',
      orderNumber: 4,
      isNextStop: true, // PRÓXIMA PARADA in visual-mobile.png
      clientName: 'María Esther López',
      address: 'Camargo 460, Villa Crespo',
      phone: '5491155550105',
      lastDelivery: 'hace 2 días (17/09) · 2x Bidón 20L',
      balance: 0,
      time: '15:53',
      status: 'en_camino',
      items: [{ name: 'Bidón 20L', qty: 2, price: 4200 }],
      total: 8400
    },
    {
      id: '901529',
      orderNumber: 5,
      clientName: 'Rubén Álvarez',
      address: 'Vera 620, Villa Crespo',
      phone: '5491155550106',
      lastDelivery: 'hace 3 días (18/09) · 3x Bidón 20L',
      balance: 0,
      time: '15:55',
      status: 'en_camino',
      items: [{ name: 'Bidón 20L', qty: 3, price: 4200 }],
      total: 12600
    },
    {
      id: '901531',
      orderNumber: 6,
      clientName: 'Raúl Medina',
      address: 'Neuquén 750, Caballito',
      phone: '5491155550107',
      lastDelivery: 'hace 20 días (30/08) · 2x Bidón 12L',
      balance: -3500.00,
      time: '16:00',
      status: 'en_camino',
      items: [{ name: 'Bidón 12L c/ canilla', qty: 2, price: 3300 }],
      total: 6600
    },
    {
      id: '901532',
      orderNumber: 7,
      clientName: 'Roberto Fernández', // From comprobantes.png!
      address: 'Aguirre 750, Villa Crespo',
      phone: '5491155550108',
      lastDelivery: 'hace 15 días (01/09) · 4x Bidón 20L',
      balance: -13500.00,
      time: '16:15',
      status: 'en_camino',
      items: [
        { name: 'Bidón 20L', qty: 4, price: 4500 }
      ],
      total: 18000
    },
    {
      id: '901533',
      orderNumber: 8,
      clientName: 'Almacén Don Tito',
      address: 'Acevedo 820, Villa Crespo',
      phone: '5491155550109',
      lastDelivery: 'hace 6 días (13/09) · 1x Cajón Soda',
      balance: 0,
      time: '16:30',
      status: 'en_camino',
      items: [{ name: 'Cajón x6 Sifones 1.5L', qty: 1, price: 7500 }],
      total: 7500
    }
  ]);

  const deliveredCount = stops.filter(s => s.status === 'entregado').length;
  const totalStops = stops.length;

  const handleStartDelivery = (stop) => {
    setSelectedStopForDelivery(stop);
    setShowDeliveryModal(true);
  };

  const handleConfirmDelivery = () => {
    if (!selectedStopForDelivery) return;

    try {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
    } catch (e) {}

    setStops(stops.map(s => {
      if (s.id === selectedStopForDelivery.id) {
        return {
          ...s,
          status: 'entregado',
          isNextStop: false
        };
      }
      return s;
    }));

    // Set next pending stop as isNextStop
    const nextIdx = stops.findIndex(s => s.status !== 'entregado' && s.id !== selectedStopForDelivery.id);
    if (nextIdx !== -1) {
      setStops(prev => prev.map((s, idx) => ({ ...s, isNextStop: idx === nextIdx })));
    }

    setShowDeliveryModal(false);
  };

  const handleOpenMaps = (address) => {
    const q = encodeURIComponent(`${address}, Buenos Aires, Argentina`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
  };

  const handleSendWhatsApp = (stop) => {
    const msg = encodeURIComponent(
      `¡Hola ${stop.clientName}! 🚚 Desde Soda y Agua POLAR te avisamos que estamos llegando en 5 minutos a ${stop.address} con tu pedido.`
    );
    window.open(`https://wa.me/${stop.phone}?text=${msg}`, '_blank');
  };

  return (
    <div className="max-w-xl mx-auto space-y-3 pb-8">
      
      {/* Subtabs matching visual-mobile.png: REPARTO | REPARTOS PROGRAMADOS */}
      <div className="flex items-center space-x-6 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500 pt-1">
        <button
          onClick={() => setSubtab('reparto')}
          className={`pb-2 transition border-b-2 ${
            subtab === 'reparto'
              ? 'border-[#0c315b] text-[#0c315b] font-bold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          Reparto
        </button>
        <button
          onClick={() => setSubtab('programados')}
          className={`pb-2 transition border-b-2 ${
            subtab === 'programados'
              ? 'border-[#0c315b] text-[#0c315b] font-bold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          Repartos Programados
        </button>
      </div>

      {/* Header: "3 de 8 entregados" with action icons */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base font-extrabold text-gray-900">
          {deliveredCount} de {totalStops} entregados
        </h2>
        <div className="flex items-center space-x-2 text-gray-500">
          <button className="p-1 hover:text-gray-900" title="Actualizar">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="p-1 hover:text-gray-900" title="Agregar parada">
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onOpenComprobante(stops[6])}
            className="p-1 hover:text-gray-900" 
            title="Ver comprobante"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toggle buttons: [📋 Pedidos] (selected) vs [🗺️ Mapa] (matching visual-mobile.png) */}
      <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setMode('pedidos')}
          className={`py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
            mode === 'pedidos'
              ? 'bg-[#0c315b] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Pedidos</span>
        </button>
        <button
          onClick={() => setMode('mapa')}
          className={`py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
            mode === 'mapa'
              ? 'bg-[#0c315b] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Mapa</span>
        </button>
      </div>

      {/* ===================== MODE 1: PEDIDOS LIST ===================== */}
      {mode === 'pedidos' && (
        <div className="space-y-3">
          
          {/* Search box with outline style */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o dirección"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:border-[#0c315b] outline-none shadow-2xs"
            />
          </div>

          {/* Stops List */}
          <div className="space-y-3">
            {stops
              .filter(s => 
                s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.address.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((stop) => {
                const isNext = stop.isNextStop && stop.status !== 'entregado';
                const isDelivered = stop.status === 'entregado';

                return (
                  <div
                    key={stop.id}
                    className={`rounded-2xl transition border overflow-hidden bg-white shadow-2xs ${
                      isNext 
                        ? 'border-2 border-[#0c315b] ring-2 ring-sky-100' 
                        : isDelivered
                        ? 'border-gray-200 opacity-75'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Top banner: PRÓXIMA PARADA (matching visual-mobile.png) */}
                    {isNext && (
                      <div className="bg-[#0c315b] text-white px-3 py-1 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          📍 PRÓXIMA PARADA
                        </span>
                        <span className="text-[10px] text-sky-200">Parada #{stop.orderNumber}</span>
                      </div>
                    )}

                    <div className="p-4 space-y-2.5">
                      
                      {/* Top Row: Order # + Client Name + Actions */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isNext
                              ? 'bg-[#0c315b] text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isDelivered ? '✓' : `#${stop.orderNumber}`}
                          </span>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">
                              #{stop.id} - {stop.clientName}
                            </h3>
                          </div>
                        </div>

                        {/* Action Icons: Map, WhatsApp, Phone */}
                        <div className="flex items-center space-x-2 text-gray-500">
                          <button 
                            onClick={() => handleOpenMaps(stop.address)}
                            className="p-1 hover:text-[#0c315b]" 
                            title="Abrir mapa"
                          >
                            <MapPin className="w-4 h-4 text-sky-600" />
                          </button>
                          <button 
                            onClick={() => handleSendWhatsApp(stop)}
                            className="p-1 hover:text-emerald-600" 
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button 
                            onClick={() => window.open(`tel:${stop.phone}`)}
                            className="p-1 hover:text-[#0c315b]" 
                            title="Llamar"
                          >
                            <Phone className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <span className="text-gray-400">📍</span>
                        <span className="font-medium text-gray-800">{stop.address}</span>
                      </div>

                      {/* Last Delivery note */}
                      <div className="text-[11px] text-amber-700 bg-amber-50/70 px-2 py-1 rounded-md border border-amber-200/60 font-medium">
                        Última entrega: {stop.lastDelivery}
                      </div>

                      {/* Saldo, Hora y Badge de Estado */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-gray-500">Saldo: </span>
                          <strong className={stop.balance < 0 ? 'text-rose-600 font-bold' : 'text-gray-900 font-bold'}>
                            {stop.balance < 0 ? `$-${Math.abs(stop.balance).toFixed(2)}` : '$0.00'}
                          </strong>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-gray-400 font-mono">{stop.time}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-[#0c315b]'
                          }`}>
                            {isDelivered ? 'Entregado' : 'En camino'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons on card (especially for Next Stop or pending) */}
                      {!isDelivered && (
                        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onOpenComprobante(stop)}
                            className="py-2 px-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
                          >
                            Ver Comprobante
                          </button>
                          
                          <button
                            onClick={() => handleStartDelivery(stop)}
                            className="py-2 px-3 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs flex items-center justify-center space-x-1 transition shadow-xs"
                          >
                            <span>Entregar</span>
                          </button>
                        </div>
                      )}

                      {isDelivered && (
                        <div className="pt-1 text-right">
                          <button
                            onClick={() => onOpenComprobante(stop)}
                            className="text-[11px] font-bold text-sky-700 hover:underline"
                          >
                            Ver comprobante firmado →
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* ===================== MODE 2: MAPA INTERACTIVO (matching visual-mobile.png right screen) ===================== */}
      {mode === 'mapa' && (
        <div className="space-y-3">
          
          {/* Progress bar: 3/8 completados */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
              <span>Progreso del reparto</span>
              <span className="text-[#0c315b]">{deliveredCount}/{totalStops} completados</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0c315b] rounded-full transition-all duration-300"
                style={{ width: `${(deliveredCount / totalStops) * 100}%` }}
              ></div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-3 text-[10px] text-gray-600 font-medium pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                En camino
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Entregado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Ausente
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Cancelado
              </span>
            </div>
          </div>

          {/* Map view */}
          <div className="relative border border-gray-200 rounded-2xl overflow-hidden h-96 bg-slate-100 shadow-2xs">
            
            {/* SVG Map Illustration with 8 numbered points and route line */}
            <svg className="w-full h-full object-cover" viewBox="0 0 600 700" preserveAspectRatio="none">
              <rect width="600" height="700" fill="#f4f4f2" />
              {/* Streets */}
              <line x1="100" y1="0" x2="100" y2="700" stroke="#e3e3df" strokeWidth="4" />
              <line x1="220" y1="0" x2="220" y2="700" stroke="#e3e3df" strokeWidth="4" />
              <line x1="360" y1="0" x2="360" y2="700" stroke="#e3e3df" strokeWidth="4" />
              <line x1="500" y1="0" x2="500" y2="700" stroke="#e3e3df" strokeWidth="4" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#e3e3df" strokeWidth="4" />
              <line x1="0" y1="260" x2="600" y2="260" stroke="#e3e3df" strokeWidth="4" />
              <line x1="0" y1="420" x2="600" y2="420" stroke="#e3e3df" strokeWidth="4" />
              <line x1="0" y1="580" x2="600" y2="580" stroke="#e3e3df" strokeWidth="4" />
              
              {/* Diagonal avenue */}
              <line x1="50" y1="650" x2="550" y2="50" stroke="#dadad5" strokeWidth="8" />

              {/* Red dashed route line */}
              <path 
                d="M 470 120 L 390 190 L 310 260 L 320 360 L 370 480 L 440 540" 
                fill="none" 
                stroke="#0c315b" 
                strokeWidth="3.5" 
                strokeDasharray="6,4" 
              />

              {/* Completed Pins (Green) */}
              <g transform="translate(470, 120)"><circle r="14" fill="#10b981" /><text textAnchor="middle" dy="4" fill="white" fontSize="11" fontWeight="bold">1</text></g>
              <g transform="translate(390, 190)"><circle r="14" fill="#10b981" /><text textAnchor="middle" dy="4" fill="white" fontSize="11" fontWeight="bold">2</text></g>
              <g transform="translate(310, 260)"><circle r="14" fill="#10b981" /><text textAnchor="middle" dy="4" fill="white" fontSize="11" fontWeight="bold">3</text></g>

              {/* Current Active Pin #4 (Polar Navy Highlight with pulse) */}
              <g transform="translate(320, 360)">
                <circle r="20" fill="#0c315b" opacity="0.3" className="animate-ping" />
                <circle r="16" fill="#0c315b" />
                <text textAnchor="middle" dy="4" fill="white" fontSize="12" fontWeight="bold">4</text>
              </g>

              {/* Pending Pins (Sky Blue) */}
              <g transform="translate(370, 480)"><circle r="14" fill="#0284c7" /><text textAnchor="middle" dy="4" fill="white" fontSize="11" fontWeight="bold">5</text></g>
              <g transform="translate(440, 540)"><circle r="14" fill="#0284c7" /><text textAnchor="middle" dy="4" fill="white" fontSize="11" fontWeight="bold">6</text></g>
              <g transform="translate(230, 520)"><circle r="14" fill="#0284c7" /><text textAnchor="middle" dy="4" fill="white" fontSize="11" fontWeight="bold">7</text></g>
              <g transform="translate(180, 420)"><circle r="14" fill="#0284c7" /><text textAnchor="middle" dy="4" fill="white" fontSize="11" fontWeight="bold">8</text></g>
            </svg>

            {/* Bottom floating card in map (matching visual-mobile.png right screen) */}
            <div className="absolute bottom-3 left-3 right-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-md bg-[#0c315b] text-white font-bold text-xs flex items-center justify-center">
                    #4
                  </span>
                  <span className="font-bold text-xs text-gray-900">María Esther López</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0c315b]">
                  En camino
                </span>
              </div>
              <p className="text-[11px] text-gray-600">Camargo 460, Villa Crespo</p>
              
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>Saldo: <strong className="text-gray-900">$0.00</strong></span>
                <span className="text-amber-700 font-medium">Última: hace 2 días · 2x Bidón 20L</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => handleSendWhatsApp(stops[3])}
                  className="py-1.5 rounded-lg border border-emerald-500 text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition"
                >
                  Avisar llegada
                </button>
                <button 
                  onClick={() => handleStartDelivery(stops[3])}
                  className="py-1.5 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs transition"
                >
                  Entregar
                </button>
              </div>
            </div>
          </div>

          {/* Big green button at the bottom: [✓ Finalizar reparto] */}
          <button 
            onClick={() => alert('¡Reparto de hoy finalizado exitosamente! Todos los datos fueron sincronizados.')}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-sm transition"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Finalizar reparto</span>
          </button>
        </div>
      )}

      {/* ===================== MODAL DE ENTREGA (FORMULARIO DEL CHOFER) ===================== */}
      {showDeliveryModal && selectedStopForDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-gray-200">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">Registrar Entrega</h3>
                <p className="text-xs text-gray-500">{selectedStopForDelivery.clientName}</p>
              </div>
              <button 
                onClick={() => setShowDeliveryModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Productos Llenos que se Bajan */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">
                1. Bidones Llenos a Dejar
              </span>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-800">Bidón 20L ($4.200)</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setDeliveredQty20L(Math.max(0, deliveredQty20L - 1))}
                      className="w-6 h-6 rounded bg-white border border-gray-300 font-bold"
                    >-</button>
                    <span className="font-black text-sm w-4 text-center">{deliveredQty20L}</span>
                    <button 
                      onClick={() => setDeliveredQty20L(deliveredQty20L + 1)}
                      className="w-6 h-6 rounded bg-[#0c315b] text-white font-bold"
                    >+</button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-800">Sifón Soda ($1.300)</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setDeliveredQtySoda(Math.max(0, deliveredQtySoda - 1))}
                      className="w-6 h-6 rounded bg-white border border-gray-300 font-bold"
                    >-</button>
                    <span className="font-black text-sm w-4 text-center">{deliveredQtySoda}</span>
                    <button 
                      onClick={() => setDeliveredQtySoda(deliveredQtySoda + 1)}
                      className="w-6 h-6 rounded bg-[#0c315b] text-white font-bold"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Envases Vacíos Retirados (Control de Trazabilidad) */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">
                2. Envases Vacíos Retirados
              </span>
              <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-800">Bidones 20L Retornados</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCollectedEmpty20L(Math.max(0, collectedEmpty20L - 1))}
                    className="w-6 h-6 rounded bg-white border border-gray-300 font-bold"
                  >-</button>
                  <span className="font-black text-sm w-4 text-center">{collectedEmpty20L}</span>
                  <button 
                    onClick={() => setCollectedEmpty20L(collectedEmpty20L + 1)}
                    className="w-6 h-6 rounded bg-[#0c315b] text-white font-bold"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Medio de Pago */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">
                3. Medio de Pago
              </span>
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

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-bold">
              <span>Total a cobrar:</span>
              <span className="text-base font-black text-[#0c315b]">
                ${((deliveredQty20L * 4200) + (deliveredQtySoda * 1300)).toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleConfirmDelivery}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>CONFIRMAR ENTREGA</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
