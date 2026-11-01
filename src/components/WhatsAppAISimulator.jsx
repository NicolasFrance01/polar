import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  MessageSquare, 
  Cpu, 
  Clock, 
  User, 
  Truck,
  RotateCcw
} from 'lucide-react';
import { POLAR_PRODUCTS } from '../data/mockData';

export default function WhatsAppAISimulator({ onAddOrderToRoute }) {
  const [inputMessage, setInputMessage] = useState('Hola Polar! Me mandas 2 de 20 y un sifón a lo de Rodríguez por favor?');
  const [phoneNumber, setPhoneNumber] = useState('5493512345678');
  const [parsedResult, setParsedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderAdded, setOrderAdded] = useState(false);

  // Preset example messages to demonstrate AI parsing
  const presetMessages = [
    {
      phone: '5493512345678',
      text: 'Hola Polar! Me mandas 2 de 20 y un sifón a lo de Rodríguez por favor?',
      clientGuess: 'Familia Rodríguez'
    },
    {
      phone: '5493514567890',
      text: 'Buenas! Don Raúl del taller mecánico. Pasate con 3 bidones de los grandes cuando puedas.',
      clientGuess: 'Taller Mecánico Don Raúl'
    },
    {
      phone: '5493518901234',
      text: 'Hola chicos, de la panadería. Dejanos un cajón de soda y un bidón de 12 con canilla.',
      clientGuess: 'Panadería La Espiga Dorada'
    },
    {
      phone: '5493513344556',
      text: 'Buenas tardes! Del gimnasio Vital, necesitamos recarga de 5 bidones de 20 para mañana.',
      clientGuess: 'Gimnasio Fitness Vital'
    }
  ];

  const handleSimulateAI = (textToParse = inputMessage) => {
    setIsProcessing(true);
    setOrderAdded(false);

    setTimeout(() => {
      const lower = textToParse.toLowerCase();
      let detectedProducts = [];
      let detectedClient = 'Cliente Reconocido por Número';

      // Parse quantities & products
      if (lower.includes('2 de 20') || (lower.includes('2') && lower.includes('20'))) {
        detectedProducts.push({ productId: 'prod-20l', name: 'Bidón 20L', qty: 2, price: 4200 });
      } else if (lower.includes('3 bidon') || lower.includes('3 de los grandes') || lower.includes('3')) {
        detectedProducts.push({ productId: 'prod-20l', name: 'Bidón 20L', qty: 3, price: 4200 });
      } else if (lower.includes('5 bidon') || lower.includes('5')) {
        detectedProducts.push({ productId: 'prod-20l', name: 'Bidón 20L', qty: 5, price: 4200 });
      } else {
        detectedProducts.push({ productId: 'prod-20l', name: 'Bidón 20L', qty: 1, price: 4200 });
      }

      if (lower.includes('sifon') || lower.includes('soda') || lower.includes('cajon')) {
        const qty = lower.includes('cajon') ? 6 : 1;
        detectedProducts.push({ productId: 'prod-soda', name: 'Sifón Soda 1.5L', qty: qty, price: 1300 });
      }

      if (lower.includes('12') || lower.includes('canilla')) {
        detectedProducts.push({ productId: 'prod-12l', name: 'Bidón 12L c/ canilla', qty: 1, price: 3300 });
      }

      if (lower.includes('rodríguez') || phoneNumber === '5493512345678') {
        detectedClient = 'Familia Rodríguez (María Laura)';
      } else if (lower.includes('raúl') || lower.includes('taller') || phoneNumber === '5493514567890') {
        detectedClient = 'Taller Mecánico Don Raúl';
      } else if (lower.includes('panadería') || phoneNumber === '5493518901234') {
        detectedClient = 'Panadería La Espiga Dorada';
      } else if (lower.includes('gimnasio') || phoneNumber === '5493513344556') {
        detectedClient = 'Gimnasio Fitness Vital';
      }

      const total = detectedProducts.reduce((sum, p) => sum + (p.price * p.qty), 0);

      setParsedResult({
        client: detectedClient,
        phone: phoneNumber,
        confidence: '99.4%',
        intent: 'SOLICITUD_RECARGA_PEDIDO',
        items: detectedProducts,
        totalAmount: total,
        paymentGuess: 'Efectivo / Al entregar'
      });

      setIsProcessing(false);
    }, 450);
  };

  const handlePushToRoute = () => {
    if (!parsedResult) return;

    const newStop = {
      stopNumber: Date.now().toString().slice(-2),
      orderId: `ORD-${Date.now().toString().slice(-3)}`,
      clientId: 'cli-auto',
      clientName: parsedResult.client,
      address: 'Dirección habitual registrada',
      phone: parsedResult.phone,
      neighborhood: 'Zona Asignada',
      items: parsedResult.items,
      expectedContainersToReturn: {
        bidon_20l: parsedResult.items.find(i => i.productId === 'prod-20l')?.qty || 0
      },
      totalAmount: parsedResult.totalAmount,
      paymentMethod: 'Efectivo',
      status: 'pendiente',
      deliveredAt: null,
      collectedAmount: 0,
      returnedContainers: { bidon_20l: 0 }
    };

    onAddOrderToRoute(newStop);
    setOrderAdded(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-sky-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">Motor de IA para Pedidos de WhatsApp</h2>
            <p className="text-xs text-emerald-200">
              Ingeniería Inversa del modelo de pedidos inteligentes de Reparto Cloud
            </p>
          </div>
        </div>
        <p className="text-xs text-sky-100 max-w-2xl mt-1 leading-relaxed">
          Tus clientes te escriben como siempre por WhatsApp con audios o textos informales. El sistema reconoce el número del cliente, extrae los bidones y sifones solicitados y los programa directamente en la hoja de ruta del camión sin que vos tipees nada.
        </p>
      </div>

      {/* Interactive Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Input Message & Presets */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>1. Mensaje de WhatsApp Entrante</span>
            </h3>

            {/* Presets */}
            <div className="space-y-1.5 mb-4">
              <span className="text-[11px] font-semibold text-slate-400 block">Probar mensajes reales de ejemplo:</span>
              {presetMessages.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputMessage(p.text);
                    setPhoneNumber(p.phone);
                    handleSimulateAI(p.text);
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs text-slate-700 hover:text-sky-900 border border-slate-200/80 transition flex items-center justify-between"
                >
                  <span className="truncate max-w-[280px]">"{p.text}"</span>
                  <span className="text-[10px] font-bold text-sky-600 flex-shrink-0 ml-2">Probar →</span>
                </button>
              ))}
            </div>

            {/* Custom text area */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                O escribí cualquier mensaje como cliente:
              </label>
              <textarea
                rows={3}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribí aquí..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              onClick={() => handleSimulateAI(inputMessage)}
              disabled={isProcessing}
              className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isProcessing ? 'Analizando con IA...' : 'Interpretar Mensaje con IA'}</span>
            </button>
          </div>
        </div>

        {/* Output AI Extracted Order */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-600" />
                <span>2. Interpretación Automática del Sistema</span>
              </h3>

              {parsedResult ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Cliente Identificado</span>
                      <strong className="text-slate-900 text-sm font-black">{parsedResult.client}</strong>
                      <span className="text-[11px] text-slate-500 block">WhatsApp: +{parsedResult.phone}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      Certeza {parsedResult.confidence}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                      Productos Reconocidos:
                    </span>
                    <div className="space-y-1.5">
                      {parsedResult.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs font-bold text-slate-800">
                          <span>{item.qty}x {item.name}</span>
                          <span>${(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs font-black text-slate-900">
                      <span>Total Estimado:</span>
                      <span className="text-sky-700 text-sm">${parsedResult.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl my-auto">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">
                    Hacé clic en "Interpretar Mensaje" para ver cómo el sistema extrae automáticamente al cliente y sus productos.
                  </p>
                </div>
              )}
            </div>

            {parsedResult && (
              <div className="pt-4 border-t border-slate-100">
                {orderAdded ? (
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs text-center flex items-center justify-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Pedido agregado exitosamente a la Hoja de Ruta del Chofer!</span>
                  </div>
                ) : (
                  <button
                    onClick={handlePushToRoute}
                    className="w-full py-3 rounded-xl bg-sky-900 hover:bg-sky-800 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition"
                  >
                    <Truck className="w-4 h-4 text-sky-300" />
                    <span>Cargar Directo al Camión de Hoy</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
