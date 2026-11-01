# 🐻 Soda y Agua POLAR — Sistema de Repartos & Gestión

Sistema integral de gestión de entregas, hojas de ruta, seguimiento GPS en tiempo real para repartidores, control de envases retornables, fiados y portal público de pedidos para **Soda y Agua POLAR**.

---

## 🚀 Tecnologías

- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons + Leaflet (Mapas Satelitales)
- **Backend / Serverless:** Vercel Serverless Functions (`/api/`)
- **Base de Datos:** PostgreSQL en **Neon** (Pooler habilitado)
- **Sincronización en vivo:** BroadcastChannel + LocalStorage + PostgreSQL REST sync

---

## 📦 Base de Datos (Neon PostgreSQL)

Todas las entidades están modeladas sin hardcodeo en PostgreSQL:
- `products`: Catálogo oficial de agua y soda (Bidones 20L, 12L, Sifones, Dispensers, precios, stock)
- `clients`: Clientes, direcciones, coordenadas GPS, envases en comodato/tenencia y saldo de fiados
- `trips`: Hojas de ruta de los camiones con última ubicación GPS reportada
- `trip_stops`: Paradas asignadas por viaje con orden de visita, estado y cobranzas
- `orders`: Pedidos ingresados desde el portal web o WhatsApp
- `payments`: Registro de cobranzas y cuentas corrientes
- `users`: Credenciales de acceso de administración y choferes

### Inicialización de Tablas

Para crear y poblar automáticamente todas las tablas en la base de datos de Neon:

```bash
npm run db:init
```

---

## ⚙️ Variables de Entorno

Creá un archivo `.env` en la raíz (o configuralo en Vercel Dashboard):

```env
DATABASE_URL=postgresql://neondb_owner:npg_nt9ZgiWLx7ed@ep-wild-dream-b4tt6f0k-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
VITE_API_URL=/api
```

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Inicializar tablas en Neon
npm run db:init

# 3. Iniciar servidor de desarrollo
npm run dev
```

---

## ☁️ Despliegue en Vercel

1. Importá el repositorio desde tu cuenta de GitHub (`NicolasFrance01/polar`).
2. En **Environment Variables**, agregá:
   - `DATABASE_URL`: tu cadena de conexión a Neon PostgreSQL.
3. El archivo `vercel.json` ya está configurado para:
   - Compilar el frontend Vite en `dist/`
   - Enrutar automáticamente `/api/*` a las funciones Serverless que se conectan a Neon.
4. Presioná **Deploy**. ¡Listo!
