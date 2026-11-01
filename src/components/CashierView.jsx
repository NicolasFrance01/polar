import React, { useState } from 'react';
import { 
  Wallet, 
  DollarSign, 
  CheckCircle, 
  FileText, 
  Printer, 
  ArrowDownRight, 
  Truck, 
  RotateCcw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function CashierView({ route }) {
  const [closedShift, setClosedShift] = useState(false);

  // Computations
  const completedStops = route.filter(s => s.status === 'entregado');
  
  const cashCollected = completedStops
    .filter(s => s.paymentMethod === 'Efectivo')
    .reduce((sum, s) => sum + (s.collectedAmount || 0), 0);

  const transferCollected = completedStops
    .filter(s => s.paymentMethod === 'Transferencia')
    .reduce((sum, s) => sum + (s.collectedAmount || 0), 0);

  const creditGranted = completedStops
    .filter(s => s.paymentMethod === 'Cuenta Corriente')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const initialFloat = 15000; // fondo de caja
  const physicalCashExpected = initialFloat + cashCollected;

  const totalReturnedContainers = completedStops.reduce(
    (acc, s) => ({
      bidon_20l: acc.bidon_20l + (s.returnedContainers?.bidon_20l || 0),
      bidon_12l: acc.bidon_12l + (s.returnedContainers?.bidon_12l || 0),
      sifon_15l: acc.sifon_15l + (s.returnedContainers?.sifon_15l || 0),
    }),
    { bidon_20l: 0, bidon_12l: 0, sifon_15l: 0 }
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Caja y Liquidación de Reparto</h2>
          <p className="text-xs text-slate-500">
            Arqueo de cobranza, transferencias y balance de envases vacíos devueltos al camión.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cierre</span>
          </button>
        </div>
      </div>

      {/* Cards summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Efectivo en Mano */}
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Efectivo Físico en Mano
          </span>
          <div className="text-2xl font-black text-emerald-950">
            ${physicalCashExpected.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-800 mt-1">
            Fondo $15.000 + Cobrado ${cashCollected.toLocaleString()}
          </p>
        </div>

        {/* Transferencias */}
        <div className="bg-sky-50 rounded-2xl p-5 border border-sky-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block mb-1">
            Transferencias Recibidas
          </span>
          <div className="text-2xl font-black text-sky-950">
            ${transferCollected.toLocaleString()}
          </div>
          <p className="text-xs text-sky-800 mt-1">
            Acreditado a cuenta bancaria POLAR.AGUA
          </p>
        </div>

        {/* Fiado / Cta Cte */}
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
            Cargado en Cta. Corriente
          </span>
          <div className="text-2xl font-black text-amber-950">
            ${creditGranted.toLocaleString()}
          </div>
          <p className="text-xs text-amber-800 mt-1">
            Deuda pendiente de cobro en clientes
          </p>
        </div>
      </div>

      {/* Envases devueltos en el turno */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-sky-600" />
          <span>Envases Vacíos Retornados al Depósito en esta Vuelta</span>
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block">Bidones 20L</span>
            <strong className="text-xl font-black text-slate-900">{totalReturnedContainers.bidon_20l} un.</strong>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Listos para lavado</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block">Bidones 12L</span>
            <strong className="text-xl font-black text-slate-900">{totalReturnedContainers.bidon_12l} un.</strong>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Listos para lavado</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block">Sifones Soda 1.5L</span>
            <strong className="text-xl font-black text-slate-900">{totalReturnedContainers.sifon_15l} un.</strong>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Listos para llenado</span>
          </div>
        </div>
      </div>

      {/* Cierre de Turno */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base text-white">Cierre de Caja del Chofer</h4>
          <p className="text-xs text-sky-200">
            Rendición del Camión #2 (Matías Luján). Valida el efectivo antes de guardar el turno.
          </p>
        </div>

        {closedShift ? (
          <div className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Turno Liquidado y Cerrado</span>
          </div>
        ) : (
          <button
            onClick={() => setClosedShift(true)}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md"
          >
            Validar y Cerrar Turno
          </button>
        )}
      </div>
    </div>
  );
}
