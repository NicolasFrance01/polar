export const POLAR_PRODUCTS = [
  {
    id: 'prod-20l',
    name: 'Bidón de Agua de Mesa 20L',
    category: 'Agua',
    size: '20 Litros',
    price: 4200,
    cost: 1100,
    returnable: true,
    containerType: 'bidon_20l',
    image: '/images/bidon-20l.png',
    description: 'Agua purificada de máxima pureza y frescura. Envase de policarbonato reforzado retornable.',
    stockPlanta: 140,
    stockCamion: 45
  },
  {
    id: 'prod-12l',
    name: 'Bidón de Agua de Mesa 12L',
    category: 'Agua',
    size: '12 Litros c/ Canilla',
    price: 3300,
    cost: 850,
    returnable: true,
    containerType: 'bidon_12l',
    image: '/images/bidon-12l.png',
    description: 'Bidón compacto con canilla dosificadora integrada. Ideal para mesadas o familias reducidas.',
    stockPlanta: 95,
    stockCamion: 25
  },
  {
    id: 'prod-soda',
    name: 'Sifón de Soda 1,5 Litros',
    category: 'Soda',
    size: '1.5 Litros (Cajón x 6)',
    price: 1300,
    packPrice: 7500,
    cost: 350,
    returnable: true,
    containerType: 'sifon_15l',
    image: '/images/sifon-1-5l.png',
    description: 'Soda artesanal con gasificado enérgico y pico dosificador de alta presión.',
    stockPlanta: 210,
    stockCamion: 60
  },
  {
    id: 'prod-dispenser',
    name: 'Dispenser Frío / Calor',
    category: 'Equipamiento',
    size: 'Compresor Alto Rendimiento',
    price: 18500,
    subscriptionPlan: 'Plan Abono: Incluye 4 bidones 20L/mes + Servicio técnico',
    returnable: true,
    containerType: 'dispenser_fc',
    image: '/images/dispenser.png',
    description: 'Equipo frío/calor para empresas y hogares. Agua hirviendo para mate/café y helada al instante.',
    stockPlanta: 12,
    stockCamion: 2
  }
];

export const INITIAL_CLIENTS = [
  {
    id: 'cli-001',
    name: 'Familia Rodríguez (María Laura)',
    phone: '5493512345678',
    address: 'Av. Colón 2340, Depto 4B',
    neighborhood: 'Alberdi',
    zone: 'Zona Centro / Oeste',
    deliveryDays: ['Lunes', 'Jueves'],
    containers: {
      bidon_20l: 3,
      bidon_12l: 0,
      sifon_15l: 2,
      dispenser_fc: 0
    },
    balance: 0, // 0 = al día, >0 = debe plata, <0 = saldo a favor
    status: 'activo',
    lastOrderDate: '2026-10-27',
    daysSinceLastOrder: 4,
    frequentOrder: [
      { productId: 'prod-20l', qty: 2 },
      { productId: 'prod-soda', qty: 2 }
    ],
    notes: 'Tocar timbre 4B. Dejar en palier si no está.'
  },
  {
    id: 'cli-002',
    name: 'Taller Mecánico Don Raúl',
    phone: '5493514567890',
    address: 'Castro Barros 1120',
    neighborhood: 'San Martín',
    zone: 'Zona Norte',
    deliveryDays: ['Lunes', 'Miércoles'],
    containers: {
      bidon_20l: 4,
      bidon_12l: 0,
      sifon_15l: 0,
      dispenser_fc: 1
    },
    balance: 8400, // debe $8.400
    status: 'activo',
    lastOrderDate: '2026-10-24',
    daysSinceLastOrder: 7,
    frequentOrder: [
      { productId: 'prod-20l', qty: 3 }
    ],
    notes: 'Pagar con transferencia o efectivo al encargado Mario.'
  },
  {
    id: 'cli-003',
    name: 'Consultorio Dental Nueva Córdoba',
    phone: '5493516789012',
    address: 'Chacabuco 650, Piso 1 Of. 3',
    neighborhood: 'Nueva Córdoba',
    zone: 'Zona Centro / Sur',
    deliveryDays: ['Lunes', 'Jueves'],
    containers: {
      bidon_20l: 6,
      bidon_12l: 0,
      sifon_15l: 0,
      dispenser_fc: 2
    },
    balance: 0,
    status: 'activo',
    lastOrderDate: '2026-10-29',
    daysSinceLastOrder: 2,
    frequentOrder: [
      { productId: 'prod-20l', qty: 4 }
    ],
    notes: 'Horario comercial 9 a 18 hs. Pedir factura B.'
  },
  {
    id: 'cli-004',
    name: 'Panadería La Espiga Dorada',
    phone: '5493518901234',
    address: 'Juan B. Justo 3420',
    neighborhood: 'General Bustos',
    zone: 'Zona Norte',
    deliveryDays: ['Martes', 'Viernes'],
    containers: {
      bidon_20l: 2,
      bidon_12l: 3,
      sifon_15l: 6,
      dispenser_fc: 0
    },
    balance: 4500,
    status: 'activo',
    lastOrderDate: '2026-10-14',
    daysSinceLastOrder: 17, // ALERTA: Retiene envases hace 17 días
    frequentOrder: [
      { productId: 'prod-12l', qty: 2 },
      { productId: 'prod-soda', qty: 6 }
    ],
    notes: 'Entrada por portón de carga lateral.'
  },
  {
    id: 'cli-005',
    name: 'Estudio Jurídico Morales & Asoc.',
    phone: '5493519876543',
    address: '27 de Abril 480, Piso 6',
    neighborhood: 'Centro',
    zone: 'Zona Centro / Oeste',
    deliveryDays: ['Miércoles'],
    containers: {
      bidon_20l: 5,
      bidon_12l: 0,
      sifon_15l: 0,
      dispenser_fc: 1
    },
    balance: 0,
    status: 'inactivo_con_envases',
    lastOrderDate: '2026-09-30',
    daysSinceLastOrder: 31, // CRÍTICO: 31 días sin pedir, retiene 5 bidones y 1 dispenser!
    frequentOrder: [
      { productId: 'prod-20l', qty: 2 }
    ],
    notes: 'Llamar a recepción antes de subir.'
  },
  {
    id: 'cli-006',
    name: 'Gimnasio Fitness Vital',
    phone: '5493513344556',
    address: 'Av. Rafael Núñez 4210',
    neighborhood: 'Cerro de las Rosas',
    zone: 'Zona Norte / Noroeste',
    deliveryDays: ['Lunes', 'Miércoles', 'Viernes'],
    containers: {
      bidon_20l: 8,
      bidon_12l: 0,
      sifon_15l: 0,
      dispenser_fc: 2
    },
    balance: 0,
    status: 'activo',
    lastOrderDate: '2026-10-30',
    daysSinceLastOrder: 1,
    frequentOrder: [
      { productId: 'prod-20l', qty: 5 }
    ],
    notes: 'Dejar junto a la recepción. Paga siempre por transferencia.'
  },
  {
    id: 'cli-007',
    name: 'Hogar Gómez Pereyra',
    phone: '5493515566778',
    address: 'Santa Rosa 1845',
    neighborhood: 'Alberdi',
    zone: 'Zona Centro / Oeste',
    deliveryDays: ['Lunes', 'Jueves'],
    containers: {
      bidon_20l: 2,
      bidon_12l: 2,
      sifon_15l: 4,
      dispenser_fc: 0
    },
    balance: 1300,
    status: 'activo',
    lastOrderDate: '2026-10-28',
    daysSinceLastOrder: 3,
    frequentOrder: [
      { productId: 'prod-12l', qty: 1 },
      { productId: 'prod-soda', qty: 2 }
    ],
    notes: 'Tiene perro bueno, tocar timbre reja.'
  }
];

export const INITIAL_TODAY_ROUTE = [
  {
    stopNumber: 1,
    orderId: 'ORD-101',
    clientId: 'cli-001',
    clientName: 'Familia Rodríguez',
    address: 'Av. Colón 2340, Depto 4B',
    phone: '5493512345678',
    neighborhood: 'Alberdi',
    items: [
      { productId: 'prod-20l', name: 'Bidón 20L', qty: 2, price: 4200 },
      { productId: 'prod-soda', name: 'Sifón Soda 1.5L', qty: 2, price: 1300 }
    ],
    expectedContainersToReturn: {
      bidon_20l: 2,
      sifon_15l: 2
    },
    totalAmount: 11000,
    paymentMethod: 'Efectivo',
    status: 'entregado', // entregado, en_camino, pendiente, ausente
    deliveredAt: '09:25',
    collectedAmount: 11000,
    returnedContainers: {
      bidon_20l: 2,
      sifon_15l: 2
    }
  },
  {
    stopNumber: 2,
    orderId: 'ORD-102',
    clientId: 'cli-007',
    clientName: 'Hogar Gómez Pereyra',
    address: 'Santa Rosa 1845',
    phone: '5493515566778',
    neighborhood: 'Alberdi',
    items: [
      { productId: 'prod-12l', name: 'Bidón 12L c/ canilla', qty: 1, price: 3300 },
      { productId: 'prod-soda', name: 'Sifón Soda 1.5L', qty: 2, price: 1300 }
    ],
    expectedContainersToReturn: {
      bidon_12l: 1,
      sifon_15l: 2
    },
    totalAmount: 5900,
    paymentMethod: 'Transferencia',
    status: 'en_camino',
    deliveredAt: null,
    collectedAmount: 0,
    returnedContainers: {
      bidon_12l: 0,
      sifon_15l: 0
    }
  },
  {
    stopNumber: 3,
    orderId: 'ORD-103',
    clientId: 'cli-003',
    clientName: 'Consultorio Dental Nueva Cba',
    address: 'Chacabuco 650, Piso 1 Of. 3',
    phone: '5493516789012',
    neighborhood: 'Nueva Córdoba',
    items: [
      { productId: 'prod-20l', name: 'Bidón 20L', qty: 4, price: 4200 }
    ],
    expectedContainersToReturn: {
      bidon_20l: 4
    },
    totalAmount: 16800,
    paymentMethod: 'Cuenta Corriente',
    status: 'pendiente',
    deliveredAt: null,
    collectedAmount: 0,
    returnedContainers: {
      bidon_20l: 0
    }
  },
  {
    stopNumber: 4,
    orderId: 'ORD-104',
    clientId: 'cli-002',
    clientName: 'Taller Mecánico Don Raúl',
    address: 'Castro Barros 1120',
    phone: '5493514567890',
    neighborhood: 'San Martín',
    items: [
      { productId: 'prod-20l', name: 'Bidón 20L', qty: 3, price: 4200 }
    ],
    expectedContainersToReturn: {
      bidon_20l: 3
    },
    totalAmount: 12600,
    paymentMethod: 'Efectivo',
    status: 'pendiente',
    deliveredAt: null,
    collectedAmount: 0,
    returnedContainers: {
      bidon_20l: 0
    }
  }
];

export const INITIAL_CASH_SUMMARY = {
  driverName: 'Matías Luján (Camión #2)',
  initialCash: 15000, // fondo inicial para cambio
  cashCollected: 11000,
  transfersCollected: 0,
  creditPending: 0,
  totalSales: 11000,
  pendingStopsCount: 3,
  completedStopsCount: 1
};
