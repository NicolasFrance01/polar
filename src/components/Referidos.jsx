import React, { useState } from 'react';
import { 
  Gift, 
  Copy, 
  Check, 
  MessageCircle, 
  Share2, 
  Award, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Plus, 
  ExternalLink,
  CheckCircle2,
  Tag,
  Trash2,
  RotateCw
} from 'lucide-react';

const REFERRALS_STORAGE_KEY = 'polar_simulated_referrals_v2';

const DEFAULT_REFERRALS = [
  {
    id: 'ref-1',
    referredName: 'Familia Rossi',
    date: '10/11/2026',
    status: 'Completado',
    reward: '$2.000 saldo a favor',
    source: 'Cliente'
  },
  {
    id: 'ref-2',
    referredName: 'Panadería La Espiga',
    date: '12/11/2026',
    status: 'Primer pedido entregado',
    reward: '1 Bidón 20L bonificado',
    source: 'Cliente'
  }
];

function getStoredReferrals() {
  try {
    const raw = localStorage.getItem(REFERRALS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading stored referrals:', e);
  }
  return DEFAULT_REFERRALS;
}

function saveStoredReferrals(list) {
  try {
    localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving stored referrals:', e);
  }
}

export default function Referidos() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralCode, setReferralCode] = useState('POLAR-CORDOBA');
  const [activeTab, setActiveTab] = useState('clientes'); // 'clientes' | 'soderias'

  // Test / Simulated Referrals state persisted in localStorage
  const [simulatedReferrals, setSimulatedReferrals] = useState(() => getStoredReferrals());

  const [toastMessage, setToastMessage] = useState(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://polar.vercel.app';
  const clientReferralUrl = `${baseUrl}/cliente?ref=${referralCode}`;
  const businessReferralUrl = `${baseUrl}/ref/${referralCode}`;

  const currentUrl = activeTab === 'clientes' ? clientReferralUrl : businessReferralUrl;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleShareWhatsApp = () => {
    const text = activeTab === 'clientes'
      ? encodeURIComponent(
          `¡Hola! 🌊 Te recomiendo *Soda y Agua POLAR*. Podés pedir bidones de 20L purificados y sifones de soda a domicilio con entrega rápida en Córdoba.\n\n` +
          `🎁 Hacé tu primer pedido desde mi enlace de recomendación y recibí una bonificación en tu carga:\n` +
          `👉 ${clientReferralUrl}`
        )
      : encodeURIComponent(
          `¡Hola colega! 🚚 Te comparto el software de gestión y ruteo en vivo *POLAR Reparto Cloud* que usamos para optimizar camiones y control de envases.\n\n` +
          `Registrate desde acá con nuestro código de recomendación para obtener descuento en el plan:\n` +
          `👉 ${businessReferralUrl}`
        );

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSimulateReferral = () => {
    const names = [
      'Estudio Jurídico Córdoba',
      'Gonzalo Benítez',
      'Gimnasio Olimpo',
      'Dra. Marcela Castro',
      'Taller Mecánico San Martín'
    ];
    const pickedName = names[Math.floor(Math.random() * names.length)];
    const newEntry = {
      id: `ref-${Date.now()}`,
      referredName: pickedName,
      date: new Date().toLocaleDateString('es-AR'),
      status: 'Primer pedido realizado',
      reward: '1 Bidón 20L bonificado ($4.200)',
      source: activeTab === 'clientes' ? 'Cliente' : 'Sodería'
    };

    const updated = [newEntry, ...simulatedReferrals];
    setSimulatedReferrals(updated);
    saveStoredReferrals(updated);
    setToastMessage(`🎉 ¡Nuevo referido simulado exitosamente! Se registró "${pickedName}" con tu código.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteReferral = (id, name) => {
    const updated = simulatedReferrals.filter(r => r.id !== id);
    setSimulatedReferrals(updated);
    saveStoredReferrals(updated);
    setToastMessage(`🗑️ Se eliminó "${name || 'referido'}" del historial.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearAllReferrals = () => {
    if (simulatedReferrals.length === 0) return;
    const confirmed = window.confirm('¿Estás seguro de que deseás vaciar todo el historial y simulador de prueba?');
    if (!confirmed) return;
    setSimulatedReferrals([]);
    saveStoredReferrals([]);
    setToastMessage('Historial de referidos vaciado.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRestoreDefaultReferrals = () => {
    setSimulatedReferrals(DEFAULT_REFERRALS);
    saveStoredReferrals(DEFAULT_REFERRALS);
    setToastMessage('Se restauraron los ejemplos de prueba del programa de referidos.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c315b] to-[#1e5aa0] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Programa de Crecimiento y Beneficios
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Programa de Referidos Polar
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
            Recompensamos a tus clientes por recomendarte y a tu empresa por invitar a nuevos repartidores o soderías al sistema.
          </p>
        </div>

        <div className="absolute right-4 -bottom-6 opacity-15 pointer-events-none">
          <Gift className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Tabs: Clientes vs Soderías */}
      <div className="flex border-b border-gray-200 text-xs font-bold text-gray-500">
        <button
          onClick={() => setActiveTab('clientes')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'clientes'
              ? 'border-[#0c315b] text-[#0c315b] font-extrabold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Referir Clientes (Vecinos y Empresas)</span>
        </button>
        <button
          onClick={() => setActiveTab('soderias')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'soderias'
              ? 'border-[#0c315b] text-[#0c315b] font-extrabold'
              : 'border-transparent hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Referir Soderías Colegas (Software Cloud)</span>
        </button>
      </div>

      {/* Program Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0c315b] flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Compartí tu Link</h3>
          <p className="text-gray-500 leading-relaxed">
            {activeTab === 'clientes'
              ? 'Enviá tu enlace a clientes actuales o publicalo en tus redes para que lo reenvíen a amigos y vecinos.'
              : 'Invitá a distribuidores y repartos de agua con tu link de recomendación exclusivo.'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="font-bold text-gray-900 text-sm">El invitado compra o se une</h3>
          <p className="text-gray-500 leading-relaxed">
            {activeTab === 'clientes'
              ? 'El nuevo cliente entra a /cliente con tu código, recibe un descuento o recarga de bienvenida en su primer pedido.'
              : 'La sodería crea su cuenta en Polar Cloud y activa su período con descuento especial.'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Acreditación Automática</h3>
          <p className="text-gray-500 leading-relaxed">
            {activeTab === 'clientes'
              ? 'El cliente que recomendó recibe automáticamente saldo a favor o un bidón bonificado en su próxima entrega.'
              : 'Obtenés un 20% de descuento en el abono mensual de tu sistema Polar.'}
          </p>
        </div>
      </div>

      {/* Share Box & Link Generator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tu Enlace de Recomendación</h2>
            <p className="text-xs text-gray-500">
              Copiá y compartí este enlace con tus contactos o pegalo en WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] text-gray-500 font-semibold">Código:</span>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              className="px-2.5 py-1 border rounded-lg text-xs font-mono font-bold text-[#0c315b] bg-sky-50/50 w-36 uppercase outline-none focus:border-[#0c315b]"
            />
          </div>
        </div>

        {/* URL Pill */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-700 truncate select-all">
            {currentUrl}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              title="Copiar link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator and Live Metrics */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Historial y Simulador de Prueba</h3>
            <p className="text-xs text-gray-500">
              Probá cómo se registran los referidos y cómo se calculan las bonificaciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {simulatedReferrals.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllReferrals}
                className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-600 font-bold text-xs flex items-center space-x-1 transition shadow-2xs"
                title="Vaciar todo el historial"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Historial</span>
              </button>
            )}

            {simulatedReferrals.length === 0 && (
              <button
                type="button"
                onClick={handleRestoreDefaultReferrals}
                className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center space-x-1 transition shadow-2xs"
                title="Restablecer ejemplos demo"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Restablecer Demo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSimulateReferral}
              className="px-3.5 py-2 rounded-xl bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simular nuevo referido</span>
            </button>
          </div>
        </div>

        {/* Stats counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-sky-800 block">Total Referidos</span>
            <span className="text-xl font-black text-[#0c315b]">{simulatedReferrals.length}</span>
          </div>
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Pedidos Completados</span>
            <span className="text-xl font-black text-emerald-700">
              {simulatedReferrals.filter(r => (r.status || '').toLowerCase().includes('completado') || (r.status || '').toLowerCase().includes('entregado')).length}
            </span>
          </div>
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Bonificaciones Activas</span>
            <span className="text-xl font-black text-amber-700">{simulatedReferrals.length}</span>
          </div>
          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-purple-800 block">Saldo Acreditado</span>
            <span className="text-xl font-black text-purple-700">${(simulatedReferrals.length * 2000).toLocaleString()}</span>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
          <div className="bg-gray-50 px-3.5 py-2 font-bold text-gray-500 uppercase text-[10px] grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">Referido</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-3">Estado</div>
            <div className="col-span-2 text-right">Bonificación</div>
            <div className="col-span-1 text-right">Acción</div>
          </div>

          {simulatedReferrals.map((ref) => (
            <div key={ref.id} className="px-3.5 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-gray-50/60 transition">
              <div className="col-span-4 font-bold text-gray-900 truncate">
                {ref.referredName}
              </div>
              <div className="col-span-2 text-gray-500 font-mono text-[11px]">
                {ref.date}
              </div>
              <div className="col-span-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                  {ref.status}
                </span>
              </div>
              <div className="col-span-2 text-right font-extrabold text-[#0c315b]">
                {ref.reward}
              </div>
              <div className="col-span-1 text-right flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteReferral(ref.id, ref.referredName)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Eliminar este referido"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {simulatedReferrals.length === 0 && (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <Gift className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-700">El historial de referidos está vacío.</p>
              <p className="text-[11px] text-gray-400">Podés simular nuevas recomendaciones con el botón superior o restablecer los ejemplos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

