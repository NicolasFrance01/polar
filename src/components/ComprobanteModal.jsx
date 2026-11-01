import React from 'react';
import { X, Printer, MessageCircle, Check } from 'lucide-react';

export default function ComprobanteModal({ stop, onClose }) {
  if (!stop) return null;

  const clientName = stop.clientName || 'Roberto Fernández';
  const address = stop.address || 'Aguirre 750, Villa Crespo';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      {/* Printable Sheet Card */}
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-200 text-gray-900 font-sans">
        
        {/* Top Header with [X] button */}
        <div className="flex items-start justify-between mb-2">
          <button
            onClick={onClose}
            className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-right">
            <h2 className="text-base font-black tracking-wide uppercase text-gray-900">
              COMPROBANTE
            </h2>
            <span className="text-[11px] text-gray-500 font-semibold block">
              FECHA: {new Date().toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        <div className="w-full h-px bg-gray-200 my-3"></div>

        {/* Client details box matching comprobantes.png */}
        <div className="border border-gray-200 rounded-lg p-3 text-xs space-y-1 mb-4 bg-gray-50/50">
          <div>
            <span className="font-bold text-gray-900">Señor/es: </span>
            <span className="text-gray-700">{clientName}</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">Domicilio: </span>
            <span className="text-gray-700">{address}</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">Período: </span>
            <span className="text-gray-700">01/10 - 31/10</span>
          </div>
        </div>

        {/* Itemized Table matching comprobantes.png */}
        <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800 text-white text-[11px]">
                <th className="py-1.5 px-2.5 text-left font-bold">Detalle</th>
                <th className="py-1.5 px-2 text-center font-bold">Cant.</th>
                <th className="py-1.5 px-2 text-right font-bold">Imp.</th>
                <th className="py-1.5 px-2 text-right font-bold">Pag.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 px-2.5 font-medium text-gray-800">Bidón 20L Polar</td>
                <td className="py-2 px-2 text-center text-gray-600">4</td>
                <td className="py-2 px-2 text-right font-semibold text-gray-900">$18.000</td>
                <td className="py-2 px-2 text-right"></td>
              </tr>
              <tr className="bg-emerald-50/40">
                <td className="py-2 px-2.5 font-medium text-emerald-800">Pago Efvo.</td>
                <td className="py-2 px-2 text-center"></td>
                <td className="py-2 px-2 text-right"></td>
                <td className="py-2 px-2 text-right font-bold text-emerald-700">$18.000</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium text-gray-800">Bidón 20L Polar</td>
                <td className="py-2 px-2 text-center text-gray-600">3</td>
                <td className="py-2 px-2 text-right font-semibold text-gray-900">$13.500</td>
                <td className="py-2 px-2 text-right"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="space-y-1 text-right text-xs text-gray-600 mb-4 pr-1">
          <div>
            <span>Total consumido: </span>
            <strong className="text-gray-900">$31.500</strong>
          </div>
          <div>
            <span>Total pagado: </span>
            <strong className="text-emerald-700">$18.000</strong>
          </div>
        </div>

        {/* Saldo a Pagar Highlight Box matching comprobantes.png */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center mb-4">
          <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider block">
            SALDO A PAGAR
          </span>
          <span className="text-xl font-black text-rose-600 block mt-0.5">
            $13.500
          </span>
        </div>

        {/* Print / WhatsApp buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => window.print()}
            className="py-2 rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={() => {
              const msg = encodeURIComponent(
                `Hola ${clientName}! Adjuntamos tu comprobante de Soda y Agua Polar. Saldo pendiente: $13.500. Podés abonar por transferencia al alias POLAR.AGUA.`
              );
              window.open(`https://wa.me/?text=${msg}`, '_blank');
            }}
            className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-1.5 shadow-2xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Enviar x WA</span>
          </button>
        </div>

      </div>
    </div>
  );
}
