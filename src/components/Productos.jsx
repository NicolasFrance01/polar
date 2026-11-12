import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, RotateCcw, X, Upload, Loader2, Image as ImageIcon, Check 
} from 'lucide-react';
import { POLAR_PRODUCTS } from '../data/mockData';
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  uploadProductImage 
} from '../services/api';

const EMPTY_FORM = {
  id: '',
  name: '',
  category: 'Agua de Mesa',
  size: '',
  description: '',
  price: '',
  packPrice: '',
  cost: '',
  stockPlanta: 100,
  stockCamion: 20,
  returnable: true,
  containerType: '',
  subscriptionPlan: '',
  image: '/images/bidon-20l.png'
};

export default function Productos() {
  const [products, setProducts] = useState(POLAR_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadProducts = async () => {
    const dbProds = await fetchProducts();
    if (Array.isArray(dbProds) && dbProds.length > 0) {
      setProducts(dbProds);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setForm({ ...EMPTY_FORM });
    setFeedback('');
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setIsEditing(true);
    setForm({
      id: prod.id,
      name: prod.name || '',
      category: prod.category || 'Agua de Mesa',
      size: prod.size || '',
      description: prod.description || '',
      price: prod.price ?? '',
      packPrice: prod.packPrice ?? prod.pack_price ?? '',
      cost: prod.cost ?? '',
      stockPlanta: prod.stockPlanta ?? prod.stock_planta ?? 0,
      stockCamion: prod.stockCamion ?? prod.stock_camion ?? 0,
      returnable: prod.returnable ?? true,
      containerType: prod.containerType ?? prod.container_type ?? '',
      subscriptionPlan: prod.subscriptionPlan ?? prod.subscription_plan ?? '',
      image: prod.image || '/images/bidon-20l.png'
    });
    setFeedback('');
    setModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFeedback('');
    try {
      const blobUrl = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, image: blobUrl }));
      setFeedback('Imagen subida a Vercel Blob correctamente.');
    } catch (err) {
      setFeedback(`Error al subir imagen: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setFeedback('');
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        size: form.size.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        packPrice: form.packPrice !== '' ? Number(form.packPrice) : null,
        cost: form.cost !== '' ? Number(form.cost) : null,
        stockPlanta: Number(form.stockPlanta) || 0,
        stockCamion: Number(form.stockCamion) || 0,
        returnable: Boolean(form.returnable),
        containerType: form.containerType.trim(),
        subscriptionPlan: form.subscriptionPlan.trim(),
        image: form.image.trim() || '/images/bidon-20l.png'
      };

      if (isEditing && form.id) {
        const updated = await updateProduct(form.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === form.id ? updated : p)));
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      setFeedback(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`¿Eliminar "${prod.name}" del catálogo?`)) return;
    try {
      await deleteProduct(prod.id);
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center tracking-tight">
        Productos
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="w-full sm:w-80 relative">
            <span className="absolute -top-2 left-2.5 bg-white px-1 text-[11px] text-gray-500 font-medium z-10">
              Buscar producto
            </span>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Bidón, sifón, dispenser..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-800 focus:border-[#0c315b] outline-none"
              />
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0c315b] hover:bg-[#082342] text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Producto</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {products
            .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((prod) => (
              <div
                key={prod.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-[#0c315b] transition flex flex-col justify-between"
              >
                <div className="h-44 bg-gray-50 flex items-center justify-center p-4 border-b border-gray-100 relative group">
                  <img
                    src={prod.image || '/images/bidon-20l.png'}
                    alt={prod.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    onClick={() => openEditModal(prod)}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-white/95 border border-gray-200 shadow-xs text-[11px] font-bold text-[#0c315b] hover:bg-[#0c315b] hover:text-white transition flex items-center gap-1"
                    title="Modificar producto, descripción e imagen"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 truncate">
                        {prod.category}
                      </span>
                      {prod.returnable && (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 flex-shrink-0">
                          <RotateCcw className="w-3 h-3" />
                          Retornable
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm mt-1.5">{prod.name}</h3>
                    {prod.size && (
                      <span className="text-[11px] font-semibold text-gray-400 block">{prod.size}</span>
                    )}
                    <p className="text-xs text-gray-500 line-clamp-3 mt-1">
                      {prod.description || prod.subscriptionPlan || 'Sin descripción cargada.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">Precio</span>
                      <span className="text-lg font-black text-[#0c315b]">
                        ${Number(prod.price || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">Stock</span>
                        <span className="font-bold text-xs text-gray-800">
                          {prod.stockPlanta ?? prod.stock_planta ?? 0} u.
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(prod)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-gray-900">
                {isEditing ? 'Modificar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {/* Image Preview + Vercel Blob Uploader */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                <label className="font-bold text-gray-700 block">Imagen del Producto (Vercel Blob)</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-24 h-24 rounded-xl bg-white border border-gray-200 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                    {form.image ? (
                      <img src={form.image} alt="Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="w-full py-2 px-3 rounded-lg bg-[#0c315b] hover:bg-[#082342] text-white font-bold cursor-pointer flex items-center justify-center space-x-1.5 transition shadow-2xs">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Subir Imagen desde Dispositivo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="O pegá una URL de imagen..."
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-[11px] bg-white outline-none focus:border-[#0c315b]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Bidón de Agua 20L"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Agua de Mesa / Soda / Accesorios"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Presentación / Tamaño</label>
                  <input
                    type="text"
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    placeholder="20L / 1.5L"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Precio Venta ($) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold outline-none focus:border-[#0c315b]"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-gray-700 block mb-1">Stock Planta</label>
                  <input
                    type="number"
                    value={form.stockPlanta}
                    onChange={(e) => setForm({ ...form, stockPlanta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descripción del Producto</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalle del producto visible para clientes y sistema..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Plan / Promo (opcional)</label>
                  <input
                    type="text"
                    value={form.subscriptionPlan}
                    onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })}
                    placeholder="Ej: Plan Clásico 4x mes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#0c315b]"
                  />
                </div>

                <label className="flex items-center space-x-2 cursor-pointer pt-2 sm:pt-5">
                  <input
                    type="checkbox"
                    checked={form.returnable}
                    onChange={(e) => setForm({ ...form, returnable: e.target.checked })}
                    className="rounded text-[#0c315b]"
                  />
                  <span className="font-bold text-gray-700">Envase Retornable</span>
                </label>
              </div>

              {feedback && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                  feedback.includes('Error') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {feedback}
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 bg-[#0c315b] hover:bg-[#082342] disabled:opacity-60 text-white font-bold rounded-lg flex items-center space-x-1.5 shadow-xs"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
