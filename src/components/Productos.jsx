import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Check, Package, RotateCcw } from 'lucide-react';
import { POLAR_PRODUCTS } from '../data/mockData';
import { fetchProducts } from '../services/api';

export default function Productos() {
  const [products, setProducts] = useState(POLAR_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchProducts().then(dbProds => {
      if (Array.isArray(dbProds) && dbProds.length > 0) {
        setProducts(dbProds);
      }
    });
  }, []);

  const handleSavePrice = (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, price: Number(newPrice) || p.price } : p));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
        Productos
      </h1>

      {/* Filter and Add */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="w-full sm:w-80 relative">
            <span className="absolute -top-2 left-2.5 bg-white px-1 text-[11px] text-gray-500 font-medium">
              Buscar producto
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

          <button className="w-full sm:w-auto px-4 py-2.5 bg-[#0c315b] hover:bg-[#082342] text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>Crear Producto</span>
          </button>
        </div>

        {/* Product Cards Grid matching Reparto style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {products
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((prod) => (
              <div 
                key={prod.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-[#0c315b] transition flex flex-col justify-between"
              >
                <div className="h-44 bg-gray-50 flex items-center justify-center p-4 border-b border-gray-100">
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {prod.category}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                        <RotateCcw className="w-3 h-3" />
                        Retornable
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm mt-1">{prod.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{prod.description}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">Precio</span>
                      {editingId === prod.id ? (
                        <div className="flex items-center space-x-1 mt-0.5">
                          <input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-20 px-2 py-0.5 border border-[#0c315b] rounded text-xs font-bold"
                          />
                          <button onClick={() => handleSavePrice(prod.id)} className="p-1 bg-emerald-600 text-white rounded">
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="text-lg font-black text-[#0c315b]">
                            ${prod.price.toLocaleString()}
                          </span>
                          <button 
                            onClick={() => {
                              setEditingId(prod.id);
                              setNewPrice(prod.price.toString());
                            }}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">Stock</span>
                      <span className="font-bold text-xs text-gray-800">{prod.stockPlanta} u.</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

      </div>
    </div>
  );
}
