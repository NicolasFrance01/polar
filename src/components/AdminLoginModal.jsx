import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Phone, 
  Package, 
  CheckCircle, 
  Truck, 
  X,
  ExternalLink
} from 'lucide-react';
import { decodeOrderParam, getStoredOrders } from '../services/tripSync';

export default function AdminLoginModal({ 
  orderId, 
  orders, 
  onApproveOrder, 
  onClose 
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('admin@polar.com');
  const [password, setPassword] = useState('polar2026');
  const [error, setError] = useState('');

  // 1. Check orders passed via props
  let matchedOrder = (orders || []).find(o => o.orderId === orderId);

  // 2. If not found, check URL encoded parameter `d`
  if (!matchedOrder && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('d');
    if (dataParam) {
      matchedOrder = decodeOrderParam(dataParam);
    }
  }

  // 3. If still not found, check localStorage
  if (!matchedOrder) {
    const stored = getStoredOrders();
    matchedOrder = stored.find(o => o.orderId === orderId);
  }

  // 4. Default target order
  const targetOrder = matchedOrder || {
    orderId: orderId || 'POLAR-90184',
    clientName: 'Cliente POLAR (WhatsApp)',
    clientPhone: '5493512345678',
    address: 'Dirección sin especificar',
    neighborhood: 'Córdoba Capital',
    notes: '',
    coords: { lat: -31.4089, lng: -64.1956 },
    items: [
      { name: 'Bidón de Agua de Mesa 20L', qty: 2, price: 4200 },
      { name: 'Sifón de Soda 1,5 Litros', qty: 2, price: 1300 }
    ],
    total: 11000,
    status: 'Pendiente de aprobación'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password.length >= 4) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Contraseña inválida. Usá polar2026 para ingresar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-sky-50 text-[#0c315b] rounded-full flex items-center justify-center mx-auto mb-2 border border-sky-200">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-gray-900">
                Acceso al Sistema POLAR
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Ingresaste a través del enlace de gestión del pedido <strong>#{targetOrder.orderId}</strong>. Ingresá tus credenciales de administrador o chofer para continuar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 text-xs pt-1">
              <div>
                <label className="text-gray-700 font-semibold block mb-1">Email / Usuario</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b] font-medium"
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b] font-medium"
                />
              </div>

              {error && (
                <p className="text-[11px] text-rose-600 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold transition shadow-xs"
              >
                Ingresar y Ver Pedido
              </button>

              <div className="text-center text-[10px] text-gray-400 pt-1">
                Credencial de prueba: admin@polar.com / polar2026
              </div>
            </form>
          </div>
        ) : (
          /* Order Detail Screen (Once Authenticated) */
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b pb-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">
                  Pedido #{targetOrder.orderId}
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Acceso verificado · Listo para programar
                </span>
              </div>
            </div>

            {/* Client and Address Card */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-2">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Cliente:</span>
                <strong className="text-gray-900 text-sm">{targetOrder.clientName}</strong>
                <span className="text-gray-500 font-mono block mt-0.5">{targetOrder.clientPhone}</span>
              </div>

              <div className="pt-1 border-t border-gray-200">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Dirección de Entrega:</span>
                <strong className="text-gray-900">{targetOrder.address}</strong>
                <span className="text-sky-700 block text-[11px] font-semibold">{targetOrder.neighborhood}</span>
                {targetOrder.notes && (
                  <p className="text-gray-500 italic mt-0.5">"{targetOrder.notes}"</p>
                )}
              </div>

              {targetOrder.coords && (
                <div className="pt-1">
                  <a
                    href={`https://www.google.com/maps?q=${targetOrder.coords.lat},${targetOrder.coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#0c315b] hover:underline font-bold flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ver punto GPS satelital en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Products table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-2 text-center">Cant.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {targetOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium text-gray-800">{it.name}</td>
                      <td className="py-2 px-2 text-center font-bold text-gray-900">x{it.qty}</td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-900">
                        ${(it.price * it.qty).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-sm font-bold">
              <span>Total a cobrar:</span>
              <span className="text-base font-black text-[#0c315b]">
                ${targetOrder.total.toLocaleString()}
              </span>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => {
                onApproveOrder(targetOrder);
                alert(`¡Pedido #${targetOrder.orderId} aprobado y cargado al recorrido del Camión #1!`);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
            >
              <Truck className="w-4 h-4" />
              <span>APROBAR Y ASIGNAR A HOJA DE RUTA</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
