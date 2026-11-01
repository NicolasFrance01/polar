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
import { Gift, UserCheck, Smartphone, Monitor, ExternalLink } from 'lucide-react';
import { 
  getStoredOrders, 
  saveOrder, 
  addOrderToActiveTrip, 
  decodeOrderParam 
} from './services/tripSync';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [showClientPortal, setShowClientPortal] = useState(false);
  const [comprobanteStop, setComprobanteStop] = useState(null);

  // Driver Trip Link state (?viaje=VIAJE-25)
  const [activeDriverTripId, setActiveDriverTripId] = useState(null);

  // Link management state (?manageOrder=POLAR-XXXX)
  const [activeManageOrderId, setActiveManageOrderId] = useState(null);
  const [ordersDatabase, setOrdersDatabase] = useState(() => getStoredOrders());

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check if driver opened trip link: ?viaje=VIAJE-25
    const viajeParam = params.get('viaje');
    if (viajeParam) {
      setActiveDriverTripId(viajeParam);
    }

    // Check if admin clicked order link: ?manageOrder=POLAR-XXXX
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

    // Check if client opened public portal: ?portal=cliente
    const portalParam = params.get('portal');
    if (portalParam === 'cliente') {
      setShowClientPortal(true);
    }
  }, []);

  const handleOrderCreatedByClient = (newOrder) => {
    const updated = saveOrder(newOrder);
    setOrdersDatabase(updated);
  };

  const handleApproveOrder = (order) => {
    // 1. Assign this exact client order and location to active driver route
    addOrderToActiveTrip(order, 'VIAJE-25');

    // 2. Update status in database
    const updatedOrder = { ...order, status: 'Aprobado y en hoja de ruta' };
    const updatedList = saveOrder(updatedOrder);
    setOrdersDatabase(updatedList);

    // 3. Switch to repartos tab so admin sees it immediately in route & map
    setActiveTab('repartos');
  };

  // 1. If Driver opened their Trip Link (?viaje=VIAJE-25 or clicked open)
  if (activeDriverTripId) {
    return (
      <DriverTripPortal
        tripId={activeDriverTripId}
        onBackToAdmin={() => setActiveDriverTripId(null)}
        onOpenComprobante={(stop) => setComprobanteStop(stop)}
      />
    );
  }

  // 2. If in dedicated Client Public Ordering Portal
  if (showClientPortal) {
    return (
      <ClientPublicPortal
        onOrderCreated={handleOrderCreatedByClient}
        onBackToAdmin={() => setShowClientPortal(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 flex font-sans">
      
      {/* 1. Left Collapsible Sidebar Layout matching user request */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        unreadNotifications={3}
        onOpenPortalCliente={() => setShowClientPortal(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Minimal Utility Header */}
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sistema Polar</span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-[#0c315b] uppercase tracking-wide capitalize">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Desktop vs Celular Chofer */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
              <button
                onClick={() => setViewMode('desktop')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition ${
                  viewMode === 'desktop'
                    ? 'bg-white text-[#0c315b] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('mobile');
                  setActiveTab('repartir');
                }}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition ${
                  viewMode === 'mobile'
                    ? 'bg-[#0c315b] text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Celular Chofer</span>
              </button>
            </div>

            {/* Quick Demo: Open Driver Trip Link as if on phone */}
            <button
              onClick={() => setActiveDriverTripId('VIAJE-25')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0c315b] text-white hover:bg-[#082342] transition shadow-2xs flex items-center space-x-1"
              title="Abrir hoja de ruta del Chofer #25 como en su celular"
            >
              <span>Abrir Link Viaje Chofer 🚚</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 sm:p-6 flex-1">
          
          {viewMode === 'mobile' ? (
            /* Smartphone Mockup Frame */
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-full max-w-[390px] bg-black rounded-[42px] p-3 shadow-2xl border-4 border-gray-800">
                <div className="h-5 flex items-center justify-center mb-1">
                  <div className="w-24 h-4 bg-gray-900 rounded-full flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-800"></div>
                    <div className="w-8 h-1 bg-gray-800 rounded-full"></div>
                  </div>
                </div>

                <div className="bg-[#f9fafb] rounded-[32px] overflow-hidden min-h-[660px] max-h-[720px] overflow-y-auto p-3 text-xs scrollbar-none">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <img src="/images/logo-polar.png" alt="Polar" className="w-6 h-6 object-contain rounded-full" />
                      <span className="font-extrabold text-[#0c315b] text-xs">POLAR</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#0c315b] text-white font-bold text-[10px] flex items-center justify-center">
                      P
                    </div>
                  </div>

                  {activeTab === 'repartir' ? (
                    <Repartir onOpenComprobante={(stop) => setComprobanteStop(stop)} />
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-[#0c315b] text-[11px] font-medium">
                        📱 Vista de celular del repartidor en la calle.
                      </div>
                      {activeTab === 'dashboard' && <Dashboard onNavigateToRepartir={() => setActiveTab('repartir')} />}
                      {activeTab === 'repartos' && <Repartos onOpenDriverTrip={(id) => setActiveDriverTripId(id)} />}
                      {activeTab === 'pedidos' && <Pedidos />}
                      {activeTab === 'clientes' && <Clientes />}
                      {activeTab === 'productos' && <Productos />}
                    </div>
                  )}
                </div>

                <div className="h-4 flex items-center justify-center mt-1">
                  <div className="w-28 h-1 bg-gray-700 rounded-full"></div>
                </div>
              </div>

              <button
                onClick={() => setViewMode('desktop')}
                className="mt-3 px-3 py-1 rounded-lg bg-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-300"
              >
                ← Volver a vista Desktop
              </button>
            </div>
          ) : (
            /* Normal Desktop Views */
            <>
              {activeTab === 'dashboard' && (
                <Dashboard onNavigateToRepartir={() => setActiveTab('repartir')} />
              )}

              {activeTab === 'repartir' && (
                <Repartir onOpenComprobante={(stop) => setComprobanteStop(stop)} />
              )}

              {activeTab === 'repartos' && (
                <Repartos 
                  onSelectRoute={() => setActiveTab('repartir')}
                  onOpenDriverTrip={(id) => setActiveDriverTripId(id)}
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
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-lg mx-auto space-y-3">
                  <div className="w-12 h-12 bg-sky-50 text-[#0c315b] rounded-full flex items-center justify-center mx-auto">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Programa de Referidos Polar</h2>
                  <p className="text-xs text-gray-500">
                    Invitá a otras soderías o repartos a digitalizarse con el sistema y obtené descuentos en tu plan.
                  </p>
                  <div className="p-3 bg-gray-50 rounded-lg border font-mono text-xs text-gray-700">
                    https://polar.reparto.cloud/ref/POLAR-CORDOBA
                  </div>
                </div>
              )}

              {activeTab === 'usuarios' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-base font-bold text-gray-900">Usuarios del Equipo</h2>
                    <span className="text-xs text-gray-500">2 usuarios activos</span>
                  </div>
                  <div className="divide-y divide-gray-100 text-xs">
                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <strong className="text-gray-900 block">Nicolás France (Dueño / Admin)</strong>
                        <span className="text-gray-400">admin@polar.com</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-[#0c315b] font-bold text-[10px]">
                        Administrador
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <strong className="text-gray-900 block">Marcos Gutiérrez (Chofer Camión 1)</strong>
                        <span className="text-gray-400">chofer1@polar.com</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Repartidor
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3.5 px-6 text-xs text-gray-500 flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2">
            <img src="/images/logo-polar.png" alt="Polar" className="w-5 h-5 object-contain rounded-full" />
            <span className="font-bold text-gray-800">Soda y Agua POLAR</span>
          </div>
          <span>Sistema de Repartos y Trazabilidad de Envases</span>
        </footer>

      </div>

      {/* Global Comprobante Modal */}
      {comprobanteStop && (
        <ComprobanteModal 
          stop={comprobanteStop} 
          onClose={() => setComprobanteStop(null)} 
        />
      )}

      {/* Admin Login Gate when opening an order management link */}
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
