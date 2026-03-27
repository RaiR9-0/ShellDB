import { Resend } from "resend"

const RESEND_API_KEY = process.env.RESEND_API_KEY || ""
const SENDER_EMAIL   = process.env.RESEND_SENDER_EMAIL || "alertas@shelldb.app"
const SENDER_NAME    = process.env.RESEND_SENDER_NAME  || "ShellDB Alertas"

function getClient() {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY no configurado en variables de entorno")
  return new Resend(RESEND_API_KEY)
}

// ─── Plantilla base HTML ──────────────────────────────────────────────────────
function htmlBase(title: string, color: string, icon: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#E9D173;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#E9D173;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FCF3CF;border-radius:16px;border:1.5px solid #D4A017;overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr><td style="background:${color};padding:24px 32px;">
          <table width="100%"><tr>
            <td>
              <span style="font-size:28px;">${icon}</span>
              <span style="color:white;font-size:20px;font-weight:900;margin-left:10px;vertical-align:middle;">ShellDB</span>
            </td>
            <td align="right">
              <span style="background:rgba(255,255,255,0.2);color:white;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;">ALERTA</span>
            </td>
          </tr></table>
        </td></tr>
        <!-- Title -->
        <tr><td style="padding:24px 32px 8px;">
          <h1 style="margin:0;font-size:20px;font-weight:900;color:#2C3E50;">${title}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:8px 32px 24px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#FFF8DC;padding:16px 32px;border-top:1px solid #D4A01730;">
          <p style="margin:0;font-size:11px;color:#9B7D3A;font-family:monospace;">
            ShellDB · Sistema de Gestión de Abarrotes · Este es un correo automático, no respondas a este mensaje.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#6B7280;width:140px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#2C3E50;font-weight:700;">${value}</td>
  </tr>`
}

function table(...rows: string[]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8DC;border-radius:10px;padding:16px;border:1px solid #D4A01730;margin-top:12px;">
    ${rows.join("")}
  </table>`
}

function badge(text: string, color: string) {
  return `<span style="background:${color}20;color:${color};border:1px solid ${color}40;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${text}</span>`
}

// =============================================================================
//  FUNCIÓN PRINCIPAL DE ENVÍO (Resend)
// =============================================================================
async function sendMail(to: string, subject: string, html: string, text: string) {
  const resend = getClient()
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to:      [to],
    subject,
    html,
    text,
  })
}

// =============================================================================
//  1. VERIFICACIÓN DE EMAIL AL REGISTRARSE
// =============================================================================
export async function sendVerificationEmail(to: string, username: string, code: string) {
  const body = `
    <p style="color:#2C3E50;font-size:14px;margin:0 0 16px;">
      Hola <strong>${username}</strong>, gracias por registrarte en ShellDB.<br>
      Ingresa el siguiente código para verificar tu correo electrónico:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="background:#B8860B;color:white;font-size:36px;font-weight:900;
        letter-spacing:12px;padding:16px 32px;border-radius:12px;font-family:monospace;">
        ${code}
      </span>
    </div>
    <p style="color:#6B7280;font-size:12px;text-align:center;margin:0;">
      Este código expira en <strong>15 minutos</strong>. Si no solicitaste esto, ignora este correo.
    </p>`

  await sendMail(
    to,
    "ShellDB — Verifica tu correo electrónico",
    htmlBase("Verifica tu correo", "#B8860B", "📧", body),
    `Tu código de verificación ShellDB es: ${code} (expira en 15 min)`,
  )
}

// =============================================================================
//  2. BIENVENIDA TRAS REGISTRO EXITOSO
// =============================================================================
export async function sendWelcomeEmail(to: string, username: string, dbName: string) {
  const body = `
    <p style="color:#2C3E50;font-size:14px;margin:0 0 12px;">
      ¡Tu cuenta ha sido creada exitosamente! Ya puedes acceder a tu panel de administración.
    </p>
    ${table(
      row("Usuario", username),
      row("Base de datos", dbName),
      row("Fecha de registro", new Date().toLocaleString("es-MX")),
    )}
    <p style="color:#6B7280;font-size:12px;margin:16px 0 0;">
      Guarda esta información en un lugar seguro.
    </p>`

  await sendMail(
    to,
    "ShellDB — ¡Bienvenido al sistema!",
    htmlBase("¡Bienvenido a ShellDB!", "#27AE60", "🎉", body),
    `Bienvenido ${username}. Tu BD es: ${dbName}`,
  )
}

// =============================================================================
//  3. INTENTO FALLIDO DE LOGIN (usuario normal)
// =============================================================================
export async function sendLoginFailAlert(to: string, username: string, ip: string, ua: string, motivo: string) {
  const body = `
    <p style="color:#2C3E50;font-size:14px;margin:0 0 12px;">
      Se detectó un intento de inicio de sesión fallido en tu cuenta.
      Si fuiste tú, puedes ignorar este mensaje. Si no reconoces este intento, cambia tu contraseña inmediatamente.
    </p>
    ${table(
      row("Usuario",    username),
      row("IP",         ip),
      row("Motivo",     motivo.replace(/_/g, " ")),
      row("Fecha",      new Date().toLocaleString("es-MX")),
      row("Navegador",  ua.slice(0, 60) + (ua.length > 60 ? "..." : "")),
    )}`

  await sendMail(
    to,
    "⚠️ ShellDB — Intento de acceso fallido en tu cuenta",
    htmlBase("Intento de acceso fallido", "#E67E22", "⚠️", body),
    `Intento fallido de login para ${username} desde IP ${ip}`,
  )
}

// =============================================================================
//  4. ALERTA DE STOCK BAJO
// =============================================================================
export async function sendLowStockAlert(
  to: string,
  username: string,
  productos: { nombre: string; codigo: string; stock: number; minimo: number; sucursal: string }[]
) {
  const filas = productos.map(p => `
    <tr style="border-bottom:1px solid #D4A01720;">
      <td style="padding:8px 4px;font-size:13px;color:#2C3E50;font-weight:700;">${p.nombre}</td>
      <td style="padding:8px 4px;font-size:12px;color:#6B7280;font-family:monospace;">${p.codigo}</td>
      <td style="padding:8px 4px;text-align:center;">${badge(String(p.stock === 0 ? "SIN STOCK" : p.stock), p.stock === 0 ? "#E74C3C" : "#E67E22")}</td>
      <td style="padding:8px 4px;text-align:center;font-size:12px;color:#6B7280;">${p.minimo}</td>
      <td style="padding:8px 4px;font-size:12px;color:#6B7280;">${p.sucursal}</td>
    </tr>`).join("")

  const body = `
    <p style="color:#2C3E50;font-size:14px;margin:0 0 12px;">
      Los siguientes <strong>${productos.length} producto(s)</strong> de tu tienda tienen stock bajo o agotado:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8DC;border-radius:10px;border:1px solid #D4A01730;overflow:hidden;">
      <thead>
        <tr style="background:#FCF3CF;border-bottom:2px solid #D4A017;">
          <th style="padding:10px 4px;font-size:11px;color:#6B7280;text-align:left;">PRODUCTO</th>
          <th style="padding:10px 4px;font-size:11px;color:#6B7280;text-align:left;">CÓDIGO</th>
          <th style="padding:10px 4px;font-size:11px;color:#6B7280;text-align:center;">STOCK</th>
          <th style="padding:10px 4px;font-size:11px;color:#6B7280;text-align:center;">MÍNIMO</th>
          <th style="padding:10px 4px;font-size:11px;color:#6B7280;text-align:left;">SUCURSAL</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <p style="color:#6B7280;font-size:12px;margin:16px 0 0;">
      Accede a tu panel → <strong>Compras → Nueva Compra</strong> para reabastecer.
    </p>`

  await sendMail(
    to,
    `📦 ShellDB — ${productos.length} producto(s) con stock bajo`,
    htmlBase(`Stock bajo — ${productos.length} producto(s)`, "#E67E22", "📦", body),
    `${productos.length} productos con stock bajo: ${productos.map(p => p.nombre).join(", ")}`,
  )
}

// =============================================================================
//  5. COMPRA REGISTRADA
// =============================================================================
export async function sendCompraAlert(
  to: string,
  username: string,
  compraId: string,
  sucursal: string,
  proveedor: string,
  items: { nombre: string; cantidad: number; precio: number; subtotal: number }[],
  total: number
) {
  const filas = items.map(i => `
    <tr style="border-bottom:1px solid #D4A01720;">
      <td style="padding:7px 4px;font-size:13px;color:#2C3E50;">${i.nombre}</td>
      <td style="padding:7px 4px;text-align:center;font-size:13px;color:#6B7280;">${i.cantidad}</td>
      <td style="padding:7px 4px;text-align:right;font-size:13px;color:#6B7280;">$${i.precio.toFixed(2)}</td>
      <td style="padding:7px 4px;text-align:right;font-size:13px;font-weight:700;color:#B8860B;">$${i.subtotal.toFixed(2)}</td>
    </tr>`).join("")

  const body = `
    <p style="color:#2C3E50;font-size:14px;margin:0 0 12px;">
      Se registró una nueva compra en tu sistema.
    </p>
    ${table(
      row("ID Compra",  `#${compraId.slice(-8).toUpperCase()}`),
      row("Sucursal",   sucursal),
      row("Proveedor",  proveedor),
      row("Fecha",      new Date().toLocaleString("es-MX")),
    )}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8DC;border-radius:10px;border:1px solid #D4A01730;overflow:hidden;margin-top:12px;">
      <thead>
        <tr style="background:#FCF3CF;border-bottom:2px solid #D4A017;">
          <th style="padding:8px 4px;font-size:11px;color:#6B7280;text-align:left;">PRODUCTO</th>
          <th style="padding:8px 4px;font-size:11px;color:#6B7280;text-align:center;">CANT.</th>
          <th style="padding:8px 4px;font-size:11px;color:#6B7280;text-align:right;">P.U.</th>
          <th style="padding:8px 4px;font-size:11px;color:#6B7280;text-align:right;">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr style="border-top:2px solid #D4A017;">
          <td colspan="3" style="padding:10px 4px;font-size:14px;font-weight:900;color:#2C3E50;text-align:right;">TOTAL:</td>
          <td style="padding:10px 4px;font-size:16px;font-weight:900;color:#B8860B;text-align:right;">$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>`

  await sendMail(
    to,
    `📦 ShellDB — Nueva compra registrada $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    htmlBase("Nueva compra registrada", "#3498DB", "📦", body),
    `Compra #${compraId.slice(-8).toUpperCase()} · ${proveedor} · Total: $${total.toFixed(2)}`,
  )
}

// =============================================================================
//  6. VENTA REGISTRADA
// =============================================================================
export async function sendVentaAlert(
  to: string,
  username: string,
  ventaId: string,
  sucursal: string,
  empleado: string,
  total: number,
  itemsCount: number
) {
  const body = `
    <p style="color:#2C3E50;font-size:14px;margin:0 0 12px;">
      Se procesó una nueva venta en tu tienda.
    </p>
    ${table(
      row("ID Venta",   `#${ventaId.slice(-8).toUpperCase()}`),
      row("Sucursal",   sucursal),
      row("Empleado",   empleado),
      row("Productos",  `${itemsCount} artículo(s)`),
      row("Total",      `$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`),
      row("Fecha",      new Date().toLocaleString("es-MX")),
    )}`

  await sendMail(
    to,
    `🧾 ShellDB — Venta procesada $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    htmlBase("Venta procesada", "#27AE60", "🧾", body),
    `Venta #${ventaId.slice(-8).toUpperCase()} · ${empleado} · Total: $${total.toFixed(2)}`,
  )
}

// =============================================================================
//  7. INTENTO FALLIDO DE EMPLEADO (clave incorrecta al vender)
// =============================================================================
export async function sendEmpleadoFailAlert(
  to: string,
  username: string,
  empleadoCodigo: string,
  empleadoNombre: string,
  sucursal: string,
  motivo: string
) {
  const body = `
    <p style="color:#2C3E50;font-size:14px;margin:0 0 12px;">
      Un empleado intentó procesar una venta con credenciales incorrectas.
    </p>
    ${table(
      row("Empleado",  empleadoNombre || empleadoCodigo),
      row("Código",    empleadoCodigo),
      row("Sucursal",  sucursal),
      row("Motivo",    motivo.replace(/_/g, " ")),
      row("Fecha",     new Date().toLocaleString("es-MX")),
    )}`

  await sendMail(
    to,
    "🔐 ShellDB — Intento fallido de empleado al registrar venta",
    htmlBase("Intento fallido de empleado", "#E74C3C", "🔐", body),
    `Empleado ${empleadoCodigo} intentó vender con credenciales incorrectas en ${sucursal}`,
  )
}

// =============================================================================
//  HELPER: obtener email del dueño de la tienda desde la BD proyecto
// =============================================================================
export async function getOwnerEmail(userDbName: string): Promise<string | null> {
  try {
    const { getProjectDb } = await import("@/lib/mongodb")
    const db = await getProjectDb()
    const user = await db.collection("users").findOne({ database_name: userDbName })
    return user?.email || null
  } catch {
    return null
  }
}

// =============================================================================
//  HELPER: obtener productos con stock bajo de una sucursal
// =============================================================================
export async function getLowStockProducts(db: import("mongodb").Db, sucursalCodigo: string) {
  const productos = await db.collection("productos").find({ activo: true }).toArray()
  const sucursal  = await db.collection("sucursales").findOne({ codigo: sucursalCodigo })
  const sucursalNombre = sucursal?.nombre || sucursalCodigo

  return productos
    .filter(p => {
      const stock  = (p.stock_por_sucursal as Record<string, number>)?.[sucursalCodigo] ?? 0
      const minimo = (p.stock_minimo as number) ?? 10
      return stock <= minimo
    })
    .map(p => ({
      nombre:   p.nombre as string,
      codigo:   p.codigo as string,
      stock:    (p.stock_por_sucursal as Record<string, number>)?.[sucursalCodigo] ?? 0,
      minimo:   (p.stock_minimo as number) ?? 10,
      sucursal: sucursalNombre,
    }))
}
