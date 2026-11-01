import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  User, 
  Send, 
  CheckCircle, 
  Crosshair, 
  ShoppingBag, 
  MessageCircle, 
  Clock, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { POLAR_PRODUCTS } from '../data/mockData';
import { saveOrder, encodeOrderParam } from '../services/tripSync';

export default function ClientPublicPortal({ onOrderCreated, onBackToAdmin }) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('Alberdi');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Cart quantities
  const [cart, setCart] = useState({
    'prod-20l': 2,
    'prod-12l': 0,
    'prod-soda': 2,
    'prod-dispenser': 0
  });

  const [orderSubmitted, setOrderSubmitted] = useState(null);

  // Use browser geolocation to capture exact customer pin and autofill address
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Obteniendo coordenadas satelitales...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setLocationStatus('Identificando calle y barrio con GPS...');

        try {
          let foundStreet = '';
          let foundBarrio = '';

          // 1. Try OpenStreetMap Nominatim reverse geocoding
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              {
                headers: { 'Accept-Language': 'es' }
              }
            );
            if (res.ok) {
              const data = await res.json();
              if (data && data.address) {
                const a = data.address;
                const road = a.road || a.pedestrian || a.street || a.footway || '';
                const number = a.house_number || '';
                foundStreet = road ? (number ? `${road} ${number}` : road) : (data.display_name?.split(',')[0] || '');
                foundBarrio = a.suburb || a.neighbourhood || a.city_district || a.quarter || a.residential || a.city || '';
              }
            }
          } catch (e) {
            console.warn('Nominatim fallback, trying BigDataCloud...', e);
          }

          // 2. Fallback to BigDataCloud client reverse geocoding if street wasn't found
          if (!foundStreet) {
            try {
              const res2 = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
              );
              if (res2.ok) {
                const data2 = await res2.json();
                if (data2) {
                  foundStreet = data2.locality || data2.principalSubdivision || '';
                  foundBarrio = data2.city || data2.locality || '';
                }
              }
            } catch (e2) {}
          }

          // Autofill inputs
          if (foundStreet) {
            setAddress(foundStreet);
          }
          if (foundBarrio) {
            setNeighborhood(foundBarrio);
          }

          if (foundStreet) {
            setLocationStatus(`✓ Dirección y barrio autocompletados: ${foundStreet}${foundBarrio ? `, ${foundBarrio}` : ''} (±${Math.round(pos.coords.accuracy)}m)`);
          } else {
            setLocationStatus(`✓ Ubicación GPS fijada (±${Math.round(pos.coords.accuracy)}m).`);
          }
        } catch (err) {
          setLocationStatus(`✓ Ubicación GPS fijada (±${Math.round(pos.coords.accuracy)}m).`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('Permiso de ubicación denegado. Podés escribir tu dirección manualmente.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const prod = POLAR_PRODUCTS.find(p => p.id === id);
      return sum + (prod ? prod.price * qty : 0);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !address) {
      alert('Por favor completá tu nombre, teléfono y dirección.');
      return;
    }

    const orderId = `POLAR-${Math.floor(10000 + Math.random() * 90000)}`;
    const itemsList = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = POLAR_PRODUCTS.find(p => p.id === id);
        return { ...prod, qty };
      });

    const newOrder = {
      orderId,
      clientName,
      clientPhone,
      address,
      neighborhood,
      notes,
      coords,
      items: itemsList,
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
      status: 'Pendiente de aprobación'
    };

    saveOrder(newOrder);
    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (err) {}

    // Prepare WhatsApp Message and link with full encoded order payload
    const itemsText = itemsList.map(i => `• ${i.qty}x ${i.name} ($${(i.price * i.qty).toLocaleString()})`).join('\n');
    const encodedData = encodeOrderParam(newOrder);
    const systemLink = `${window.location.origin}/?manageOrder=${orderId}&d=${encodedData}`;

    const waText = encodeURIComponent(
      `¡Hola Soda y Agua POLAR! 🐻 Acabo de realizar un pedido:\n\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📱 *WhatsApp:* ${clientPhone}\n` +
      `📍 *Dirección:* ${address} (${neighborhood})\n` +
      `${coords ? `🗺️ *GPS:* https://www.google.com/maps?q=${coords.lat},${coords.lng}\n` : ''}` +
      `${notes ? `📝 *Notas:* ${notes}\n` : ''}` +
      `\n📦 *Productos:*\n${itemsText}\n\n` +
      `💰 *Total a pagar:* $${calculateTotal().toLocaleString()}\n\n` +
      `🔗 *Gestionar pedido en el sistema:* ${systemLink}`
    );

    setOrderSubmitted({
      ...newOrder,
      waLink: `https://wa.me/5493512345678?text=${waText}`,
      systemLink
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      
      {/* Top Banner */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img src="/images/logo-polar.png" alt="Polar" className="w-8 h-8 rounded-full border border-sky-300" />
            <div>
              <span className="font-black text-sm text-[#0c315b] tracking-tight block">Soda y Agua POLAR</span>
              <span className="text-[10px] text-gray-500 font-medium">Portal Oficial de Pedidos a Domicilio</span>
            </div>
          </div>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="text-xs text-[#0c315b] hover:underline font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Sistema</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1">
        
        {orderSubmitted ? (
          /* Confirmation Screen */
          <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-md text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h2 className="text-xl font-black text-gray-900">
              ¡Pedido #{orderSubmitted.orderId} Listo para Enviar!
            </h2>
            <p className="text-xs text-gray-600 max-w-md mx-auto">
              Presioná el botón de abajo para enviar el pedido directamente al <strong>WhatsApp de Soda y Agua Polar</strong> con tu dirección y productos.
            </p>

            {/* Order Summary Box */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Cliente:</span>
                <strong className="text-gray-900">{orderSubmitted.clientName}</strong>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Entrega en:</span>
                <strong className="text-gray-900">{orderSubmitted.address} ({orderSubmitted.neighborhood})</strong>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Total:</span>
                <strong className="text-base text-[#0c315b] font-black">${orderSubmitted.total.toLocaleString()}</strong>
              </div>

              <div className="pt-1">
                <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">
                  Enlace seguro del sistema generado para Polar:
                </span>
                <input 
                  type="text" 
                  readOnly 
                  value={orderSubmitted.systemLink} 
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[11px] font-mono text-gray-600"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  🔒 Si el repartidor o dueño abre este enlace, el sistema le pedirá sus credenciales de acceso para ver y cargar el pedido.
                </span>
              </div>
            </div>

            <a
              href={orderSubmitted.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>ENVIAR PEDIDO POR WHATSAPP</span>
            </a>

            <button
              onClick={() => setOrderSubmitted(null)}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium"
            >
              Hacer otro pedido
            </button>
          </div>
        ) : (
          /* Order Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-7 border border-gray-200 shadow-sm space-y-5">
            
            <div>
              <h2 className="text-lg font-black text-[#0c315b]">Pedí tu Agua y Soda Polar</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Completá tus datos de entrega y te visitamos con bidones frescos.
              </p>
            </div>

            {/* 1. Client Info */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                1. Datos de Contacto y Entrega
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Tu Nombre o Familia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Familia Gómez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="3512345678"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-600">Dirección Exacta</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-sky-700 hover:text-[#0c315b] flex items-center gap-1 transition"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isLocating ? 'Obteniendo GPS...' : 'Usar mi ubicación actual'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Calle, número, piso y departamento"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
                />
                {locationStatus && (
                  <span className="text-[10px] text-emerald-600 font-medium block mt-1">
                    ✓ {locationStatus}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Barrio</label>
                  <input
                    type="text"
                    placeholder="Ej: Alberdi, Centro, Nueva Cba"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Indicaciones para el repartidor</label>
                  <input
                    type="text"
                    placeholder="Ej: Timbre portón blanco"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Products Selector */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                2. Seleccioná tus Productos
              </span>

              <div className="space-y-2">
                {POLAR_PRODUCTS.map((prod) => (
                  <div 
                    key={prod.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white rounded-lg p-1 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <img src={prod.image} alt={prod.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs">{prod.name}</h4>
                        <span className="text-[11px] font-black text-[#0c315b]">
                          ${prod.price.toLocaleString()}
                        </span>
                        {prod.subscriptionPlan && (
                          <span className="block text-[10px] text-sky-800 font-semibold">{prod.subscriptionPlan}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setCart({ ...cart, [prod.id]: Math.max(0, (cart[prod.id] || 0) - 1) })}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-100"
                      >-</button>
                      <span className="font-black text-sm w-5 text-center text-gray-900">
                        {cart[prod.id] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCart({ ...cart, [prod.id]: (cart[prod.id] || 0) + 1 })}
                        className="w-7 h-7 rounded-lg bg-[#0c315b] text-white font-bold hover:bg-[#082342]"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700 text-sm">Total del Pedido:</span>
                <span className="text-xl font-black text-[#0c315b]">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                disabled={calculateTotal() === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c315b] to-[#0284c7] hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md transition"
              >
                <Send className="w-4 h-4" />
                <span>CONFIRMAR Y ENVIAR AL WHATSAPP DE POLAR</span>
              </button>
            </div>

          </form>
        )}

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        Soda y Agua POLAR · Sistema de Repartos a Domicilio
      </footer>

    </div>
  );
}
