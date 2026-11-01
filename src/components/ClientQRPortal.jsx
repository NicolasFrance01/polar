import React, { useState } from 'react';
import { 
  Droplets, 
  CheckCircle, 
  Sparkles, 
  Send, 
  MapPin, 
  Clock, 
  Plus, 
  Minus,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { POLAR_PRODUCTS } from '../data/mockData';

export default function ClientQRPortal({ onOrderSubmitted }) {
  const [selectedClient] = useState({
    name: 'Familia Rodríguez (María Laura)',
    address: 'Av. Colón 2340, Depto 4B, Alberdi',
    nextDeliveryDay: 'Lunes por la mañana',
    containersAtHome: '3 Bidones 20L y 2 Sifones',
    balance: 0
  });

  const [quantities, setQuantities] = useState({
    'prod-20l': 2,
    'prod-12l': 0,
    'prod-soda': 2,
    'prod-dispenser': 0
  });

  const [submitted, setSubmitted] = useState(false);

  const calculateTotal = () => {
    return Object.entries(quantities).reduce((sum, [pId, qty]) => {
      const prod = POLAR_PRODUCTS.find(p => p.id === pId);
      return sum + (prod ? prod.price * qty : 0);
    }, 0);
  };

  const handleSendOrder = () => {
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (e) {}

    setSubmitted(true);
    if (onOrderSubmitted) {
      onOrderSubmitted(quantities);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Brand Header */}
      <div className="bg-[#0a2544] text-white p-6 rounded-3xl shadow-xl text-center relative overflow-hidden border border-sky-800">
        <div className="w-20 h-20 mx-auto rounded-full p-1 bg-white border-2 border-sky-400 shadow-lg mb-3">
          <img src="/images/logo-polar.png" alt="Polar" className="w-full h-full object-contain rounded-full" />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300 bg-sky-900/80 px-2.5 py-0.5 rounded-full border border-sky-500/30">
          Portal de Pedido Rápido
        </span>

        <h2 className="text-xl font-black mt-2">Soda y Agua POLAR</h2>
        <p className="text-xs text-sky-200 mt-0.5">
          Pureza, frescura y calidad directo a tu puerta
        </p>
      </div>

      {submitted ? (
        <div className="bg-white rounded-3xl p-6 text-center border border-emerald-200 shadow-xl space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">¡Pedido Recibido con Éxito!</h3>
          <p className="text-xs text-slate-600">
            Tu pedido ya fue cargado a la hoja de ruta del camión de Soda y Agua Polar. Te visitamos en el próximo reparto habitual.
          </p>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
            Entrega programada: <strong>{selectedClient.nextDeliveryDay}</strong> en {selectedClient.address}.
          </div>

          <button
            onClick={() => setSubmitted(false)}
            className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition"
          >
            Modificar o hacer otro pedido
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg space-y-4">
          {/* Client identification */}
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente Polar</span>
            <h3 className="font-extrabold text-slate-900 text-base">{selectedClient.name}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {selectedClient.address}
            </p>
          </div>

          {/* Quick Frequent Reorder Button */}
          <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200">
            <div className="flex items-center space-x-2 text-sky-900 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Tu pedido habitual de siempre:</span>
            </div>
            <p className="text-xs text-slate-700 font-semibold mb-3">
              2 Bidones de 20L + 2 Sifones de Soda 1.5L
            </p>
            <button
              onClick={() => {
                setQuantities({ 'prod-20l': 2, 'prod-12l': 0, 'prod-soda': 2, 'prod-dispenser': 0 });
                handleSendOrder();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-900 to-sky-700 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-md hover:from-sky-800 hover:to-sky-600 transition"
            >
              <span>PEDIR MI RECARGA HABITUAL ($11.000)</span>
            </button>
          </div>

          {/* Custom item picker */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              O seleccioná la cantidad deseada:
            </span>

            <div className="space-y-2">
              {POLAR_PRODUCTS.filter(p => p.id !== 'prod-dispenser').map((prod) => (
                <div 
                  key={prod.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <img src={prod.image} alt={prod.name} className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{prod.name}</h4>
                      <span className="text-[11px] font-semibold text-sky-700">${prod.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantities({ ...quantities, [prod.id]: Math.max(0, (quantities[prod.id] || 0) - 1) })}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-slate-900 text-xs w-4 text-center">
                      {quantities[prod.id] || 0}
                    </span>
                    <button
                      onClick={() => setQuantities({ ...quantities, [prod.id]: (quantities[prod.id] || 0) + 1 })}
                      className="w-7 h-7 rounded-lg bg-sky-800 text-white hover:bg-sky-700 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total & Submit */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-sm font-bold text-slate-900 mb-3">
              <span>Total a pagar en entrega:</span>
              <span className="text-lg font-black text-sky-900">${calculateTotal().toLocaleString()}</span>
            </div>

            <button
              onClick={handleSendOrder}
              disabled={calculateTotal() === 0}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg transition"
            >
              <Send className="w-4 h-4" />
              <span>CONFIRMAR PEDIDO AL REPARTO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
