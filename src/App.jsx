import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Repartir from './components/Repartir';
import Repartos from './components/Repartos';
import Pedidos from './components/Pedidos';
import Clientes from './components/Clientes';
import Productos from './components/Productos';
import ComprobanteModal from './components/ComprobanteModal';
import ClientPublicPortal from './components/ClientPublicPortal';
import AdminLoginModal from './components/AdminLoginModal';
import DriverTripPortal from './components/DriverTripPortal';
import LoginScreen from './components/LoginScreen';
import { Gift, Menu, ExternalLink, Plus, Trash2, UserPlus, LogOut } from 'lucide-react';
import { 
  getStoredOrders, 
  saveOrder, 
  addOrderToActiveTrip, 
  decodeOrderParam 
} from './services/tripSync';
import { 
  verifySession, 
  fetchUsers, 
  createUser, 
  deleteUser 
} from './services/api';

function UsuariosPanel() {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('repartidor');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    const list = await fetchUsers();
    if (Array.isArray(list)) setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUser({ username, name, phone, role, password });
      setShowAdd(false);
      setUsername('');
      setName('');
      setPhone('');
      setPassword('');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (u) => {
    if (u.username === 'master') return;
    if (!window.confirm(`¿Desactivar a ${u.name}?`)) return;
    await deleteUser(u.id);
    loadUsers();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Usuarios del Equipo</h2>
          <span className="text-xs text-gray-500">{users.length} usuarios activos en base de datos</span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-2 rounded-lg bg-[#0c315b] text-white text-xs font-bold flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              required
              placeholder="Usuario (ej: chofer3)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white outline-none focus:border-[#0c315b]"
            />
            <input
              type="text"
              required
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white outline-none focus:border-[#0c315b]"
            />
            <input
              type="text"
              placeholder="Teléfono WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white outline-none focus:border-[#0c315b]"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white outline-none focus:border-[#0c315b]"
            >
              <option value="repartidor">Repartidor / Chofer</option>
              <option value="admin">Administrador</option>
            </select>
            <input
              type="password"
              required
              placeholder="Contraseña (se guarda cifrada)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sm:col-span-2 px-3 py-2 border rounded-lg bg-white outline-none focus:border-[#0c315b]"
            />
          </div>
          {error && <p className="text-rose-600 font-semibold">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg">Guardar Cifrado</button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100 text-xs">
        {users.map((u) => (
          <div key={u.id} className="py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <strong className="text-gray-900 block truncate">{u.name}</strong>
              <span className="text-gray-400 block truncate">@{u.username || u.email} {u.phone ? `· ${u.phone}` : ''}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                u.role === 'admin' ? 'bg-sky-100 text-[#0c315b]' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {u.role}
              </span>
              {u.username !== 'master' && (
                <button
                  onClick={() => handleDelete(u)}
                  className="p-1 text-gray-400 hover:text-rose-600"
                  title="Eliminar usuario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [comprobanteStop, setComprobanteStop] = useState(null);

  // Public route detection: /cliente or /rutaXX
  const [routeMode, setRouteMode] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    if (path === '/cliente' || path.startsWith('/cliente/') || params.get('portal') === 'cliente') {
      return { type: 'cliente' };
    }

    const rutaMatch = path.match(/^\/ruta(\d+)\/?$/i);
    if (rutaMatch) {
      const num = parseInt(rutaMatch[1], 10);
      return { type: 'ruta', tripId: `VIAJE-${num}`, tripNumber: num };
    }

    const viajeParam = params.get('viaje');
    if (viajeParam) {
      const numMatch = viajeParam.match(/\d+/);
      return { type: 'ruta', tripId: viajeParam, tripNumber: numMatch ? parseInt(numMatch[0], 10) : 25 };
    }

    return { type: 'system' };
  });

  // Auth state for protected admin system
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Link management state (?manageOrder=POLAR-XXXX)
  const [activeManageOrderId, setActiveManageOrderId] = useState(null);
  const [ordersDatabase, setOrdersDatabase] = useState(() => getStoredOrders());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('manageOrder');
    const dataParam = params.get('d');
    if (orderParam) {
      setActiveManageOrderId(orderParam);
      if (dataParam) {
        const decoded = decodeOrderParam(dataParam);
        if (decoded) {
          saveOrder(decoded);
          setOrdersDatabase(getStoredOrders());
        }
      }
    }

    // Verify stored session token if entering the system
    const token = localStorage.getItem('polar_auth_token');
    if (!token) {
      setAuthChecking(false);
      return;
    }

    verifySession(token).then((res) => {
      if (res?.valid && res?.user) {
        setCurrentUser(res.user);
      } else {
        localStorage.removeItem('polar_auth_token');
        localStorage.removeItem('polar_auth_user');
      }
      setAuthChecking(false);
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('polar_auth_token');
    localStorage.removeItem('polar_auth_user');
    setCurrentUser(null);
  };

  const handleOrderCreatedByClient = (newOrder) => {
    const updated = saveOrder(newOrder);
    setOrdersDatabase(updated);
  };

  const handleApproveOrder = (order) => {
    addOrderToActiveTrip(order, 'VIAJE-25');
    const updatedOrder = { ...order, status: 'Aprobado y en hoja de ruta' };
    const updatedList = saveOrder(updatedOrder);
    setOrdersDatabase(updatedList);
    setActiveTab('repartos');
  };

  const handleOpenDriverRoute = (tripId, tripNumber) => {
    const num = tripNumber || parseInt(String(tripId).match(/\d+/)?.[0] || '25', 10);
    window.history.pushState({}, '', `/ruta${num}`);
    setRouteMode({ type: 'ruta', tripId: tripId || `VIAJE-${num}`, tripNumber: num });
  };

  const handleBackFromDriverRoute = () => {
    window.history.pushState({}, '', '/');
    setRouteMode({ type: 'system' });
  };

  // 1. Public Client Portal (/cliente) — Completely separated from system login
  if (routeMode.type === 'cliente') {
    return (
      <ClientPublicPortal onOrderCreated={handleOrderCreatedByClient} />
    );
  }

  // 2. Driver Trip Link (/rutaXX) — Publicly accessible for the assigned driver
  if (routeMode.type === 'ruta') {
    return (
      <>
        <DriverTripPortal
          tripId={routeMode.tripId}
          tripNumber={routeMode.tripNumber}
          onBackToAdmin={currentUser ? handleBackFromDriverRoute : null}
          onOpenComprobante={(stop) => setComprobanteStop(stop)}
        />
        {comprobanteStop && (
          <ComprobanteModal 
            stop={comprobanteStop} 
            onClose={() => setComprobanteStop(null)} 
          />
        )}
      </>
    );
  }

  // 3. System Auth Gate (master / Ndf010399@ encrypted in DB)
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0c315b] flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold tracking-wider uppercase text-sky-200">Verificando sesión Polar...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 flex font-sans">
      {/* Left Collapsible Sidebar + Mobile Slide-Over Drawer */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        unreadNotifications={3}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Top Responsive Utility Header (Desktop/Celular Chofer toggle removed) */}
        <header className="h-14 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline text-xs font-bold text-gray-400 uppercase tracking-wider">Sistema Polar</span>
            <span className="hidden sm:inline text-gray-300">/</span>
            <span className="text-xs sm:text-sm font-bold text-[#0c315b] uppercase tracking-wide capitalize truncate">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/cliente"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition flex items-center space-x-1"
              title="Abrir portal público de clientes /cliente"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portal Público</span>
              <span>/cliente</span>
            </a>

            <button
              onClick={handleLogout}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-3 sm:p-6 flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigateToRepartir={() => setActiveTab('repartir')} />
          )}

          {activeTab === 'repartir' && (
            <Repartir onOpenDriverTrip={handleOpenDriverRoute} />
          )}

          {activeTab === 'repartos' && (
            <Repartos 
              onSelectRoute={() => setActiveTab('repartir')}
              onOpenDriverTrip={handleOpenDriverRoute}
            />
          )}

          {activeTab === 'pedidos' && (
            <Pedidos />
          )}

          {activeTab === 'clientes' && (
            <Clientes />
          )}

          {activeTab === 'productos' && (
            <Productos />
          )}

          {activeTab === 'referidos' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 text-center max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 bg-sky-50 text-[#0c315b] rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Programa de Referidos Polar</h2>
              <p className="text-xs text-gray-500">
                Invitá a otras soderías o repartos a digitalizarse con el sistema y obtené descuentos en tu plan.
              </p>
              <div className="p-3 bg-gray-50 rounded-lg border font-mono text-xs text-gray-700 break-all">
                https://polar.reparto.cloud/ref/POLAR-CORDOBA
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && <UsuariosPanel />}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3.5 px-4 sm:px-6 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
          <div className="flex items-center space-x-2">
            <img src="/images/logo-polar.png" alt="Polar" className="w-5 h-5 object-contain rounded-full" />
            <span className="font-bold text-gray-800">Soda y Agua POLAR</span>
          </div>
          <span className="text-center">Sistema de Repartos y Trazabilidad de Envases</span>
        </footer>
      </div>

      {/* Global Comprobante Modal */}
      {comprobanteStop && (
        <ComprobanteModal 
          stop={comprobanteStop} 
          onClose={() => setComprobanteStop(null)} 
        />
      )}

      {/* Admin Order Quick View Modal (?manageOrder=POLAR-XXXX) */}
      {activeManageOrderId && (
        <AdminLoginModal
          orderId={activeManageOrderId}
          orders={ordersDatabase}
          onApproveOrder={handleApproveOrder}
          onClose={() => setActiveManageOrderId(null)}
        />
      )}
    </div>
  );
}
