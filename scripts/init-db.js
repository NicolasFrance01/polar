import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  const client = await pool.connect();
  console.log('Connected to Neon PostgreSQL successfully!');

  try {
    await client.query('BEGIN');

    // 1. Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100),
        size VARCHAR(50),
        description TEXT DEFAULT '',
        price NUMERIC(12, 2) NOT NULL,
        pack_price NUMERIC(12, 2),
        cost NUMERIC(12, 2),
        returnable BOOLEAN DEFAULT TRUE,
        container_type VARCHAR(100),
        image TEXT,
        stock_planta INT DEFAULT 100,
        stock_camion INT DEFAULT 30,
        subscription_plan VARCHAR(100),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);

    // 2. Clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50),
        address TEXT NOT NULL,
        neighborhood VARCHAR(100),
        notes TEXT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        containers_held JSONB DEFAULT '{"bidon20L": 0, "bidon12L": 0, "sifon": 0}'::jsonb,
        fiado_balance NUMERIC(12, 2) DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Trips table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(50) PRIMARY KEY,
        trip_number INT NOT NULL,
        driver_name VARCHAR(100) NOT NULL,
        truck VARCHAR(100) NOT NULL,
        driver_phone VARCHAR(50),
        zone VARCHAR(100),
        driver_lat DOUBLE PRECISION,
        driver_lng DOUBLE PRECISION,
        status VARCHAR(50) DEFAULT 'en_curso',
        last_update VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Trip stops table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trip_stops (
        id VARCHAR(50) PRIMARY KEY,
        trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE CASCADE,
        order_number INT NOT NULL,
        order_ref VARCHAR(50),
        client_id VARCHAR(50),
        client_name VARCHAR(150) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(50),
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pendiente',
        is_next BOOLEAN DEFAULT FALSE,
        delivered_at VARCHAR(50),
        payment_method VARCHAR(50) DEFAULT 'Efectivo',
        returned_empty INT DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Orders table (Public client portal & admin orders)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        client_name VARCHAR(150) NOT NULL,
        client_phone VARCHAR(50),
        address TEXT NOT NULL,
        neighborhood VARCHAR(100),
        notes TEXT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pendiente de aprobación',
        trip_id VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Payments / Collections
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(50),
        client_name VARCHAR(150),
        amount NUMERIC(12, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        concept VARCHAR(100),
        date VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Users / Admins / Drivers
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(100) UNIQUE,
        username VARCHAR(100) UNIQUE,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        phone VARCHAR(50),
        password_hash TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;`);
    await client.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL;`).catch(() => {});
    await client.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;`);
    await client.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE trip_stops ADD COLUMN IF NOT EXISTS skip_reason TEXT DEFAULT '';`);

    // Seed Initial Products if empty
    const prodCountRes = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial products...');
      await client.query(`
        INSERT INTO products (id, name, category, size, price, pack_price, cost, returnable, container_type, image, stock_planta, stock_camion, subscription_plan)
        VALUES 
        ('prod-20l', 'Bidón de Agua de Mesa 20L', 'Agua de Mesa', '20L', 4200, 3900, 1800, true, 'Bidón 20L', '/images/bidon-20l.png', 450, 48, 'Plan Clásico 4x mes'),
        ('prod-12l', 'Bidón de Agua 12L con Canilla', 'Agua de Mesa', '12L', 3300, 3100, 1400, true, 'Bidón 12L descartable/retornable', '/images/bidon-12l.png', 280, 24, 'Ideal familias chicas'),
        ('prod-sifon', 'Sifón de Soda 1,5 Litros', 'Soda Retornable', '1.5L', 1300, 1200, 520, true, 'Sifón Clásico Alta Presión', '/images/sifon-1-5l.png', 620, 60, 'Cajón x 6 unidades'),
        ('prod-dispenser', 'Dispenser Natural Frío/Calor POLAR', 'Accesorios y Equipos', 'Eléctrico', 48000, 45000, 32000, false, 'No retornable', '/images/dispenser.png', 35, 2, 'Comodato disponible')
      `);
    }

    // Seed Initial Clients if empty
    const clientCountRes = await client.query('SELECT COUNT(*) FROM clients');
    if (parseInt(clientCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial clients...');
      await client.query(`
        INSERT INTO clients (id, name, phone, address, neighborhood, notes, lat, lng, containers_held, fiado_balance)
        VALUES
        ('cli-1', 'Don Mario Talleres', '5491155550101', 'Loyola 320', 'Alberdi', 'Dejar en recepción', -31.4045, -64.1910, '{"bidon20L": 4, "bidon12L": 0, "sifon": 0}', 0),
        ('cli-2', 'Familia Rossi', '5491155550102', 'Serrano 540', 'Alberdi', 'Tocar timbre blanco', -31.4070, -64.1935, '{"bidon20L": 2, "bidon12L": 0, "sifon": 4}', 0),
        ('cli-3', 'Consultorio Dental Crespo', '5491155550103', 'Corrientes 4800, Piso 2', 'San Martín', 'Horario de 9 a 17hs', -31.3950, -64.1840, '{"bidon20L": 3, "bidon12L": 0, "sifon": 0}', 0),
        ('cli-4', 'Roberto Fernández', '5491155550108', 'Aguirre 750', 'Alberdi', 'Puerta verde', -31.4140, -64.2010, '{"bidon20L": 3, "bidon12L": 0, "sifon": 0}', 0),
        ('cli-5', 'Raúl Medina', '5491155550107', 'Castro Barros 1120', 'San Martín', 'Fiado cuenta corriente', -31.4020, -64.1900, '{"bidon20L": 0, "bidon12L": 2, "sifon": 0}', 6600)
      `);
    }

    // Seed Initial Trips if empty
    const tripCountRes = await client.query('SELECT COUNT(*) FROM trips');
    if (parseInt(tripCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial trips and stops...');
      await client.query(`
        INSERT INTO trips (id, trip_number, driver_name, truck, driver_phone, zone, driver_lat, driver_lng, status, last_update)
        VALUES
        ('VIAJE-25', 25, 'Marcos Gutiérrez', 'Camión #1 (Mercedes Sprinter)', '5491155550100', 'Zona Centro / Alberdi', -31.4089, -64.1956, 'en_curso', '15:40'),
        ('VIAJE-26', 26, 'Sofía Ramos', 'Camión #2 (Renault Master)', '5491155550200', 'Zona Norte / San Martín', -31.3980, -64.1850, 'en_curso', '15:42')
      `);

      // Stops for VIAJE-25
      await client.query(`
        INSERT INTO trip_stops (id, trip_id, order_number, client_id, client_name, address, phone, lat, lng, items, total, status, is_next, delivered_at, payment_method, returned_empty)
        VALUES
        ('stop-1', 'VIAJE-25', 1, 'cli-1', 'Don Mario Talleres', 'Loyola 320, Alberdi', '5491155550101', -31.4045, -64.1910, '[{"name": "Bidón 20L", "qty": 2, "price": 4200}]'::jsonb, 8400, 'entregado', false, '15:20', 'Efectivo', 2),
        ('stop-2', 'VIAJE-25', 2, 'cli-2', 'Familia Rossi', 'Serrano 540, Alberdi', '5491155550102', -31.4070, -64.1935, '[{"name": "Bidón 20L", "qty": 1, "price": 4200}, {"name": "Sifón Soda 1.5L", "qty": 2, "price": 1300}]'::jsonb, 6800, 'entregado', false, '15:35', 'Transferencia', 1),
        ('stop-3', 'VIAJE-25', 3, NULL, 'María Esther López', 'Camargo 460, Alberdi', '5491155550105', -31.4110, -64.1980, '[{"name": "Bidón 20L", "qty": 2, "price": 4200}]'::jsonb, 8400, 'en_camino', true, NULL, 'Efectivo', 0),
        ('stop-4', 'VIAJE-25', 4, 'cli-4', 'Roberto Fernández', 'Aguirre 750, Alberdi', '5491155550108', -31.4140, -64.2010, '[{"name": "Bidón 20L", "qty": 3, "price": 4200}]'::jsonb, 12600, 'pendiente', false, NULL, 'Efectivo', 0)
      `);

      // Stops for VIAJE-26
      await client.query(`
        INSERT INTO trip_stops (id, trip_id, order_number, client_id, client_name, address, phone, lat, lng, items, total, status, is_next, delivered_at, payment_method, returned_empty)
        VALUES
        ('stop-26-1', 'VIAJE-26', 1, NULL, 'Panadería La Espiga', 'Juan B. Justo 3420', '5491155550112', -31.3920, -64.1820, '[{"name": "Bidón 20L", "qty": 4, "price": 4200}]'::jsonb, 16800, 'entregado', false, '15:15', 'Efectivo', 4),
        ('stop-26-2', 'VIAJE-26', 2, 'cli-3', 'Consultorio Dental Crespo', 'Corrientes 4800, Piso 2', '5491155550103', -31.3950, -64.1840, '[{"name": "Bidón 20L", "qty": 3, "price": 4200}]'::jsonb, 12600, 'entregado', false, '15:40', 'Transferencia', 3),
        ('stop-26-3', 'VIAJE-26', 3, NULL, 'Rubén Álvarez', 'Vera 620, San Martín', '5491155550106', -31.3990, -64.1880, '[{"name": "Bidón 20L", "qty": 3, "price": 4200}]'::jsonb, 12600, 'en_camino', true, NULL, 'Efectivo', 0),
        ('stop-26-4', 'VIAJE-26', 4, 'cli-5', 'Raúl Medina', 'Castro Barros 1120', '5491155550107', -31.4020, -64.1900, '[{"name": "Bidón 12L c/ canilla", "qty": 2, "price": 3300}]'::jsonb, 6600, 'pendiente', false, NULL, 'Fiado (Cta Cte)', 0)
      `);
    }

    // Seed master user with encrypted password (Ndf010399@)
    const masterHash = hashPassword('Ndf010399@');
    const driverHash = hashPassword('polar123');
    await client.query(
      `INSERT INTO users (id, username, email, name, role, phone, password_hash, active)
       VALUES ('usr-master', 'master', 'master@polar.com', 'Master Admin', 'admin', '5493512345678', $1, true)
       ON CONFLICT (id) DO UPDATE SET username = 'master', password_hash = EXCLUDED.password_hash`,
      [masterHash]
    );
    await client.query(
      `INSERT INTO users (id, username, email, name, role, phone, password_hash, active)
       VALUES
       ('usr-marcos', 'marcos', 'chofer1@polar.com', 'Marcos Gutiérrez', 'repartidor', '5491155550100', $1, true),
       ('usr-sofia', 'sofia', 'chofer2@polar.com', 'Sofía Ramos', 'repartidor', '5491155550200', $1, true)
       ON CONFLICT (id) DO NOTHING`,
      [driverHash]
    );

    await client.query('COMMIT');
    console.log('Database initialization completed successfully! All tables and seed data created.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during database initialization:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDB().catch(() => process.exit(1));
