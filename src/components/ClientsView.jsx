import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  QrCode, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Check, 
  Edit3, 
  Printer, 
  X,
  Droplets,
  ArrowRight
} from 'lucide-react';

export default function ClientsView({ clients, onAddClient, onUpdateClient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, debt, inactive, dispenser
  const [selectedClientForQr, setSelectedClientForQr] = useState(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    address: '',
    neighborhood: '',
    zone: 'Zona Centro / Oeste',
    deliveryDays: ['Lunes', 'Jueves'],
    bidon_20l: 2,
    bidon_12l: 0,
    sifon_15l: 0,
    dispenser_fc: 0,
    notes: ''
  });

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterType === 'debt') return c.balance > 0;
    if (filterType === 'inactive') return c.daysSinceLastOrder >= 14;
    if (filterType === 'dispenser') return c.containers.dispenser_fc > 0;
    return true;
  });

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.address) return;

    const created = {
      id: `cli-${Date.now().toString().slice(-4)}`,
      name: newClient.name,
      phone: newClient.phone.startsWith('549') ? newClient.phone : `549${newClient.phone.replace(/[^0-9]/g, '')}`,
      address: newClient.address,
      neighborhood: newClient.neighborhood || 'Centro',
      zone: newClient.zone,
      deliveryDays: newClient.deliveryDays,
      containers: {
        bidon_20l: Number(newClient.bidon_20l) || 0,
        bidon_12l: Number(newClient.bidon_12l) || 0,
        sifon_15l: Number(newClient.sifon_15l) || 0,
        dispenser_fc: Number(newClient.dispenser_fc) || 0
      },
      balance: 0,
      status: 'activo',
      lastOrderDate: new Date().toISOString().split('T')[0],
      daysSinceLastOrder: 0,
      frequentOrder: [{ productId: 'prod-20l', qty: 2 }],
      notes: newClient.notes
    };

    onAddClient(created);
    setShowNewClientModal(false);
    setNewClient({
      name: '',
      phone: '',
      address: '',
      neighborhood: '',
      zone: 'Zona Centro / Oeste',
      deliveryDays: ['Lunes', 'Jueves'],
      bidon_20l: 2,
      bidon_12l: 0,
      sifon_15l: 0,
      dispenser_fc: 0,
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900">Directorio de Clientes y Trazabilidad</h2>
          <p className="text-xs text-slate-500">
            Control exacto de bidones prestados, comodatos de dispensers y saldos en cuenta corriente.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewClientModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-900 to-sky-700 hover:from-sky-800 hover:to-sky-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, dirección, barrio o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          />
        </div>

        <div className="md:col-span-7 flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: `Todos (${clients.length})` },
            { id: 'debt', label: `Con Deuda $ (${clients.filter(c => c.balance > 0).length})` },
            { id: 'inactive', label: `Inactivos con Envases (${clients.filter(c => c.daysSinceLastOrder >= 14).length})` },
            { id: 'dispenser', label: `Con Dispenser F/C (${clients.filter(c => c.containers.dispenser_fc > 0).length})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                filterType === f.id
                  ? 'bg-sky-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const hasDebt = client.balance > 0;
          const isOverdue = client.daysSinceLastOrder >= 14;

          return (
            <div 
              key={client.id}
              className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between ${
                isOverdue 
                  ? 'border-amber-300 ring-1 ring-amber-300' 
                  : hasDebt 
                  ? 'border-rose-200' 
                  : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Top Badge & Name */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{client.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {client.address}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedClientForQr(client)}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                    title="Ver QR del Cliente"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                {/* Zona y Días de Reparto */}
                <div className="flex items-center space-x-2 text-[11px] text-slate-600 mb-3">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                    {client.zone}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-semibold text-sky-800">
                    {client.deliveryDays.join(', ')}
                  </span>
                </div>

                {/* Envases en Custodia (The core inventory tracking) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Envases en su poder
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">20L</span>
                      <strong className="text-slate-900 font-extrabold text-xs">
                        {client.containers.bidon_20l}
                      </strong>
                    </div>

                    <div className="bg-white p-1.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">12L</span>
                      <strong className="text-slate-900 font-extrabold text-xs">
                        {client.containers.bidon_12l}
                      </strong>
                    </div>

                    <div className="bg-white p-1.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Soda</span>
                      <strong className="text-slate-900 font-extrabold text-xs">
                        {client.containers.sifon_15l}
                      </strong>
                    </div>

                    <div className="bg-white p-1.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Disp.</span>
                      <strong className="text-slate-900 font-extrabold text-xs">
                        {client.containers.dispenser_fc}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Saldo y Estado */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cuenta Corriente:</span>
                    {hasDebt ? (
                      <strong className="text-rose-600 font-bold">Debe ${client.balance.toLocaleString()}</strong>
                    ) : (
                      <strong className="text-emerald-600 font-bold">Al día ($0)</strong>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Último pedido:</span>
                    <span className={`font-semibold ${isOverdue ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                      Hace {client.daysSinceLastOrder} días
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón rápido WhatsApp */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Hola ${client.name}! Te escribimos de Soda y Agua POLAR 🐻. ¿Cómo estás? ¿Te pasamos a dejar recargas esta semana?`
                    );
                    window.open(`https://wa.me/${client.phone}?text=${text}`, '_blank');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contactar x WhatsApp</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL QR CODE IMPRIMIBLE DEL CLIENTE */}
      {selectedClientForQr && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setSelectedClientForQr(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sticker Header */}
            <div className="inline-block p-1 rounded-full bg-sky-900 border-2 border-white shadow-md mb-3">
              <img src="/images/logo-polar.png" alt="Polar" className="w-14 h-14 object-contain rounded-full" />
            </div>

            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Sticker QR para Bidón / Dispenser
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pegá este código en el dispenser o bidón de <strong>{selectedClientForQr.name}</strong> para que pida con 1 solo escaneo.
            </p>

            {/* Simulated High-Res QR */}
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-sky-400 inline-block mx-auto mb-4">
              <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-inner flex flex-col items-center justify-center relative">
                {/* SVG QR Code pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  <rect x="0" y="0" width="30" height="30" rx="3" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" />
                  
                  <rect x="70" y="0" width="30" height="30" rx="3" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" />

                  <rect x="0" y="70" width="30" height="30" rx="3" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" />

                  <rect x="35" y="10" width="8" height="8" />
                  <rect x="48" y="10" width="14" height="8" />
                  <rect x="35" y="25" width="27" height="8" />
                  <rect x="10" y="38" width="8" height="24" />
                  <rect x="25" y="38" width="18" height="8" />
                  <rect x="50" y="38" width="20" height="8" />
                  <rect x="78" y="38" width="12" height="18" />
                  <rect x="38" y="50" width="24" height="24" />
                  <rect x="70" y="60" width="10" height="20" />
                  <rect x="85" y="70" width="15" height="10" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white p-1 rounded-full shadow-md border border-sky-500">
                    <img src="/images/logo-polar.png" alt="logo" className="w-7 h-7 object-contain rounded-full" />
                  </div>
                </div>
              </div>
              <span className="block text-[11px] font-mono font-bold text-sky-800 mt-2">
                ID: {selectedClientForQr.id} · Polar QR Pass
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-slate-800 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowNewClientModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Registrar Nuevo Cliente</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresá los datos del cliente y los envases iniciales que se le dejan en préstamo.
            </p>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Familia Morales o Taller El Sol"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp (con código de área)</label>
                  <input
                    type="text"
                    required
                    placeholder="3512345678"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Barrio</label>
                  <input
                    type="text"
                    placeholder="Ej: Alberdi, Centro, Nueva Cba"
                    value={newClient.neighborhood}
                    onChange={(e) => setNewClient({ ...newClient, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dirección Exacta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Colón 1230, Piso 3 Depto B"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Zona de Reparto</label>
                  <select
                    value={newClient.zone}
                    onChange={(e) => setNewClient({ ...newClient, zone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  >
                    <option value="Zona Centro / Oeste">Zona Centro / Oeste</option>
                    <option value="Zona Norte">Zona Norte</option>
                    <option value="Zona Sur / Quintas">Zona Sur / Quintas</option>
                    <option value="Comercios / Empresas">Comercios / Empresas</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Envases 20L Iniciales</label>
                  <input
                    type="number"
                    min="0"
                    value={newClient.bidon_20l}
                    onChange={(e) => setNewClient({ ...newClient, bidon_20l: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Observaciones para el Chofer</label>
                <input
                  type="text"
                  placeholder="Ej: Timbre no anda, golpear portón negro"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-white font-bold text-xs transition shadow-md"
                >
                  Guardar y Asignar QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
