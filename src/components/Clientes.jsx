import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { fetchClients, createClient, updateClient, deleteClient } from '../services/api';

const CLIENTS_STORAGE_KEY = 'polar_clients_v2';
const DELETED_CLIENTS_KEY = 'polar_deleted_clients_ids_v2';

const INITIAL_CLIENTS_SEED = [
  {
    id: 'cli-01',
    name: 'Norma Giménez',
    phone: '5491155550106',
    addressRaw: 'Loyola 420',
    neighborhood: 'Villa Crespo',
    address: 'Loyola 420, Villa Crespo',
    balance: -40500.00,
    containersHeld: { bidon20L: 8, bidon12L: 0, sifon: 0 },
    containers: [{ label: 'Bidón 20L', qty: 8 }],
    isInactive: true,
    notes: 'Dejar en portería si no atiende.'
  },
  {
    id: 'cli-02',
    name: 'Panadería La Espiga',
    phone: '5491155550112',
    addressRaw: 'Juan B. Justo 3420',
    neighborhood: 'Palermo',
    address: 'Juan B. Justo 3420, Palermo',
    balance: -15300.00,
    containersHeld: { bidon20L: 7, bidon12L: 0, sifon: 0 },
    containers: [{ label: 'Bidón 20L', qty: 7 }],
    isInactive: true,
    notes: 'Entrada lateral sobre calle Vera.'
  },
  {
    id: 'cli-03',
    name: 'Graciela Sosa',
    phone: '5491155550109',
    addressRaw: 'Santa Rosa 890',
    neighborhood: 'Alberdi',
    address: 'Santa Rosa 890, Alberdi',
    balance: -8200.00,
    containersHeld: { bidon20L: 5, bidon12L: 0, sifon: 0 },
    containers: [{ label: 'Bidón 20L', qty: 5 }],
    isInactive: true,
    notes: 'Pagar con transferencia.'
  },
  {
    id: 'cli-04',
    name: 'Silvia Peralta',
    phone: '5491155550104',
    addressRaw: 'Av. Colón 1240, Depto 3B',
    neighborhood: 'Alberdi',
    address: 'Av. Colón 1240, Depto 3B, Alberdi',
    balance: -4800.00,
    containersHeld: { bidon20L: 0, bidon12L: 3, sifon: 0 },
    containers: [{ label: 'Bidón 12L', qty: 3 }],
    isInactive: true,
    notes: 'Timbre 3B.'
  },
  {
    id: 'cli-05',
    name: 'Familia Rodríguez',
    phone: '5493512345678',
    addressRaw: 'Camargo 460',
    neighborhood: 'Villa Crespo',
    address: 'Camargo 460, Villa Crespo',
    balance: 0.00,
    containersHeld: { bidon20L: 3, bidon12L: 0, sifon: 2 },
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
    addressRaw: 'Corrientes 4800, Piso 2',
    neighborhood: 'San Martín',
    address: 'Corrientes 4800, Piso 2, San Martín',
    balance: 0.00,
    containersHeld: { bidon20L: 6, bidon12L: 0, sifon: 0 },
    containers: [
      { label: 'Bidón 20L', qty: 6 }
    ],
    isInactive: false,
    notes: 'Atención 9 a 18hs.'
  }
];

function getDeletedClientIds() {
  try {
    const raw = localStorage.getItem(DELETED_CLIENTS_KEY);
    return raw ? new Set(JSON.parse(raw).map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedClientId(id) {
  try {
    const ids = getDeletedClientIds();
    ids.add(String(id));
    localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error('Error saving deleted client id:', e);
  }
}

function getStoredClients() {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const deletedIds = getDeletedClientIds();
        return parsed.filter(c => !deletedIds.has(String(c.id)));
      }
    }
  } catch (e) {
    console.error('Error reading stored clients:', e);
  }
  const deletedIds = getDeletedClientIds();
  return INITIAL_CLIENTS_SEED.filter(c => !deletedIds.has(String(c.id)));
}

function saveStoredClients(clients) {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving stored clients:', e);
  }
}

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDebt, setOnlyDebt] = useState(false);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [minQty, setMinQty] = useState('');
  const [sortBy, setSortBy] = useState('Saldo');
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [selectedClientForQr, setSelectedClientForQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Client Modal state
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editBidones20L, setEditBidones20L] = useState(0);
  const [editBidones12L, setEditBidones12L] = useState(0);
  const [editSifones, setEditSifones] = useState(0);
  const [editBalance, setEditBalance] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Client Modal state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('Alberdi');
  const [newBidones, setNewBidones] = useState(2);

  const [clientsList, setClientsList] = useState(() => getStoredClients());

  const loadClients = async () => {
    try {
      const dbClients = await fetchClients();
      if (Array.isArray(dbClients)) {
        const deletedIds = getDeletedClientIds();
        const validDb = dbClients
          .filter(c => !deletedIds.has(String(c.id)))
          .map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            addressRaw: c.address || '',
            neighborhood: c.neighborhood || '',
            address: `${c.address}${c.neighborhood ? `, ${c.neighborhood}` : ''}`,
            balance: -Math.abs(c.fiado_balance || 0),
            containersHeld: c.containers_held || {},
            containers: [
              { label: 'Bidón 20L', qty: c.containers_held?.bidon20L || 0 },
              { label: 'Bidón 12L', qty: c.containers_held?.bidon12L || 0 },
              { label: 'Sifón', qty: c.containers_held?.sifon || 0 }
            ].filter(x => x.qty > 0),
            deliveryHistory: c.delivery_history || [],
            isInactive: false,
            notes: c.notes || ''
          }));

        if (validDb.length > 0) {
          setClientsList(validDb);
          saveStoredClients(validDb);
        } else if (dbClients.length === 0) {
          const stored = getStoredClients();
          if (stored.length === 0) {
            setClientsList([]);
            saveStoredClients([]);
          }
        }
      }
    } catch (err) {
      console.warn('Using stored clients cache:', err.message);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleRestoreDemoClients = () => {
    try {
      localStorage.removeItem(DELETED_CLIENTS_KEY);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(INITIAL_CLIENTS_SEED));
      setClientsList(INITIAL_CLIENTS_SEED);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllClients = () => {
    if (clientsList.length === 0) return;
    if (!window.confirm('¿Estás seguro de que deseás eliminar todos los clientes de la lista?')) return;
    try {
      const ids = getDeletedClientIds();
      clientsList.forEach(c => ids.add(String(c.id)));
      localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify(Array.from(ids)));
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify([]));
      setClientsList([]);
    } catch (e) {
      console.error(e);
    }
  };

  const getQrTargetUrl = (client) => {
    if (!client || client.isGeneric) return `${window.location.origin}/cliente`;
    const params = new URLSearchParams({
      c: client.id,
      n: client.name || '',
      p: client.phone || '',
      a: client.address || ''
    });
    return `${window.location.origin}/cliente?${params.toString()}`;
  };

  useEffect(() => {
    if (!selectedClientForQr) {
      setQrDataUrl('');
      return;
    }
    const targetUrl = getQrTargetUrl(selectedClientForQr);
    QRCode.toDataURL(targetUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0c315b',
        light: '#ffffff'
      }
    }).then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [selectedClientForQr]);

  const handleAddClient = async (e) => {
    e.preventDefault();
    const newId = `cli-${Date.now()}`;
    const newClientObj = {
      id: newId,
      name: newName,
      phone: newPhone,
      addressRaw: newAddress,
      neighborhood: newNeighborhood,
      address: `${newAddress}${newNeighborhood ? `, ${newNeighborhood}` : ''}`,
      balance: 0,
      containersHeld: { bidon20L: Number(newBidones) || 0, bidon12L: 0, sifon: 0 },
      containers: [{ label: 'Bidón 20L', qty: Number(newBidones) || 0 }].filter(x => x.qty > 0),
      isInactive: false,
      notes: ''
    };

    const updated = [newClientObj, ...clientsList];
    setClientsList(updated);
    saveStoredClients(updated);

    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');

    try {
      await createClient({
        id: newId,
        name: newName,
        phone: newPhone,
        address: newAddress,
        neighborhood: newNeighborhood,
        containers_held: { bidon20L: Number(newBidones) || 0, bidon12L: 0, sifon: 0 }
      });
      loadClients();
    } catch (err) {
      console.warn('API save offline fallback:', err.message);
    }
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setEditName(client.name || '');
    setEditPhone(client.phone || '');
    setEditAddress(client.addressRaw || client.address?.split(',')[0] || client.address || '');
    setEditNeighborhood(client.neighborhood || '');
    setEditBidones20L(client.containersHeld?.bidon20L ?? (client.containers?.find(c => c.label.includes('20L'))?.qty || 0));
    setEditBidones12L(client.containersHeld?.bidon12L ?? (client.containers?.find(c => c.label.includes('12L'))?.qty || 0));
    setEditSifones(client.containersHeld?.sifon ?? (client.containers?.find(c => c.label.toLowerCase().includes('sif'))?.qty || 0));
    setEditBalance(Math.abs(client.balance || 0));
    setEditNotes(client.notes || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    setSavingEdit(true);

    const updatedClient = {
      ...editingClient,
      name: editName,
      phone: editPhone,
      addressRaw: editAddress,
      neighborhood: editNeighborhood,
      address: `${editAddress}${editNeighborhood ? `, ${editNeighborhood}` : ''}`,
      balance: -Math.abs(Number(editBalance) || 0),
      notes: editNotes,
      containersHeld: {
        bidon20L: Number(editBidones20L) || 0,
        bidon12L: Number(editBidones12L) || 0,
        sifon: Number(editSifones) || 0
      },
      containers: [
        { label: 'Bidón 20L', qty: Number(editBidones20L) || 0 },
        { label: 'Bidón 12L', qty: Number(editBidones12L) || 0 },
        { label: 'Sifón', qty: Number(editSifones) || 0 }
      ].filter(x => x.qty > 0)
    };

    const updatedList = clientsList.map(c => c.id === editingClient.id ? updatedClient : c);
    setClientsList(updatedList);
    saveStoredClients(updatedList);
    setEditingClient(null);

    try {
      await updateClient(editingClient.id, {
        name: editName,
        phone: editPhone,
        address: editAddress,
        neighborhood: editNeighborhood,
        notes: editNotes,
        fiado_balance: Number(editBalance) || 0,
        containers_held: {
          bidon20L: Number(editBidones20L) || 0,
          bidon12L: Number(editBidones12L) || 0,
          sifon: Number(editSifones) || 0
        }
      });
    } catch (err) {
      console.warn('API update offline fallback:', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClient = async (client) => {
    if (!client) return;
    const confirmed = window.confirm(`¿Estás seguro de que deseás eliminar al cliente "${client.name}"?`);
    if (!confirmed) return;

    // Immediately persist deletion in localStorage & mark ID as deleted
    saveDeletedClientId(client.id);
    const updated = clientsList.filter(c => String(c.id) !== String(client.id));
    setClientsList(updated);
    saveStoredClients(updated);

    // Call API in background
    try {
      await deleteClient(client.id);
    } catch (err) {
      console.warn('API delete offline fallback:', err.message);
    }
  };

  const filtered = clientsList.filter(c => {
    const matchText = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (c.phone || '').includes(searchTerm) ||
                      c.address.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchText) return false;
    if (onlyDebt && c.balance >= 0) return false;
    if (onlyInactive && !c.isInactive) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center tracking-tight">
        Clientes
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Search input */}
        <div className="relative">
          <span className="absolute -top-2 left-2.5 bg-white px-1 text-[11px] text-gray-500 font-medium z-10">
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

        {/* Filter bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={onlyDebt}
                onChange={(e) => setOnlyDebt(e.target.checked)}
                className="rounded text-[#0c315b] focus:ring-[#0c315b]"
              />
              <span>Con deuda</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={onlyInactive}
                onChange={(e) => setOnlyInactive(e.target.checked)}
                className="rounded text-[#0c315b] focus:ring-[#0c315b]"
              />
              <span>Inactivos</span>
            </label>

            <input
              type="number"
              placeholder="Mín. envases"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 w-32 outline-none focus:border-[#0c315b]"
            />

            <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent outline-none pr-1 font-semibold text-gray-800 cursor-pointer"
              >
                <option value="Saldo">Orden: Saldo</option>
                <option value="Nombre">Orden: Nombre</option>
                <option value="Último pedido">Orden: Último pedido</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {clientsList.length === 0 ? (
              <button
                onClick={handleRestoreDemoClients}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center space-x-1.5 transition text-xs"
                title="Restablecer clientes de prueba"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Restablecer Demo</span>
              </button>
            ) : (
              <button
                onClick={handleClearAllClients}
                className="px-2.5 py-2 rounded-lg border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-500 font-semibold flex items-center space-x-1 transition text-xs"
                title="Vaciar todos los clientes de prueba"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            )}

            <button 
              onClick={() => setSelectedClientForQr({ isGeneric: true, name: 'General' })}
              className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-[#0c315b] font-bold flex items-center space-x-1.5 hover:bg-sky-100 transition"
              title="Generar Sticker QR general hacia /cliente"
            >
              <QrCode className="w-4 h-4" />
              <span>QR /cliente (General)</span>
            </button>

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold transition shadow-xs flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Cliente</span>
            </button>
          </div>
        </div>

        {/* Clients List */}
        <div className="divide-y divide-gray-100 pt-2">
          {filtered.map((client) => {
            const isExpanded = expandedClientId === client.id;
            return (
              <div key={client.id} className="py-3.5 hover:bg-gray-50/60 rounded-xl px-2 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900 text-sm">{client.name}</h3>
                      <Home className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                      <span>Posee:</span>
                      {client.containers.length === 0 ? (
                        <span className="text-gray-400">0 envases</span>
                      ) : client.containers.map((cont, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-sky-300 bg-sky-50 text-[#0c315b]"
                        >
                          {cont.label}: {cont.qty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs">
                    <span className="text-gray-500 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {client.phone}
                    </span>

                    <span className={`font-black text-sm ${
                      client.balance < 0 ? 'text-rose-600' : 'text-gray-700'
                    }`}>
                      {client.balance < 0 
                        ? `$ -${Math.abs(client.balance).toFixed(2)}` 
                        : '$ 0.00'
                      }
                    </span>

                    <div className="flex items-center space-x-1 text-gray-400">
                      <button 
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 hover:bg-sky-50 rounded-lg text-gray-500 hover:text-[#0c315b] transition" 
                        title="Modificar datos del cliente"
                      >
                        <Edit className="w-4 h-4 text-[#0c315b]" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition" 
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                      <button 
                        onClick={() => setSelectedClientForQr(client)}
                        className="p-1.5 hover:bg-sky-50 rounded-lg hover:text-[#0c315b] transition" 
                        title="Sticker QR para Bidón / Dispenser del cliente"
                      >
                        <QrCode className="w-4 h-4 text-sky-600" />
                      </button>
                      <button 
                        onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg hover:text-gray-700 transition" 
                        title="Ver más"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 bg-gray-50 p-3.5 rounded-xl text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Dirección:</span>
                        <strong className="text-gray-800">{client.address}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Notas de entrega:</span>
                        <span className="text-gray-700">{client.notes || 'Sin notas'}</span>
                      </div>
                      <div className="sm:text-right">
                        <button
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `Hola ${client.name}! Te escribimos de Soda y Agua Polar. Podés hacer tu próximo pedido directo desde este link: ${getQrTargetUrl(client)}`
                            );
                            window.open(`https://wa.me/${client.phone}?text=${msg}`, '_blank');
                          }}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar Link /cliente</span>
                        </button>
                      </div>
                    </div>

                    {/* Envases en posesión del cliente desglosados */}
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1.5">
                        📦 Balance de Envases en Posesión del Cliente:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-100/70 border border-sky-300 font-bold text-[#0c315b] text-xs">
                          Bidones 20L: {client.containersHeld?.bidon20L || 0}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-sky-100/70 border border-sky-300 font-bold text-[#0c315b] text-xs">
                          Bidones 12L: {client.containersHeld?.bidon12L || 0}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-sky-100/70 border border-sky-300 font-bold text-[#0c315b] text-xs">
                          Sifones Soda 1.5L: {client.containersHeld?.sifon || 0}
                        </span>
                      </div>
                    </div>

                    {/* Historial de Entregas y Devolución de Envases */}
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1.5">
                        📋 Historial de Entregas y Devolución de Envases:
                      </span>
                      {client.deliveryHistory && client.deliveryHistory.length > 0 ? (
                        <div className="space-y-1.5">
                          {client.deliveryHistory.slice(0, 5).map((del, dIdx) => (
                            <div key={dIdx} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs space-y-1">
                              <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-[#0c315b]">📅 {del.date} {del.tripNumber ? `(Ruta #${del.tripNumber})` : ''}</span>
                                <span className="text-emerald-700 font-mono">${Number(del.totalAmount || del.totalPaid || 0).toLocaleString('es-AR')} ({del.paymentMethod || 'Efectivo'})</span>
                              </div>
                              <div className="text-[11px] text-gray-700 flex flex-wrap items-center gap-x-2">
                                <span className="font-semibold text-gray-900">Entregado:</span>
                                <span>{(del.itemsDelivered || []).map(i => `${i.qty}x ${i.name}`).join(', ') || 'Productos Polar'}</span>
                              </div>
                              <div className="text-[11px] text-sky-800 flex flex-wrap items-center gap-x-2">
                                <span className="font-semibold text-[#0c315b]">Vacíos retirados:</span>
                                <span>
                                  {(del.returnedContainers && del.returnedContainers.length > 0)
                                    ? del.returnedContainers.map(c => `${c.qty}x ${c.name}`).join(', ')
                                    : del.totalEmpty ? `${del.totalEmpty} vacíos` : 'Ninguno (0)'
                                  }
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic text-[11px]">
                          Sin entregas registradas aún. Al confirmar entregas desde la Hoja de Ruta, aparecerán aquí con el detalle de productos y envases vacíos devueltos.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-[#0c315b] flex items-center justify-center mx-auto font-bold">
                <Home className="w-6 h-6 text-sky-700" />
              </div>
              <p className="text-sm font-bold text-gray-800">No se encontraron clientes.</p>
              {clientsList.length === 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3.5 py-2 rounded-lg bg-[#0c315b] text-white text-xs font-bold hover:bg-[#082342] transition shadow-2xs"
                  >
                    Agregar nuevo cliente
                  </button>
                  <button
                    onClick={handleRestoreDemoClients}
                    className="px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Restablecer clientes de ejemplo</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Probá ajustando el término de búsqueda o desactivando los filtros.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR STICKER MODAL -> Redirects to /cliente */}
      {selectedClientForQr && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-900">
                {selectedClientForQr.isGeneric ? 'Código QR General (/cliente)' : 'Sticker QR para Bidón / Dispenser'}
              </h3>
              <button onClick={() => setSelectedClientForQr(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              {selectedClientForQr.isGeneric ? (
                <>QR público sin datos de cliente precargados. Pegar en folletos, vehículos o dispenser general. Al escanearlo abre <strong>/cliente</strong> para que cualquier persona pida.</>
              ) : (
                <>Pegar en el bidón o dispenser de <strong>{selectedClientForQr.name}</strong>. Al escanearlo abre directo <strong>/cliente</strong> con sus datos precargados.</>
              )}
            </p>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block mx-auto mb-3">
              <div className="w-48 h-48 bg-white p-2 rounded-lg border border-gray-300 flex items-center justify-center relative">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Cliente Polar" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-32 h-32 text-gray-900" />
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-white p-0.5 border-2 border-[#0c315b] shadow-sm">
                    <img src="/images/logo-polar.png" alt="logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                </div>
              </div>
              <span className="block text-[10px] font-mono text-gray-500 mt-2">
                {selectedClientForQr.isGeneric ? 'Soda y Agua POLAR · Escaneá para pedir' : `${selectedClientForQr.name} · Escaneá para pedir`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-3 text-left">
              <input
                type="text"
                readOnly
                value={getQrTargetUrl(selectedClientForQr)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-mono text-gray-600"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(getQrTargetUrl(selectedClientForQr));
                  setCopiedQrLink(true);
                  setTimeout(() => setCopiedQrLink(false), 2000);
                }}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700"
                title="Copiar link"
              >
                {copiedQrLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={getQrTargetUrl(selectedClientForQr)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-[#0c315b]"
                title="Probar link /cliente"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
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

      {/* EDIT CLIENT MODAL */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Modificar Cliente</h3>
                <span className="text-[11px] text-gray-500 font-mono">{editingClient.id}</span>
              </div>
              <button onClick={() => setEditingClient(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nombre Completo / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Barrio</label>
                  <input
                    type="text"
                    value={editNeighborhood}
                    onChange={(e) => setEditNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Dirección (Calle y Altura) *</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                />
              </div>

              <div className="border-t border-gray-100 pt-2">
                <label className="font-bold text-gray-700 block mb-1.5">Envases en Comodato (Posee el cliente)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[11px] text-gray-500 block mb-0.5">Bidones 20L</span>
                    <input
                      type="number"
                      min="0"
                      value={editBidones20L}
                      onChange={(e) => setEditBidones20L(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border rounded-lg text-center font-bold outline-none focus:border-[#0c315b]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 block mb-0.5">Bidones 12L</span>
                    <input
                      type="number"
                      min="0"
                      value={editBidones12L}
                      onChange={(e) => setEditBidones12L(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border rounded-lg text-center font-bold outline-none focus:border-[#0c315b]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 block mb-0.5">Sifones 1.5L</span>
                    <input
                      type="number"
                      min="0"
                      value={editSifones}
                      onChange={(e) => setEditSifones(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border rounded-lg text-center font-bold outline-none focus:border-[#0c315b]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-100 pt-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Saldo Deuda / Fiado ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editBalance}
                    onChange={(e) => setEditBalance(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b] font-bold"
                  />
                  <span className="text-[10px] text-gray-400">0 si está al día</span>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Notas de Entrega</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Ej: Timbre 3B, dejar en portería"
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-3.5 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-[#0c315b] hover:bg-[#082342] text-white font-bold rounded-lg transition"
                >
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
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

            <form onSubmit={handleAddClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Familia Gómez"
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="549351..."
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Envases 20L</label>
                  <input
                    type="number"
                    value={newBidones}
                    onChange={(e) => setNewBidones(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Dirección *</label>
                  <input
                    type="text"
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Calle y número"
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Barrio</label>
                  <input
                    type="text"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
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
