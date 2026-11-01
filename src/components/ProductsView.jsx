import React, { useState } from 'react';
import { 
  Package, 
  DollarSign, 
  Plus, 
  Edit2, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Layers, 
  TrendingUp,
  Truck
} from 'lucide-react';
import { POLAR_PRODUCTS } from '../data/mockData';

export default function ProductsView() {
  const [products, setProducts] = useState(POLAR_PRODUCTS);
  const [editingId, setEditingId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  const handleEditPrice = (prod) => {
    setEditingId(prod.id);
    setTempPrice(prod.price.toString());
  };

  const handleSavePrice = (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, price: Number(tempPrice) || p.price } : p));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Catálogo Oficial Soda y Agua POLAR</h2>
          <p className="text-xs text-slate-500">
            Administración de precios, márgenes de ganancia y stock en planta vs en camión.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 font-bold border border-sky-200">
            4 Líneas de Productos
          </span>
        </div>
      </div>

      {/* Grid of Polar Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((prod) => {
          const margin = prod.price - prod.cost;
          const marginPercent = Math.round((margin / prod.price) * 100);

          return (
            <div 
              key={prod.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Image and basic info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                  <div className="w-32 h-36 bg-slate-50 rounded-2xl p-2 border border-slate-100 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wide">
                      {prod.category} · {prod.size}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {prod.description}
                    </p>
                    {prod.subscriptionPlan && (
                      <p className="text-xs font-semibold text-sky-700 bg-sky-50 p-2 rounded-xl border border-sky-200/60 mt-1">
                        ⭐ {prod.subscriptionPlan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stock distribution */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Depósito Central</span>
                    <strong className="text-slate-900 font-extrabold text-sm">{prod.stockPlanta} unidades</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                      <Truck className="w-3 h-3 text-sky-600" />
                      Cargado en Camión
                    </span>
                    <strong className="text-sky-700 font-extrabold text-sm">{prod.stockCamion} unidades</strong>
                  </div>
                </div>
              </div>

              {/* Price and Profit Margin */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Precio de Venta
                  </span>
                  {editingId === prod.id ? (
                    <div className="flex items-center space-x-1 mt-1">
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="w-24 px-2 py-1 rounded-lg border border-sky-500 font-black text-sm outline-none"
                      />
                      <button
                        onClick={() => handleSavePrice(prod.id)}
                        className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-2xl font-black text-slate-900">
                        ${prod.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleEditPrice(prod)}
                        className="p-1 text-slate-400 hover:text-sky-600 transition"
                        title="Modificar precio"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Margen Estimado
                  </span>
                  <span className="inline-flex items-center text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {marginPercent}% (+${margin.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
