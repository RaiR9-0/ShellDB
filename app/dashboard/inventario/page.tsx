"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpCircle, ArrowDownCircle, Search, RefreshCcw } from "lucide-react"

interface Movimiento {
  _id: string
  producto_codigo: string
  producto_nombre?: string
  sucursal_codigo: string
  tipo: string
  cantidad: number
  motivo: string
  referencia?: string
  fecha: string
  usuario?: string
}

interface Producto {
  codigo: string
  nombre: string
  stock_por_sucursal: Record<string, number>
  stock_minimo: number
}

export default function InventarioPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [sucursal, setSucursal] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const suc = sucursal || "SUC001"
      const [movRes, prodRes] = await Promise.all([
        fetch(`/api/inventario?sucursal=${suc}&tipo=${filtroTipo}`),
        fetch(`/api/productos?sucursal=${suc}`)
      ])
      if (movRes.ok) {
        const movData = await movRes.json()
        setMovimientos(movData)
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProductos(prodData)
      }
    } catch (err) {
      console.error("Error fetching inventario:", err)
    } finally {
      setLoading(false)
    }
  }, [sucursal, filtroTipo])

  useEffect(() => {
    const getSucursal = async () => {
      try {
        const res = await fetch("/api/sucursales")
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0 && !sucursal) {
            setSucursal(data[0].codigo)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    getSucursal()
  }, [sucursal])

  useEffect(() => {
    if (sucursal) fetchData()
  }, [sucursal, filtroTipo, fetchData])

  const productosFiltrados = productos.filter(p => {
    if (!busqueda) return true
    return p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  })

  const getStockColor = (stock: number, minimo: number) => {
    if (stock <= 0) return "text-red-600 font-bold"
    if (stock <= minimo) return "text-orange-500 font-semibold"
    return "text-green-600"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Inventario</h1>
          <p className="text-sm text-white/80">Control de stock y movimientos</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-white text-white hover:bg-white/20 cursor-pointer">
          <RefreshCcw className="w-4 h-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* Stock actual por producto */}
      <Card className="border-[#D4A017]">
        <CardHeader className="bg-[#B8860B] rounded-t-lg">
          <CardTitle className="text-white text-lg">Stock Actual - Sucursal {sucursal}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B]" />
              <Input
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-10 border-[#D4A017] focus-visible:ring-[#B8860B]"
              />
            </div>
          </div>

          <div className="rounded-md border border-[#D4A017] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#E9D173] hover:bg-[#E9D173]">
                  <TableHead className="text-[#2C3E50] font-bold">Codigo</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold">Producto</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold text-center">Stock Actual</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold text-center">Stock Minimo</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Cargando inventario...
                    </TableCell>
                  </TableRow>
                ) : productosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  productosFiltrados.map((prod, i) => {
                    const stock = prod.stock_por_sucursal?.[sucursal] ?? 0
                    const minimo = prod.stock_minimo || 10
                    return (
                      <TableRow key={prod.codigo} className={i % 2 === 0 ? "bg-white" : "bg-[#FDF5E6]"}>
                        <TableCell className="font-mono text-sm">{prod.codigo}</TableCell>
                        <TableCell className="font-medium">{prod.nombre}</TableCell>
                        <TableCell className={`text-center ${getStockColor(stock, minimo)}`}>
                          {stock}
                        </TableCell>
                        <TableCell className="text-center">{minimo}</TableCell>
                        <TableCell className="text-center">
                          {stock <= 0 ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Agotado
                            </span>
                          ) : stock <= minimo ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              Bajo Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Normal
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Historial de movimientos */}
      <Card className="border-[#D4A017]">
        <CardHeader className="bg-[#DAA520] rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Movimientos de Inventario</CardTitle>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[160px] bg-white text-[#2C3E50] border-white">
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ENTRADA">Entradas</SelectItem>
                <SelectItem value="SALIDA">Salidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-md border border-[#D4A017] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#E9D173] hover:bg-[#E9D173]">
                  <TableHead className="text-[#2C3E50] font-bold">Tipo</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold">Producto</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold text-center">Cantidad</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold">Motivo</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold">Referencia</TableHead>
                  <TableHead className="text-[#2C3E50] font-bold">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Cargando movimientos...
                    </TableCell>
                  </TableRow>
                ) : movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map((mov, i) => (
                    <TableRow key={mov._id} className={i % 2 === 0 ? "bg-white" : "bg-[#FDF5E6]"}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {mov.tipo === "ENTRADA" ? (
                            <ArrowUpCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={mov.tipo === "ENTRADA" ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                            {mov.tipo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{mov.producto_codigo}</span>
                        {mov.producto_nombre && (
                          <span className="ml-2 text-sm">{mov.producto_nombre}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {mov.tipo === "ENTRADA" ? "+" : "-"}{mov.cantidad}
                      </TableCell>
                      <TableCell>{mov.motivo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{mov.referencia || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(mov.fecha).toLocaleString("es-MX", {
                          dateStyle: "short", timeStyle: "short"
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
