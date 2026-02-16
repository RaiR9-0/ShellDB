import { getClient, getProjectDb } from "./mongodb"

export async function setupActivationCodes() {
  const db = await getProjectDb()
  const col = db.collection("activation_codes")
  const count = await col.countDocuments()
  if (count > 0) return

  await col.insertMany([
    { code: "ACT001", used: false, used_by: null, used_at: null },
    { code: "ACT002", used: false, used_by: null, used_at: null },
    { code: "ACT003", used: false, used_by: null, used_at: null },
    { code: "DEMO2024", used: false, used_by: null, used_at: null },
    { code: "TIENDA001", used: false, used_by: null, used_at: null },
  ])
}

export async function createUserDatabase(username: string): Promise<string> {
  const dbName = `tienda_${username.toLowerCase().replace(/\s+/g, "_")}`
  const client = await getClient()
  const db = client.db(dbName)

  // --- Sucursales ---
  const sucursales = db.collection("sucursales")
  if ((await sucursales.countDocuments()) === 0) {
    await sucursales.insertMany([
      {
        codigo: "SUC001",
        nombre: "Sucursal Central",
        direccion: "Av. Principal #100",
        telefono: "555-0001",
        activa: true,
      },
      {
        codigo: "SUC002",
        nombre: "Sucursal Norte",
        direccion: "Blvd. Norte #200",
        telefono: "555-0002",
        activa: true,
      },
    ])
  }

  // --- Categorias ---
  const categorias = db.collection("categorias")
  if ((await categorias.countDocuments()) === 0) {
    await categorias.insertMany([
      { codigo: "CAT001", nombre: "Bebidas", descripcion: "Refrescos, jugos, agua" },
      { codigo: "CAT002", nombre: "Lacteos", descripcion: "Leche, queso, yogurt" },
      { codigo: "CAT003", nombre: "Abarrotes", descripcion: "Arroz, frijol, aceite" },
      { codigo: "CAT004", nombre: "Snacks", descripcion: "Papas, galletas, dulces" },
      { codigo: "CAT005", nombre: "Limpieza", descripcion: "Jabon, detergente, cloro" },
    ])
  }

  // --- Productos ---
  const productos = db.collection("productos")
  if ((await productos.countDocuments()) === 0) {
    await productos.insertMany([
      {
        codigo: "PROD001",
        nombre: "Coca-Cola 600ml",
        categoria_codigo: "CAT001",
        precio_compra: 10.0,
        precio_venta: 18.0,
        stock_por_sucursal: { SUC001: 100, SUC002: 80 },
        stock_minimo: 20,
        activo: true,
      },
      {
        codigo: "PROD002",
        nombre: "Leche Entera 1L",
        categoria_codigo: "CAT002",
        precio_compra: 18.0,
        precio_venta: 28.0,
        stock_por_sucursal: { SUC001: 50, SUC002: 40 },
        stock_minimo: 15,
        activo: true,
      },
      {
        codigo: "PROD003",
        nombre: "Arroz 1kg",
        categoria_codigo: "CAT003",
        precio_compra: 20.0,
        precio_venta: 35.0,
        stock_por_sucursal: { SUC001: 60, SUC002: 45 },
        stock_minimo: 10,
        activo: true,
      },
      {
        codigo: "PROD004",
        nombre: "Papas Sabritas",
        categoria_codigo: "CAT004",
        precio_compra: 12.0,
        precio_venta: 22.0,
        stock_por_sucursal: { SUC001: 80, SUC002: 60 },
        stock_minimo: 25,
        activo: true,
      },
      {
        codigo: "PROD005",
        nombre: "Jabon Zote",
        categoria_codigo: "CAT005",
        precio_compra: 8.0,
        precio_venta: 15.0,
        stock_por_sucursal: { SUC001: 40, SUC002: 30 },
        stock_minimo: 10,
        activo: true,
      },
      {
        codigo: "PROD006",
        nombre: "Frijol Negro 1kg",
        categoria_codigo: "CAT003",
        precio_compra: 25.0,
        precio_venta: 40.0,
        stock_por_sucursal: { SUC001: 35, SUC002: 28 },
        stock_minimo: 10,
        activo: true,
      },
      {
        codigo: "PROD007",
        nombre: "Agua Natural 1L",
        categoria_codigo: "CAT001",
        precio_compra: 5.0,
        precio_venta: 12.0,
        stock_por_sucursal: { SUC001: 150, SUC002: 120 },
        stock_minimo: 30,
        activo: true,
      },
      {
        codigo: "PROD008",
        nombre: "Galletas Marias",
        categoria_codigo: "CAT004",
        precio_compra: 15.0,
        precio_venta: 25.0,
        stock_por_sucursal: { SUC001: 45, SUC002: 35 },
        stock_minimo: 15,
        activo: true,
      },
    ])
  }

  // --- Empleados ---
  const empleados = db.collection("empleados")
  if ((await empleados.countDocuments()) === 0) {
    await empleados.insertMany([
      {
        codigo: "EMP001",
        nombre: "Juan Perez",
        puesto: "Cajero",
        sucursal_codigo: "SUC001",
        telefono: "555-1001",
        salario: 8000,
        activo: true,
      },
      {
        codigo: "EMP002",
        nombre: "Maria Garcia",
        puesto: "Gerente",
        sucursal_codigo: "SUC001",
        telefono: "555-1002",
        salario: 15000,
        activo: true,
      },
      {
        codigo: "EMP003",
        nombre: "Carlos Lopez",
        puesto: "Cajero",
        sucursal_codigo: "SUC002",
        telefono: "555-1003",
        salario: 8000,
        activo: true,
      },
    ])
  }

  // --- Proveedores ---
  const proveedores = db.collection("proveedores")
  if ((await proveedores.countDocuments()) === 0) {
    await proveedores.insertMany([
      {
        codigo: "PROV001",
        nombre: "Distribuidora del Norte",
        contacto: "Luis Ramirez",
        telefono: "555-2001",
        email: "norte@dist.com",
        activo: true,
      },
      {
        codigo: "PROV002",
        nombre: "Abarrotes Mayoreo SA",
        contacto: "Ana Torres",
        telefono: "555-2002",
        email: "mayoreo@abr.com",
        activo: true,
      },
    ])
  }

  return dbName
}
