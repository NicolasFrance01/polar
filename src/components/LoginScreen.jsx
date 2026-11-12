import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { loginUser } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(username.trim(), password);
      if (data?.token && data?.user) {
        localStorage.setItem('polar_auth_token', data.token);
        localStorage.setItem('polar_auth_user', JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      } else {
        setError('Respuesta inválida del servidor.');
      }
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c315b] via-[#0a2749] to-[#061b33] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden">
        {/* Top brand banner */}
        <div className="bg-gradient-to-r from-[#0c315b] to-[#0284c7] px-6 py-7 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-white p-1 mx-auto shadow-lg border-2 border-sky-200 mb-3">
            <img
              src="/images/logo-polar.png"
              alt="Soda y Agua POLAR"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h1 className="text-xl font-black tracking-tight">Soda y Agua POLAR</h1>
          <p className="text-xs text-sky-100 mt-1 font-medium">
            Sistema de Repartos, Hojas de Ruta y Control de Envases
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0c315b] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Ingreso al Sistema</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Usuario o Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="master"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none focus:border-[#0c315b] focus:ring-2 focus:ring-sky-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none focus:border-[#0c315b] focus:ring-2 focus:ring-sky-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0c315b] hover:bg-[#082342] disabled:opacity-60 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>

          <p className="text-[11px] text-center text-gray-400 pt-1">
            Acceso protegido con credenciales cifradas en base de datos
          </p>
        </form>
      </div>
    </div>
  );
}

