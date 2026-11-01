import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  QrCode, 
  Download, 
  Plus, 
  Home, 
  Phone, 
  Edit, 
  ChevronDown, 
  ChevronUp,
  ArrowUp,
  X,
  Printer,
  MessageCircle
} from 'lucide-react';
import { fetchClients } from '../services/api';

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDebt, setOnlyDebt] = useState(false);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [minQty, setMinQty] = useState('');
  const [sortBy, setSortBy] = useState('Saldo');
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [selectedClientForQr, setSelectedClientForQr] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const initialSeed = [
    {
      id: 'cli-01',
      name: 'Norma Giménez',
      phone: '5491155550106',
      address: 'Loyola 420, Villa Crespo',
      balance: -40500.00,
      containers: [{ label: 'Bidón 20L', qty: 8 }],
      isInactive: true,
      notes: 'Dejar en portería si no atiende.'
    },
    {
      id: 'cli-02',
      name: 'Panadería La Espiga',
      phone: '5491155550112',
      address: 'Juan B. Justo 3420, Palermo',
      balance: -15300.00,
      containers: [{ label: 'Bidón 20L', qty: 7 }],
      isInactive: true,
      notes: 'Entrada lateral sobre calle Vera.'
    },
    {
      id: 'cli-03',
      name: 'Graciela Sosa',
      phone: '5491155550109',
      address: 'Santa Rosa 890, Alberdi',
      balance: -8200.00,
      containers: [{ label: 'Bidón 20L', qty: 5 }],
      isInactive: true,
      notes: 'Pagar con transferencia.'
    },
    {
      id: 'cli-04',
      name: 'Silvia Peralta',
      phone: '5491155550104',
      address: 'Av. Colón 1240, Depto 3B',
      balance: -4800.00,
      containers: [{ label: 'Bidón 12L', qty: 3 }],
      isInactive: true,
      notes: 'Timbre 3B.'
    },
    {
      id: 'cli-05',
      name: 'Familia Rodríguez',
      phone: '5493512345678',
      address: 'Camargo 460, Villa Crespo',
      balance: 0.00,
      containers: [
        { label: 'Bidón 20L', qty: 3 },
        { label: 'Sifón Soda 1.5L', qty: 2 }
      ],
      isInactive: false,
      notes: 'Recarga fija los días Lunes.'
    },
    {
      id: 'cli-06',
      name: 'Consultorio Dental Crespo',
      phone: '5491155550103',
      address: 'Corrientes 4800, Piso 2',
      balance: 0.00,
      containers: [
        { label: 'Bidón 20L', qty: 6 },
        { label: 'Dispenser F/C', qty: 2 }
      ],
      isInactive: false,
      notes: 'Atención 9 a 18hs.'
    }
  ];

  const [clientsList, setClientsList] = useState(initialSeed);

  useEffect(() => {
    fetchClients().then(dbClients => {
      if (Array.isArray(dbClients) && dbClients.length > 0) {
        const formatted = dbClients.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: `${c.address}${c.neighborhood ? `, ${c.neighborhood}` : ''}`,
          balance: -Math.abs(c.fiado_balance || 0),
          containers: [
            { label: 'Bidón 20L', qty: c.containers_held?.bidon20L || 0 },
            { label: 'Bidón 12L', qty: c.containers_held?.bidon12L || 0 },
            { label: 'Sifón', qty: c.containers_held?.sifon || 0 }
          ].filter(x => x.qty > 0),
          isInactive: false,
          notes: c.notes || ''
        }));
        setClientsList(formatted);
      }
    });
  }, []);

  const filtered = clientsList.filter(c => {
    const matchText = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.phone.includes(searchTerm) ||
                      c.address.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchText) return false;
    if (onlyDebt && c.balance >= 0) return false;
    if (onlyInactive && !c.isInactive) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
        Clientes
      </h1>

      {/* Main Filter Section matching clientes.png & desktop-caja-fiados.png */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
        
        {/* Search input with outline style */}
        <div className="relative">
          <span className="absolute -top-2 left-2.5 bg-white px-1 text-[11px] text-gray-500 font-medium">
            Buscar por nombre, teléfono o dirección
          </span>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-800 focus:border-[#0c315b] outline-none"
            />
          </div>
        </div>

        {/* Filter bar: Checkboxes, select, buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 p-1" title="Eliminar selección">
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Checkbox Con Deuda */}
            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={onlyDebt}
                onChange={(e) => setOnlyDebt(e.target.checked)}
                className="rounded text-[#0c315b] focus:ring-[#0c315b]"
              />
              <span>Con deuda</span>
            </label>

            {/* Checkbox Inactivos */}
            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={onlyInactive}
                onChange={(e) => setOnlyInactive(e.target.checked)}
                className="rounded text-[#0c315b] focus:ring-[#0c315b]"
              />
              <span>Inactivos</span>
            </label>

            {/* Posee al menos cantidad */}
            <div className="relative">
              <input
                type="number"
                placeholder="Posee al menos cantidad"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 w-44 outline-none focus:border-[#0c315b]"
              />
            </div>

            {/* Ordenar por */}
            <div className="relative">
              <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-medium">
                Ordenar por
              </span>
              <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-1 text-xs">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent outline-none pr-1 font-semibold text-gray-800 cursor-pointer"
                >
                  <option value="Saldo">Saldo</option>
                  <option value="Nombre">Nombre</option>
                  <option value="Último pedido">Último pedido</option>
                </select>
              </div>
            </div>

            <button className="text-gray-500 hover:text-gray-900" title="Invertir orden">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons Right matching clientes.png */}
          <div className="flex items-center space-x-2">
            
            {/* QR Icon button */}
            <button 
              onClick={() => setSelectedClientForQr(clientsList[0])}
              className="w-8 h-8 rounded-lg bg-[#0c315b] text-white flex items-center justify-center hover:opacity-90 shadow-2xs"
              title="Generar Códigos QR"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Exportar button */}
            <button className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 flex items-center space-x-1 transition">
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Agregar Cliente button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-1.5 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold transition shadow-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Cliente</span>
            </button>
          </div>

        </div>

        {/* Clients List Rows matching desktop-caja-fiados.png */}
        <div className="divide-y divide-gray-100 pt-2">
          {filtered.map((client) => {
            const isExpanded = expandedClientId === client.id;
            return (
              <div key={client.id} className="py-3.5 hover:bg-gray-50/60 rounded-xl px-2 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  
                  {/* Left: Name and containers badge */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900 text-sm">{client.name}</h3>
                      <Home className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Subtitle badge: El cliente posee [Bidón 20L: 8] */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <span>El cliente posee</span>
                      {client.containers.map((cont, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-sky-300 bg-sky-50 text-[#0c315b]"
                        >
                          {cont.label}: {cont.qty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Phone, Saldo, Actions */}
                  <div className="flex items-center space-x-4 self-end sm:self-center text-xs">
                    <span className="text-gray-500 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {client.phone}
                    </span>

                    {/* Saldo: $-40500.00 */}
                    <span className={`font-black text-sm ${
                      client.balance < 0 ? 'text-rose-600' : 'text-gray-700'
                    }`}>
                      {client.balance < 0 
                        ? `$ -${Math.abs(client.balance).toFixed(2)}` 
                        : '$ 0.00'
                      }
                    </span>

                    {/* Icons: Edit, Delete, Expand, QR */}
                    <div className="flex items-center space-x-1.5 text-gray-400">
                      <button 
                        onClick={() => setSelectedClientForQr(client)}
                        className="p-1 hover:text-[#0c315b]" 
                        title="Ver QR"
                      >
                        <QrCode className="w-4 h-4 text-sky-600" />
                      </button>
                      <button className="p-1 hover:text-[#0c315b]" title="Editar">
                        <Edit className="w-4 h-4 text-orange-500" />
                      </button>
                      <button className="p-1 hover:text-rose-600" title="Eliminar">
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                      <button 
                        onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                        className="p-1 hover:text-gray-700" 
                        title="Ver más"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Dirección:</span>
                      <strong className="text-gray-800">{client.address}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Notas de entrega:</span>
                      <span className="text-gray-700">{client.notes}</span>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(
                            `Hola ${client.name}! Te escribimos de Soda y Agua Polar. Tu saldo actual es de $${Math.abs(client.balance).toLocaleString()}. Podés transferir al alias POLAR.AGUA.`
                          );
                          window.open(`https://wa.me/${client.phone}?text=${msg}`, '_blank');
                        }}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Cobrar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* QR MODAL */}
      {selectedClientForQr && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-900">Sticker QR para Bidón / Dispenser</h3>
              <button onClick={() => setSelectedClientForQr(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Pegar en el bidón o dispenser de <strong>{selectedClientForQr.name}</strong> para pedir con 1 escaneo.
            </p>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 inline-block mx-auto mb-4">
              <div className="w-40 h-40 bg-white p-2 rounded-lg border border-gray-300 flex items-center justify-center relative">
                <QrCode className="w-32 h-32 text-gray-900" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-sky-400">
                    <img src="/images/logo-polar.png" alt="logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                </div>
              </div>
              <span className="block text-[10px] font-mono text-gray-500 mt-2">
                ID: {selectedClientForQr.id} · Polar Pass
              </span>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Sticker</span>
            </button>
          </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-900">Agregar Nuevo Cliente</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setShowAddModal(false);
              alert('Cliente guardado con éxito.');
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Nombre Completo</label>
                <input type="text" required placeholder="Ej: Familia Gómez" className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">WhatsApp</label>
                  <input type="text" required placeholder="54911..." className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Envases 20L Iniciales</label>
                  <input type="number" defaultValue="2" className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]" />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Dirección de Entrega</label>
                <input type="text" required placeholder="Calle y número" className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]" />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg font-semibold text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-[#0c315b] text-white font-bold rounded-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
