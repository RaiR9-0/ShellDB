import tkinter as tk
from tkinter import messagebox, ttk
from datetime import datetime
from bson import ObjectId

# =========================
# COLORES (acordes al Login)
# =========================
YELLOW_BG = "#E9D173"       # Fondo amarillo principal
PANEL_BG = "#FCF3CF"        # Panel claro
SIDEBAR_BG = "#B8860B"      # Sidebar dorado oscuro
SIDEBAR_HOVER = "#D4A017"   # Hover sidebar dorado
SIDEBAR_TEXT = "#FFFFFF"     # Texto sidebar
CONTENT_BG = "#FFF8DC"      # Fondo contenido (cornsilk)
CARD_BG = "#FFFFFF"         # Fondo tarjetas
FORM_BG = "#FFFFFF"         # Fondo formularios
BTN_GREEN = "#27AE60"
BTN_BLUE = "#3498DB"
BTN_RED = "#E74C3C"
BTN_ORANGE = "#E67E22"
TEXT_DARK = "#2C3E50"
TEXT_LIGHT = "#FFFFFF"
HEADER_BG = "#DAA520"       # Encabezados dorado
TABLE_HEADER = "#E9D173"    # Encabezado tabla amarillo
TABLE_STRIPE = "#FDF5E6"    # Filas alternas
ACCENT_GOLD = "#C8A415"     # Acentos dorados
BORDER_COLOR = "#D4A017"    # Bordes


# =========================
# MENU PRINCIPAL
# =========================
class MenuApp:
    def __init__(self, root, username, db_manager, user_db_name):
        self.root = root
        self.username = username
        self.db_manager = db_manager
        self.user_db_name = user_db_name
        
        # Obtener la base de datos exclusiva del usuario
        self.user_db = self.db_manager.get_database(user_db_name)
        
        self.root.title(f"Sistema de Tienda - {username} | BD: {user_db_name}")
        self.root.geometry("1200x700")
        self.root.resizable(False, False)
        self.root.configure(bg=YELLOW_BG)

        # Colecciones de la tienda del usuario
        self.productos = self.user_db['productos']
        self.categorias = self.user_db['categorias']
        self.ventas = self.user_db['ventas']
        self.detalle_ventas = self.user_db['detalle_ventas']
        self.compras = self.user_db['compras']
        self.detalle_compras = self.user_db['detalle_compras']
        self.sucursales = self.user_db['sucursales']
        self.empleados = self.user_db['empleados']
        self.proveedores = self.user_db['proveedores']
        self.movimientos = self.user_db['movimientos_inventario']

        # Sucursal actual seleccionada
        self.sucursal_actual = None
        
        self.create_widgets()
        self.load_sucursales()

    def create_widgets(self):
        # ===== CONTENEDOR PRINCIPAL =====
        container = tk.Frame(self.root, bg=YELLOW_BG)
        container.pack(fill=tk.BOTH, expand=True)

        # ===== SIDEBAR =====
        self.sidebar = tk.Frame(container, bg=SIDEBAR_BG, width=250)
        self.sidebar.pack(side=tk.LEFT, fill=tk.Y)
        self.sidebar.pack_propagate(False)

        # Logo/Titulo
        logo_frame = tk.Frame(self.sidebar, bg=HEADER_BG)
        logo_frame.pack(fill=tk.X)
        tk.Label(
            logo_frame,
            text="MI TIENDA",
            bg=HEADER_BG,
            fg=TEXT_LIGHT,
            font=("Segoe UI", 20, "bold")
        ).pack(pady=15)

        # Info usuario
        user_frame = tk.Frame(self.sidebar, bg=SIDEBAR_BG)
        user_frame.pack(fill=tk.X, pady=10)
        tk.Label(
            user_frame,
            text=f"Usuario: {self.username}",
            bg=SIDEBAR_BG,
            fg=PANEL_BG,
            font=("Segoe UI", 10, "bold")
        ).pack()
        tk.Label(
            user_frame,
            text=f"BD: {self.user_db_name}",
            bg=SIDEBAR_BG,
            fg="#E9D173",
            font=("Segoe UI", 8)
        ).pack(pady=(0, 5))

        # Separador dorado
        tk.Frame(self.sidebar, bg=YELLOW_BG, height=2).pack(fill=tk.X, padx=15)

        # ===== SELECTOR DE SUCURSAL =====
        tk.Label(
            self.sidebar,
            text="Sucursal Activa:",
            bg=SIDEBAR_BG,
            fg=YELLOW_BG,
            font=("Segoe UI", 10, "bold")
        ).pack(pady=(12, 4))

        self.sucursal_var = tk.StringVar()
        self.sucursal_combo = ttk.Combobox(
            self.sidebar,
            textvariable=self.sucursal_var,
            state="readonly",
            width=25
        )
        self.sucursal_combo.pack(padx=20, pady=(0, 10))
        self.sucursal_combo.bind('<<ComboboxSelected>>', self.on_sucursal_change)

        # Separador dorado
        tk.Frame(self.sidebar, bg=YELLOW_BG, height=2).pack(fill=tk.X, padx=15)

        # ===== MENU DE OPCIONES =====
        menu_frame = tk.Frame(self.sidebar, bg=SIDEBAR_BG)
        menu_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        menu_options = [
            ("  Dashboard", self.show_dashboard),
            ("  Productos", self.open_products),
            ("  Nueva Venta", self.open_nueva_venta),
            ("  Historial Ventas", self.open_ventas),
            ("  Compras", self.open_compras),
            ("  Empleados", self.open_empleados),
            ("  Sucursales", self.open_sucursales),
            ("  Proveedores", self.open_proveedores),
            ("  Inventario", self.open_inventario),
        ]

        for text, command in menu_options:
            btn = tk.Button(
                menu_frame,
                text=text,
                bg=SIDEBAR_BG,
                fg=TEXT_LIGHT,
                activebackground=SIDEBAR_HOVER,
                activeforeground=TEXT_LIGHT,
                font=("Segoe UI", 11),
                relief=tk.FLAT,
                anchor="w",
                padx=20,
                pady=4,
                cursor="hand2",
                command=command
            )
            btn.pack(fill=tk.X, pady=1)
            btn.bind('<Enter>', lambda e, b=btn: b.config(bg=SIDEBAR_HOVER))
            btn.bind('<Leave>', lambda e, b=btn: b.config(bg=SIDEBAR_BG))

        # Boton Cerrar Sesion
        tk.Button(
            self.sidebar,
            text="Cerrar Sesion",
            bg=BTN_RED,
            fg=TEXT_LIGHT,
            activebackground="#C0392B",
            activeforeground=TEXT_LIGHT,
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            cursor="hand2",
            command=self.logout
        ).pack(fill=tk.X, padx=15, pady=15)

        # ===== CONTENIDO PRINCIPAL =====
        self.content = tk.Frame(container, bg=CONTENT_BG)
        self.content.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=3, pady=3)

        self.show_dashboard()

    def load_sucursales(self):
        """Carga las sucursales en el combobox"""
        sucursales = list(self.sucursales.find({"activa": True}))
        nombres = [f"{s['codigo']} - {s['nombre']}" for s in sucursales]
        self.sucursal_combo['values'] = nombres
        if nombres:
            self.sucursal_combo.current(0)
            self.sucursal_actual = sucursales[0]['codigo']

    def on_sucursal_change(self, event):
        """Cuando cambia la sucursal seleccionada"""
        selection = self.sucursal_var.get()
        self.sucursal_actual = selection.split(" - ")[0]
        self.show_dashboard()

    def clear_content(self):
        """Limpia el contenido principal"""
        for widget in self.content.winfo_children():
            widget.destroy()

    def show_dashboard(self):
        """Muestra el dashboard principal"""
        self.clear_content()

        # Header dorado
        header = tk.Frame(self.content, bg=HEADER_BG, height=60)
        header.pack(fill=tk.X)
        header.pack_propagate(False)
        tk.Label(
            header,
            text=f"Dashboard - {self.sucursal_actual or 'Todas las sucursales'}",
            font=("Segoe UI", 20, "bold"),
            bg=HEADER_BG,
            fg=TEXT_LIGHT
        ).pack(expand=True)

        # Frame de estadisticas
        stats_frame = tk.Frame(self.content, bg=CONTENT_BG)
        stats_frame.pack(pady=20)

        # Obtener estadisticas
        total_productos = self.productos.count_documents({})
        total_empleados = self.empleados.count_documents({"activo": True})

        # Calcular stock total de la sucursal actual
        stock_total = 0
        productos_bajo_stock = 0
        lista_bajo_stock = []
        for prod in self.productos.find({"activo": True}):
            stock = prod.get('stock_por_sucursal', {}).get(self.sucursal_actual, 0)
            stock_total += stock
            if stock <= prod.get('stock_minimo', 10):
                productos_bajo_stock += 1
                lista_bajo_stock.append(prod)

        # Ventas del dia
        hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        ventas_hoy = self.ventas.count_documents({
            "sucursal_codigo": self.sucursal_actual,
            "fecha": {"$gte": hoy}
        })

        # Total vendido hoy
        pipeline = [
            {"$match": {"sucursal_codigo": self.sucursal_actual, "fecha": {"$gte": hoy}}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]
        total_vendido_hoy = 0
        resultado = list(self.ventas.aggregate(pipeline))
        if resultado:
            total_vendido_hoy = resultado[0].get('total', 0)

        # Cards de estadisticas
        stats = [
            ("Productos", str(total_productos), ACCENT_GOLD),
            ("Stock Total", str(stock_total), BTN_GREEN),
            ("Bajo Stock", str(productos_bajo_stock), BTN_RED if productos_bajo_stock > 0 else BTN_GREEN),
            ("Ventas Hoy", str(ventas_hoy), SIDEBAR_BG),
            ("$ Vendido Hoy", f"${total_vendido_hoy:,.2f}", HEADER_BG),
            ("Empleados", str(total_empleados), BTN_BLUE),
        ]

        for i, (titulo, valor, color) in enumerate(stats):
            card = tk.Frame(stats_frame, bg=CARD_BG, width=148, height=110,
                            highlightbackground=color, highlightthickness=3)
            card.grid(row=0, column=i, padx=8, pady=10)
            card.pack_propagate(False)

            # Barra superior de color
            tk.Frame(card, bg=color, height=6).pack(fill=tk.X)

            tk.Label(
                card,
                text=valor,
                font=("Segoe UI", 22, "bold"),
                bg=CARD_BG,
                fg=color
            ).pack(expand=True)

            tk.Label(
                card,
                text=titulo,
                font=("Segoe UI", 9),
                bg=CARD_BG,
                fg=TEXT_DARK
            ).pack(pady=(0, 10))

        # Tabla de productos con bajo stock
        if productos_bajo_stock > 0:
            alert_frame = tk.Frame(self.content, bg=CONTENT_BG)
            alert_frame.pack(fill=tk.X, padx=30, pady=(20, 0))

            tk.Label(
                alert_frame,
                text="ALERTA: Productos con Bajo Stock",
                font=("Segoe UI", 14, "bold"),
                bg=CONTENT_BG,
                fg=BTN_RED
            ).pack(anchor="w")

            tree_frame = tk.Frame(self.content, bg=CARD_BG, bd=1, relief=tk.SOLID)
            tree_frame.pack(padx=30, pady=10, fill=tk.X)

            tree = ttk.Treeview(
                tree_frame,
                columns=("codigo", "nombre", "stock", "minimo", "diferencia"),
                show="headings",
                height=min(len(lista_bajo_stock), 6)
            )
            tree.heading("codigo", text="Codigo")
            tree.heading("nombre", text="Producto")
            tree.heading("stock", text="Stock Actual")
            tree.heading("minimo", text="Stock Minimo")
            tree.heading("diferencia", text="Faltante")
            tree.column("codigo", width=100)
            tree.column("nombre", width=200)
            tree.column("stock", width=120)
            tree.column("minimo", width=120)
            tree.column("diferencia", width=100)
            tree.pack(fill=tk.X)

            for prod in lista_bajo_stock:
                stock = prod.get('stock_por_sucursal', {}).get(self.sucursal_actual, 0)
                minimo = prod.get('stock_minimo', 10)
                tree.insert("", tk.END, values=(
                    prod['codigo'],
                    prod['nombre'],
                    stock,
                    minimo,
                    max(0, minimo - stock)
                ))

        # Ultimas 5 ventas
        ultimas_ventas = list(self.ventas.find(
            {"sucursal_codigo": self.sucursal_actual}
        ).sort("fecha", -1).limit(5))

        if ultimas_ventas:
            ventas_frame = tk.Frame(self.content, bg=CONTENT_BG)
            ventas_frame.pack(fill=tk.X, padx=30, pady=(20, 0))

            tk.Label(
                ventas_frame,
                text="Ultimas Ventas",
                font=("Segoe UI", 14, "bold"),
                bg=CONTENT_BG,
                fg=SIDEBAR_BG
            ).pack(anchor="w")

            tree_v_frame = tk.Frame(self.content, bg=CARD_BG, bd=1, relief=tk.SOLID)
            tree_v_frame.pack(padx=30, pady=10, fill=tk.X)

            tree_v = ttk.Treeview(
                tree_v_frame,
                columns=("id", "fecha", "items", "total"),
                show="headings",
                height=5
            )
            tree_v.heading("id", text="ID Venta")
            tree_v.heading("fecha", text="Fecha")
            tree_v.heading("items", text="Articulos")
            tree_v.heading("total", text="Total")
            tree_v.pack(fill=tk.X)

            for venta in ultimas_ventas:
                tree_v.insert("", tk.END, values=(
                    str(venta['_id'])[-8:],
                    venta['fecha'].strftime("%Y-%m-%d %H:%M"),
                    venta.get('items_count', 0),
                    f"${venta.get('total', 0):,.2f}"
                ))

    def open_products(self):
        """Abre la ventana de productos"""
        ProductsWindow(self.root, self.productos, self.categorias, self.sucursal_actual)

    def open_nueva_venta(self):
        """Abre la ventana de nueva venta"""
        NuevaVentaWindow(
            self.root, 
            self.ventas, 
            self.detalle_ventas,
            self.productos, 
            self.empleados, 
            self.sucursal_actual,
            self.movimientos
        )

    def open_ventas(self):
        """Abre el historial de ventas"""
        VentasWindow(self.root, self.ventas, self.detalle_ventas, self.sucursal_actual)

    def open_compras(self):
        """Abre la ventana de compras"""
        ComprasWindow(
            self.root,
            self.compras,
            self.detalle_compras,
            self.productos,
            self.proveedores,
            self.sucursal_actual,
            self.movimientos
        )

    def open_empleados(self):
        """Abre la ventana de empleados"""
        EmpleadosWindow(self.root, self.empleados, self.sucursales)

    def open_sucursales(self):
        """Abre la ventana de sucursales"""
        SucursalesWindow(self.root, self.sucursales)

    def open_proveedores(self):
        """Abre la ventana de proveedores"""
        ProveedoresWindow(self.root, self.proveedores)

    def open_inventario(self):
        """Abre la ventana de movimientos de inventario"""
        InventarioWindow(self.root, self.movimientos, self.productos, self.sucursal_actual)

    def logout(self):
        """Cierra sesion"""
        if messagebox.askyesno("Cerrar Sesion", "Desea cerrar sesion?"):
            self.root.destroy()
            import LoginApp
            LoginApp.run_login(self.db_manager)


# =========================
# VENTANA DE PRODUCTOS
# =========================
class ProductsWindow:
    def __init__(self, parent, productos, categorias, sucursal_codigo):
        self.productos = productos
        self.categorias = categorias
        self.sucursal_codigo = sucursal_codigo

        self.window = tk.Toplevel(parent)
        self.window.title("Gestion de Productos")
        self.window.geometry("900x550")
        self.window.configure(bg=CONTENT_BG)

        # Header
        header = tk.Frame(self.window, bg=HEADER_BG, height=45)
        header.pack(fill=tk.X)
        header.pack_propagate(False)
        tk.Label(header, text="Gestion de Productos", font=("Segoe UI", 16, "bold"),
                 bg=HEADER_BG, fg=TEXT_LIGHT).pack(expand=True)

        # Tabla
        table_frame = tk.Frame(self.window, bg=CARD_BG, bd=1, relief=tk.SOLID)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        columns = ("codigo", "nombre", "categoria", "precio_compra", "precio_venta", "stock", "minimo")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings")
        
        for col in columns:
            self.tree.heading(col, text=col.replace("_", " ").title())
            self.tree.column(col, width=120)

        scrollbar = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # Botones
        btn_frame = tk.Frame(self.window, bg=CONTENT_BG)
        btn_frame.pack(pady=10)

        for text, color, cmd in [("Agregar", BTN_GREEN, self.create_item),
                                  ("Editar", BTN_BLUE, self.update_item),
                                  ("Eliminar", BTN_RED, self.delete_item)]:
            tk.Button(btn_frame, text=text, bg=color, fg="white", font=("Segoe UI", 10, "bold"),
                      relief=tk.FLAT, padx=20, pady=5, cursor="hand2", command=cmd
                      ).pack(side=tk.LEFT, padx=5)

        self.load_data()

    def load_data(self):
        self.tree.delete(*self.tree.get_children())
        for prod in self.productos.find({"activo": True}):
            stock = prod.get('stock_por_sucursal', {}).get(self.sucursal_codigo, 0)
            self.tree.insert("", tk.END, values=(
                prod.get('codigo', ''),
                prod.get('nombre', ''),
                prod.get('categoria_codigo', ''),
                f"${prod.get('precio_compra', 0):.2f}",
                f"${prod.get('precio_venta', 0):.2f}",
                stock,
                prod.get('stock_minimo', 0)
            ))

    def create_item(self):
        ProductForm(self.window, self.productos, self.categorias, self.sucursal_codigo, callback=self.load_data)

    def update_item(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Advertencia", "Seleccione un producto")
            return
        codigo = self.tree.item(selected[0])["values"][0]
        producto = self.productos.find_one({"codigo": codigo})
        ProductForm(self.window, self.productos, self.categorias, self.sucursal_codigo, producto, self.load_data)

    def delete_item(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Advertencia", "Seleccione un producto")
            return
        if messagebox.askyesno("Confirmar", "Desea eliminar este producto?"):
            codigo = self.tree.item(selected[0])["values"][0]
            self.productos.update_one({"codigo": codigo}, {"$set": {"activo": False}})
            self.load_data()


# =========================
# FORMULARIO DE PRODUCTO
# =========================
class ProductForm:
    def __init__(self, parent, productos, categorias, sucursal_codigo, producto=None, callback=None):
        self.productos = productos
        self.categorias = categorias
        self.sucursal_codigo = sucursal_codigo
        self.producto = producto
        self.callback = callback

        self.window = tk.Toplevel(parent)
        self.window.title("Producto")
        self.window.geometry("400x450")

        fields = [
            ("Codigo:", "codigo"),
            ("Nombre:", "nombre"),
            ("Precio Compra:", "precio_compra"),
            ("Precio Venta:", "precio_venta"),
            ("Stock:", "stock"),
            ("Stock Minimo:", "stock_minimo"),
        ]

        self.entries = {}
        for i, (label, field) in enumerate(fields):
            tk.Label(self.window, text=label).grid(row=i, column=0, padx=10, pady=5, sticky="e")
            entry = tk.Entry(self.window, width=30)
            entry.grid(row=i, column=1, padx=10, pady=5)
            self.entries[field] = entry

        # Categoria (combobox)
        tk.Label(self.window, text="Categoria:").grid(row=len(fields), column=0, padx=10, pady=5, sticky="e")
        self.categoria_var = tk.StringVar()
        cats = list(categorias.find())
        self.categoria_combo = ttk.Combobox(
            self.window,
            textvariable=self.categoria_var,
            values=[f"{c['codigo']} - {c['nombre']}" for c in cats],
            width=27
        )
        self.categoria_combo.grid(row=len(fields), column=1, padx=10, pady=5)

        # Cargar datos si es edicion
        if producto:
            self.entries['codigo'].insert(0, producto.get('codigo', ''))
            self.entries['codigo'].config(state='disabled')
            self.entries['nombre'].insert(0, producto.get('nombre', ''))
            self.entries['precio_compra'].insert(0, producto.get('precio_compra', 0))
            self.entries['precio_venta'].insert(0, producto.get('precio_venta', 0))
            stock = producto.get('stock_por_sucursal', {}).get(sucursal_codigo, 0)
            self.entries['stock'].insert(0, stock)
            self.entries['stock_minimo'].insert(0, producto.get('stock_minimo', 0))
            
            cat_codigo = producto.get('categoria_codigo', '')
            for i, c in enumerate(cats):
                if c['codigo'] == cat_codigo:
                    self.categoria_combo.current(i)
                    break

        tk.Button(
            self.window,
            text="Guardar",
            bg=BTN_GREEN,
            fg="white",
            command=self.save
        ).grid(row=len(fields)+1, column=0, columnspan=2, pady=20)

    def save(self):
        try:
            codigo = self.entries['codigo'].get().strip()
            nombre = self.entries['nombre'].get().strip()
            precio_compra = float(self.entries['precio_compra'].get())
            precio_venta = float(self.entries['precio_venta'].get())
            stock = int(self.entries['stock'].get())
            stock_minimo = int(self.entries['stock_minimo'].get())
            categoria = self.categoria_var.get().split(" - ")[0] if self.categoria_var.get() else ""

            if not codigo or not nombre:
                messagebox.showwarning("Advertencia", "Codigo y nombre son obligatorios")
                return

            if self.producto:
                # Actualizar
                self.productos.update_one(
                    {"codigo": codigo},
                    {"$set": {
                        "nombre": nombre,
                        "categoria_codigo": categoria,
                        "precio_compra": precio_compra,
                        "precio_venta": precio_venta,
                        f"stock_por_sucursal.{self.sucursal_codigo}": stock,
                        "stock_minimo": stock_minimo
                    }}
                )
            else:
                # Crear nuevo
                self.productos.insert_one({
                    "codigo": codigo,
                    "nombre": nombre,
                    "categoria_codigo": categoria,
                    "precio_compra": precio_compra,
                    "precio_venta": precio_venta,
                    "unidad": "pieza",
                    "stock_por_sucursal": {self.sucursal_codigo: stock},
                    "stock_minimo": stock_minimo,
                    "activo": True,
                    "fecha_registro": datetime.now()
                })

            messagebox.showinfo("Exito", "Producto guardado")
            self.window.destroy()
            if self.callback:
                self.callback()

        except ValueError:
            messagebox.showerror("Error", "Verifique los valores numericos")


# =========================
# VENTANA NUEVA VENTA
# =========================
class NuevaVentaWindow:
    def __init__(self, parent, ventas, detalle_ventas, productos, empleados, sucursal_codigo, movimientos):
        self.ventas = ventas
        self.detalle_ventas = detalle_ventas
        self.productos = productos
        self.empleados = empleados
        self.sucursal_codigo = sucursal_codigo
        self.movimientos = movimientos
        self.items_venta = []

        self.window = tk.Toplevel(parent)
        self.window.title(f"Nueva Venta - {sucursal_codigo}")
        self.window.geometry("800x600")

        # Frame superior - Seleccion de producto
        top_frame = tk.Frame(self.window)
        top_frame.pack(fill=tk.X, padx=10, pady=10)

        tk.Label(top_frame, text="Producto:").pack(side=tk.LEFT)
        self.producto_var = tk.StringVar()
        prods = list(productos.find({"activo": True}))
        self.productos_list = prods
        self.producto_combo = ttk.Combobox(
            top_frame,
            textvariable=self.producto_var,
            values=[f"{p['codigo']} - {p['nombre']}" for p in prods],
            width=40
        )
        self.producto_combo.pack(side=tk.LEFT, padx=10)

        tk.Label(top_frame, text="Cantidad:").pack(side=tk.LEFT)
        self.cantidad_entry = tk.Entry(top_frame, width=10)
        self.cantidad_entry.pack(side=tk.LEFT, padx=5)
        self.cantidad_entry.insert(0, "1")

        tk.Button(
            top_frame,
            text="Agregar",
            bg=BTN_GREEN,
            fg="white",
            command=self.agregar_item
        ).pack(side=tk.LEFT, padx=10)

        # Tabla de items
        columns = ("codigo", "producto", "cantidad", "precio", "subtotal")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings", height=15)
        for col in columns:
            self.tree.heading(col, text=col.title())
            self.tree.column(col, width=150)
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Frame inferior - Total y acciones
        bottom_frame = tk.Frame(self.window)
        bottom_frame.pack(fill=tk.X, padx=10, pady=10)

        self.total_label = tk.Label(
            bottom_frame,
            text="TOTAL: $0.00",
            font=("Segoe UI", 18, "bold"),
            fg=BTN_GREEN
        )
        self.total_label.pack(side=tk.LEFT)

        tk.Button(
            bottom_frame,
            text="Quitar Seleccionado",
            bg=BTN_ORANGE,
            fg="white",
            command=self.quitar_item
        ).pack(side=tk.RIGHT, padx=5)

        tk.Button(
            bottom_frame,
            text="PROCESAR VENTA",
            bg=BTN_GREEN,
            fg="white",
            font=("Segoe UI", 12, "bold"),
            command=self.procesar_venta
        ).pack(side=tk.RIGHT, padx=5)

    def agregar_item(self):
        """Agrega un item a la venta"""
        seleccion = self.producto_var.get()
        if not seleccion:
            messagebox.showwarning("Advertencia", "Seleccione un producto")
            return

        try:
            cantidad = int(self.cantidad_entry.get())
            if cantidad <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Error", "Cantidad invalida")
            return

        codigo = seleccion.split(" - ")[0]
        producto = self.productos.find_one({"codigo": codigo})

        if not producto:
            messagebox.showerror("Error", "Producto no encontrado")
            return

        # Verificar stock
        stock_disponible = producto.get('stock_por_sucursal', {}).get(self.sucursal_codigo, 0)
        if cantidad > stock_disponible:
            messagebox.showerror("Error", f"Stock insuficiente. Disponible: {stock_disponible}")
            return

        precio = producto.get('precio_venta', 0)
        subtotal = precio * cantidad

        # Agregar a la lista
        self.items_venta.append({
            "codigo": codigo,
            "nombre": producto['nombre'],
            "cantidad": cantidad,
            "precio": precio,
            "subtotal": subtotal
        })

        # Actualizar tabla
        self.tree.insert("", tk.END, values=(
            codigo,
            producto['nombre'],
            cantidad,
            f"${precio:.2f}",
            f"${subtotal:.2f}"
        ))

        # Actualizar total
        self.actualizar_total()

        # Limpiar
        self.cantidad_entry.delete(0, tk.END)
        self.cantidad_entry.insert(0, "1")

    def quitar_item(self):
        """Quita el item seleccionado"""
        selected = self.tree.selection()
        if not selected:
            return
        
        index = self.tree.index(selected[0])
        self.items_venta.pop(index)
        self.tree.delete(selected[0])
        self.actualizar_total()

    def actualizar_total(self):
        """Actualiza el total de la venta"""
        total = sum(item['subtotal'] for item in self.items_venta)
        self.total_label.config(text=f"TOTAL: ${total:.2f}")

    def procesar_venta(self):
        """Procesa y guarda la venta"""
        if not self.items_venta:
            messagebox.showwarning("Advertencia", "No hay items en la venta")
            return

        if not messagebox.askyesno("Confirmar", "Procesar esta venta?"):
            return

        try:
            total = sum(item['subtotal'] for item in self.items_venta)
            
            # Crear la venta
            venta_doc = {
                "sucursal_codigo": self.sucursal_codigo,
                "fecha": datetime.now(),
                "total": total,
                "items_count": len(self.items_venta),
                "estado": "completada"
            }
            result = self.ventas.insert_one(venta_doc)
            venta_id = result.inserted_id

            # Guardar detalles y actualizar stock
            for item in self.items_venta:
                # Detalle de venta
                self.detalle_ventas.insert_one({
                    "venta_id": venta_id,
                    "producto_codigo": item['codigo'],
                    "producto_nombre": item['nombre'],
                    "cantidad": item['cantidad'],
                    "precio_unitario": item['precio'],
                    "subtotal": item['subtotal']
                })

                # Actualizar stock (DISMINUIR)
                self.productos.update_one(
                    {"codigo": item['codigo']},
                    {"$inc": {f"stock_por_sucursal.{self.sucursal_codigo}": -item['cantidad']}}
                )

                # Registrar movimiento de inventario
                self.movimientos.insert_one({
                    "producto_codigo": item['codigo'],
                    "producto_nombre": item['nombre'],
                    "sucursal_codigo": self.sucursal_codigo,
                    "tipo": "SALIDA",
                    "motivo": "VENTA",
                    "cantidad": item['cantidad'],
                    "referencia_id": str(venta_id),
                    "fecha": datetime.now()
                })

            messagebox.showinfo("Exito", f"Venta procesada correctamente\nTotal: ${total:.2f}")
            self.window.destroy()

        except Exception as e:
            messagebox.showerror("Error", f"Error al procesar venta: {str(e)}")


# =========================
# HISTORIAL DE VENTAS
# =========================
class VentasWindow:
    def __init__(self, parent, ventas, detalle_ventas, sucursal_codigo):
        self.ventas = ventas
        self.detalle_ventas = detalle_ventas
        self.sucursal_codigo = sucursal_codigo

        self.window = tk.Toplevel(parent)
        self.window.title("Historial de Ventas")
        self.window.geometry("800x500")

        columns = ("id", "fecha", "items", "total", "estado")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings")
        for col in columns:
            self.tree.heading(col, text=col.title())
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.tree.bind('<Double-1>', self.ver_detalle)

        tk.Label(self.window, text="Doble clic para ver detalle", fg="gray").pack()

        self.load_data()

    def load_data(self):
        self.tree.delete(*self.tree.get_children())
        for venta in self.ventas.find({"sucursal_codigo": self.sucursal_codigo}).sort("fecha", -1):
            self.tree.insert("", tk.END, values=(
                str(venta['_id'])[-8:],
                venta['fecha'].strftime("%Y-%m-%d %H:%M"),
                venta.get('items_count', 0),
                f"${venta.get('total', 0):.2f}",
                venta.get('estado', 'N/A')
            ))

    def ver_detalle(self, event):
        selected = self.tree.selection()
        if not selected:
            return
        # Mostrar detalle de la venta
        messagebox.showinfo("Info", "Funcionalidad de detalle disponible")


# =========================
# VENTANA DE COMPRAS
# =========================
class ComprasWindow:
    def __init__(self, parent, compras, detalle_compras, productos, proveedores, sucursal_codigo, movimientos):
        self.compras = compras
        self.detalle_compras = detalle_compras
        self.productos = productos
        self.proveedores = proveedores
        self.sucursal_codigo = sucursal_codigo
        self.movimientos = movimientos

        self.window = tk.Toplevel(parent)
        self.window.title("Compras a Proveedores")
        self.window.geometry("800x500")

        # Boton nueva compra
        tk.Button(
            self.window,
            text="Nueva Compra",
            bg=BTN_GREEN,
            fg="white",
            command=self.nueva_compra
        ).pack(pady=10)

        columns = ("id", "proveedor", "fecha", "total", "estado")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings")
        for col in columns:
            self.tree.heading(col, text=col.title())
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.load_data()

    def load_data(self):
        self.tree.delete(*self.tree.get_children())
        for compra in self.compras.find({"sucursal_codigo": self.sucursal_codigo}).sort("fecha", -1):
            self.tree.insert("", tk.END, values=(
                str(compra['_id'])[-8:],
                compra.get('proveedor_nombre', 'N/A'),
                compra['fecha'].strftime("%Y-%m-%d %H:%M"),
                f"${compra.get('total', 0):.2f}",
                compra.get('estado', 'N/A')
            ))

    def nueva_compra(self):
        NuevaCompraWindow(
            self.window,
            self.compras,
            self.detalle_compras,
            self.productos,
            self.proveedores,
            self.sucursal_codigo,
            self.movimientos,
            self.load_data
        )


# =========================
# VENTANA NUEVA COMPRA
# =========================
class NuevaCompraWindow:
    def __init__(self, parent, compras, detalle_compras, productos, proveedores, sucursal_codigo, movimientos, callback):
        self.compras = compras
        self.detalle_compras = detalle_compras
        self.productos = productos
        self.proveedores = proveedores
        self.sucursal_codigo = sucursal_codigo
        self.movimientos = movimientos
        self.callback = callback
        self.items_compra = []

        self.window = tk.Toplevel(parent)
        self.window.title("Nueva Compra")
        self.window.geometry("800x600")

        # Proveedor
        prov_frame = tk.Frame(self.window)
        prov_frame.pack(fill=tk.X, padx=10, pady=10)

        tk.Label(prov_frame, text="Proveedor:").pack(side=tk.LEFT)
        self.proveedor_var = tk.StringVar()
        provs = list(proveedores.find({"activo": True}))
        self.proveedor_combo = ttk.Combobox(
            prov_frame,
            textvariable=self.proveedor_var,
            values=[f"{p['codigo']} - {p['nombre']}" for p in provs],
            width=40
        )
        self.proveedor_combo.pack(side=tk.LEFT, padx=10)

        # Producto
        prod_frame = tk.Frame(self.window)
        prod_frame.pack(fill=tk.X, padx=10, pady=5)

        tk.Label(prod_frame, text="Producto:").pack(side=tk.LEFT)
        self.producto_var = tk.StringVar()
        prods = list(productos.find({"activo": True}))
        self.producto_combo = ttk.Combobox(
            prod_frame,
            textvariable=self.producto_var,
            values=[f"{p['codigo']} - {p['nombre']}" for p in prods],
            width=40
        )
        self.producto_combo.pack(side=tk.LEFT, padx=10)

        tk.Label(prod_frame, text="Cantidad:").pack(side=tk.LEFT)
        self.cantidad_entry = tk.Entry(prod_frame, width=10)
        self.cantidad_entry.pack(side=tk.LEFT, padx=5)

        tk.Label(prod_frame, text="Precio:").pack(side=tk.LEFT)
        self.precio_entry = tk.Entry(prod_frame, width=10)
        self.precio_entry.pack(side=tk.LEFT, padx=5)

        tk.Button(prod_frame, text="Agregar", bg=BTN_GREEN, fg="white", command=self.agregar_item).pack(side=tk.LEFT, padx=10)

        # Tabla
        columns = ("codigo", "producto", "cantidad", "precio", "subtotal")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings", height=12)
        for col in columns:
            self.tree.heading(col, text=col.title())
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Total
        bottom_frame = tk.Frame(self.window)
        bottom_frame.pack(fill=tk.X, padx=10, pady=10)

        self.total_label = tk.Label(bottom_frame, text="TOTAL: $0.00", font=("Segoe UI", 16, "bold"))
        self.total_label.pack(side=tk.LEFT)

        tk.Button(bottom_frame, text="PROCESAR COMPRA", bg=BTN_GREEN, fg="white", command=self.procesar_compra).pack(side=tk.RIGHT)

    def agregar_item(self):
        seleccion = self.producto_var.get()
        if not seleccion:
            return

        try:
            cantidad = int(self.cantidad_entry.get())
            precio = float(self.precio_entry.get())
        except ValueError:
            messagebox.showerror("Error", "Valores invalidos")
            return

        codigo = seleccion.split(" - ")[0]
        producto = self.productos.find_one({"codigo": codigo})
        subtotal = precio * cantidad

        self.items_compra.append({
            "codigo": codigo,
            "nombre": producto['nombre'],
            "cantidad": cantidad,
            "precio": precio,
            "subtotal": subtotal
        })

        self.tree.insert("", tk.END, values=(
            codigo, producto['nombre'], cantidad, f"${precio:.2f}", f"${subtotal:.2f}"
        ))

        total = sum(i['subtotal'] for i in self.items_compra)
        self.total_label.config(text=f"TOTAL: ${total:.2f}")

    def procesar_compra(self):
        if not self.items_compra or not self.proveedor_var.get():
            messagebox.showwarning("Advertencia", "Complete todos los campos")
            return

        try:
            proveedor_codigo = self.proveedor_var.get().split(" - ")[0]
            proveedor = self.proveedores.find_one({"codigo": proveedor_codigo})
            total = sum(i['subtotal'] for i in self.items_compra)

            compra_doc = {
                "proveedor_codigo": proveedor_codigo,
                "proveedor_nombre": proveedor['nombre'],
                "sucursal_codigo": self.sucursal_codigo,
                "fecha": datetime.now(),
                "total": total,
                "estado": "completada"
            }
            result = self.compras.insert_one(compra_doc)
            compra_id = result.inserted_id

            for item in self.items_compra:
                self.detalle_compras.insert_one({
                    "compra_id": compra_id,
                    "producto_codigo": item['codigo'],
                    "cantidad": item['cantidad'],
                    "precio_unitario": item['precio'],
                    "subtotal": item['subtotal']
                })

                # AUMENTAR stock
                self.productos.update_one(
                    {"codigo": item['codigo']},
                    {"$inc": {f"stock_por_sucursal.{self.sucursal_codigo}": item['cantidad']}}
                )

                # Movimiento de inventario
                self.movimientos.insert_one({
                    "producto_codigo": item['codigo'],
                    "producto_nombre": item['nombre'],
                    "sucursal_codigo": self.sucursal_codigo,
                    "tipo": "ENTRADA",
                    "motivo": "COMPRA",
                    "cantidad": item['cantidad'],
                    "referencia_id": str(compra_id),
                    "fecha": datetime.now()
                })

            messagebox.showinfo("Exito", f"Compra registrada\nTotal: ${total:.2f}")
            self.window.destroy()
            if self.callback:
                self.callback()

        except Exception as e:
            messagebox.showerror("Error", str(e))


# =========================
# VENTANA EMPLEADOS
# =========================
class EmpleadosWindow:
    def __init__(self, parent, empleados, sucursales):
        self.empleados = empleados
        self.sucursales = sucursales

        self.window = tk.Toplevel(parent)
        self.window.title("Empleados")
        self.window.geometry("800x400")

        columns = ("codigo", "nombre", "puesto", "sucursal", "telefono", "salario")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings")
        for col in columns:
            self.tree.heading(col, text=col.title())
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        btn_frame = tk.Frame(self.window)
        btn_frame.pack(pady=10)
        tk.Button(btn_frame, text="Agregar", bg=BTN_GREEN, fg="white", command=self.create_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Editar", bg=BTN_BLUE, fg="white", command=self.update_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Eliminar", bg=BTN_RED, fg="white", command=self.delete_item).pack(side=tk.LEFT, padx=5)

        self.load_data()

    def load_data(self):
        self.tree.delete(*self.tree.get_children())
        for emp in self.empleados.find({"activo": True}):
            self.tree.insert("", tk.END, values=(
                emp.get('codigo', ''),
                emp.get('nombre', ''),
                emp.get('puesto', ''),
                emp.get('sucursal_codigo', ''),
                emp.get('telefono', ''),
                f"${emp.get('salario', 0):.2f}"
            ))

    def create_item(self):
        EmpleadoForm(self.window, self.empleados, self.sucursales, callback=self.load_data)

    def update_item(self):
        selected = self.tree.selection()
        if not selected:
            return
        codigo = self.tree.item(selected[0])["values"][0]
        empleado = self.empleados.find_one({"codigo": codigo})
        EmpleadoForm(self.window, self.empleados, self.sucursales, empleado, self.load_data)

    def delete_item(self):
        selected = self.tree.selection()
        if not selected:
            return
        if messagebox.askyesno("Confirmar", "Eliminar empleado?"):
            codigo = self.tree.item(selected[0])["values"][0]
            self.empleados.update_one({"codigo": codigo}, {"$set": {"activo": False}})
            self.load_data()


class EmpleadoForm:
    def __init__(self, parent, empleados, sucursales, empleado=None, callback=None):
        self.empleados = empleados
        self.sucursales = sucursales
        self.empleado = empleado
        self.callback = callback

        self.window = tk.Toplevel(parent)
        self.window.title("Empleado")
        self.window.geometry("400x400")

        fields = ["codigo", "nombre", "puesto", "telefono", "email", "salario"]
        self.entries = {}

        for i, field in enumerate(fields):
            tk.Label(self.window, text=f"{field.title()}:").grid(row=i, column=0, padx=10, pady=5, sticky="e")
            entry = tk.Entry(self.window, width=30)
            entry.grid(row=i, column=1, padx=10, pady=5)
            self.entries[field] = entry

        # Sucursal
        tk.Label(self.window, text="Sucursal:").grid(row=len(fields), column=0, padx=10, pady=5, sticky="e")
        self.sucursal_var = tk.StringVar()
        sucs = list(sucursales.find({"activa": True}))
        self.sucursal_combo = ttk.Combobox(
            self.window,
            textvariable=self.sucursal_var,
            values=[f"{s['codigo']} - {s['nombre']}" for s in sucs],
            width=27
        )
        self.sucursal_combo.grid(row=len(fields), column=1, padx=10, pady=5)

        if empleado:
            for field in fields:
                val = empleado.get(field, '')
                self.entries[field].insert(0, str(val))
            self.entries['codigo'].config(state='disabled')

        tk.Button(self.window, text="Guardar", bg=BTN_GREEN, fg="white", command=self.save).grid(
            row=len(fields)+1, column=0, columnspan=2, pady=20
        )

    def save(self):
        data = {k: v.get().strip() for k, v in self.entries.items()}
        data['salario'] = float(data.get('salario', 0) or 0)
        data['sucursal_codigo'] = self.sucursal_var.get().split(" - ")[0] if self.sucursal_var.get() else ""
        data['activo'] = True

        if self.empleado:
            self.empleados.update_one({"codigo": self.empleado['codigo']}, {"$set": data})
        else:
            data['fecha_ingreso'] = datetime.now()
            self.empleados.insert_one(data)

        self.window.destroy()
        if self.callback:
            self.callback()


# =========================
# VENTANA SUCURSALES
# =========================
class SucursalesWindow:
    def __init__(self, parent, sucursales):
        self.sucursales = sucursales

        self.window = tk.Toplevel(parent)
        self.window.title("Sucursales")
        self.window.geometry("700x400")

        columns = ("codigo", "nombre", "direccion", "telefono", "activa")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings")
        for col in columns:
            self.tree.heading(col, text=col.title())
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        btn_frame = tk.Frame(self.window)
        btn_frame.pack(pady=10)
        tk.Button(btn_frame, text="Agregar", bg=BTN_GREEN, fg="white", command=self.create_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Editar", bg=BTN_BLUE, fg="white", command=self.update_item).pack(side=tk.LEFT, padx=5)

        self.load_data()

    def load_data(self):
        self.tree.delete(*self.tree.get_children())
        for suc in self.sucursales.find():
            self.tree.insert("", tk.END, values=(
                suc.get('codigo', ''),
                suc.get('nombre', ''),
                suc.get('direccion', ''),
                suc.get('telefono', ''),
                "Si" if suc.get('activa') else "No"
            ))

    def create_item(self):
        SucursalForm(self.window, self.sucursales, callback=self.load_data)

    def update_item(self):
        selected = self.tree.selection()
        if not selected:
            return
        codigo = self.tree.item(selected[0])["values"][0]
        sucursal = self.sucursales.find_one({"codigo": codigo})
        SucursalForm(self.window, self.sucursales, sucursal, self.load_data)


class SucursalForm:
    def __init__(self, parent, sucursales, sucursal=None, callback=None):
        self.sucursales = sucursales
        self.sucursal = sucursal
        self.callback = callback

        self.window = tk.Toplevel(parent)
        self.window.title("Sucursal")
        self.window.geometry("400x300")

        fields = ["codigo", "nombre", "direccion", "telefono"]
        self.entries = {}

        for i, field in enumerate(fields):
            tk.Label(self.window, text=f"{field.title()}:").grid(row=i, column=0, padx=10, pady=5, sticky="e")
            entry = tk.Entry(self.window, width=30)
            entry.grid(row=i, column=1, padx=10, pady=5)
            self.entries[field] = entry

        self.activa_var = tk.BooleanVar(value=True)
        tk.Checkbutton(self.window, text="Activa", variable=self.activa_var).grid(row=len(fields), column=1, sticky="w")

        if sucursal:
            for field in fields:
                self.entries[field].insert(0, sucursal.get(field, ''))
            self.entries['codigo'].config(state='disabled')
            self.activa_var.set(sucursal.get('activa', True))

        tk.Button(self.window, text="Guardar", bg=BTN_GREEN, fg="white", command=self.save).grid(
            row=len(fields)+1, column=0, columnspan=2, pady=20
        )

    def save(self):
        data = {k: v.get().strip() for k, v in self.entries.items()}
        data['activa'] = self.activa_var.get()

        if self.sucursal:
            self.sucursales.update_one({"codigo": self.sucursal['codigo']}, {"$set": data})
        else:
            data['fecha_creacion'] = datetime.now()
            self.sucursales.insert_one(data)

        self.window.destroy()
        if self.callback:
            self.callback()


# =========================
# VENTANA PROVEEDORES
# =========================
class ProveedoresWindow:
    def __init__(self, parent, proveedores):
        self.proveedores = proveedores

        self.window = tk.Toplevel(parent)
        self.window.title("Proveedores")
        self.window.geometry("800x400")

        columns = ("codigo", "nombre", "contacto", "telefono", "email")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings")
        for col in columns:
            self.tree.heading(col, text=col.title())
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        btn_frame = tk.Frame(self.window)
        btn_frame.pack(pady=10)
        tk.Button(btn_frame, text="Agregar", bg=BTN_GREEN, fg="white", command=self.create_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Editar", bg=BTN_BLUE, fg="white", command=self.update_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Eliminar", bg=BTN_RED, fg="white", command=self.delete_item).pack(side=tk.LEFT, padx=5)

        self.load_data()

    def load_data(self):
        self.tree.delete(*self.tree.get_children())
        for prov in self.proveedores.find({"activo": True}):
            self.tree.insert("", tk.END, values=(
                prov.get('codigo', ''),
                prov.get('nombre', ''),
                prov.get('contacto', ''),
                prov.get('telefono', ''),
                prov.get('email', '')
            ))

    def create_item(self):
        ProveedorForm(self.window, self.proveedores, callback=self.load_data)

    def update_item(self):
        selected = self.tree.selection()
        if not selected:
            return
        codigo = self.tree.item(selected[0])["values"][0]
        proveedor = self.proveedores.find_one({"codigo": codigo})
        ProveedorForm(self.window, self.proveedores, proveedor, self.load_data)

    def delete_item(self):
        selected = self.tree.selection()
        if not selected:
            return
        if messagebox.askyesno("Confirmar", "Eliminar proveedor?"):
            codigo = self.tree.item(selected[0])["values"][0]
            self.proveedores.update_one({"codigo": codigo}, {"$set": {"activo": False}})
            self.load_data()


class ProveedorForm:
    def __init__(self, parent, proveedores, proveedor=None, callback=None):
        self.proveedores = proveedores
        self.proveedor = proveedor
        self.callback = callback

        self.window = tk.Toplevel(parent)
        self.window.title("Proveedor")
        self.window.geometry("400x350")

        fields = ["codigo", "nombre", "contacto", "telefono", "email", "direccion"]
        self.entries = {}

        for i, field in enumerate(fields):
            tk.Label(self.window, text=f"{field.title()}:").grid(row=i, column=0, padx=10, pady=5, sticky="e")
            entry = tk.Entry(self.window, width=30)
            entry.grid(row=i, column=1, padx=10, pady=5)
            self.entries[field] = entry

        if proveedor:
            for field in fields:
                self.entries[field].insert(0, proveedor.get(field, ''))
            self.entries['codigo'].config(state='disabled')

        tk.Button(self.window, text="Guardar", bg=BTN_GREEN, fg="white", command=self.save).grid(
            row=len(fields), column=0, columnspan=2, pady=20
        )

    def save(self):
        data = {k: v.get().strip() for k, v in self.entries.items()}
        data['activo'] = True

        if self.proveedor:
            self.proveedores.update_one({"codigo": self.proveedor['codigo']}, {"$set": data})
        else:
            self.proveedores.insert_one(data)

        self.window.destroy()
        if self.callback:
            self.callback()


# =========================
# VENTANA INVENTARIO/MOVIMIENTOS
# =========================
class InventarioWindow:
    def __init__(self, parent, movimientos, productos, sucursal_codigo):
        self.movimientos = movimientos
        self.productos = productos
        self.sucursal_codigo = sucursal_codigo

        self.window = tk.Toplevel(parent)
        self.window.title("Movimientos de Inventario")
        self.window.geometry("900x500")

        # Filtros
        filter_frame = tk.Frame(self.window)
        filter_frame.pack(fill=tk.X, padx=10, pady=10)

        tk.Label(filter_frame, text="Tipo:").pack(side=tk.LEFT)
        self.tipo_var = tk.StringVar(value="TODOS")
        ttk.Combobox(
            filter_frame,
            textvariable=self.tipo_var,
            values=["TODOS", "ENTRADA", "SALIDA"],
            width=15
        ).pack(side=tk.LEFT, padx=10)

        tk.Button(filter_frame, text="Filtrar", command=self.load_data).pack(side=tk.LEFT)

        columns = ("fecha", "producto", "tipo", "motivo", "cantidad", "sucursal")
        self.tree = ttk.Treeview(self.window, columns=columns, show="headings")
        for col in columns:
            self.tree.heading(col, text=col.title())
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.load_data()

    def load_data(self):
        self.tree.delete(*self.tree.get_children())
        
        query = {"sucursal_codigo": self.sucursal_codigo}
        if self.tipo_var.get() != "TODOS":
            query["tipo"] = self.tipo_var.get()

        for mov in self.movimientos.find(query).sort("fecha", -1).limit(100):
            self.tree.insert("", tk.END, values=(
                mov['fecha'].strftime("%Y-%m-%d %H:%M"),
                mov.get('producto_nombre', mov.get('producto_codigo', '')),
                mov.get('tipo', ''),
                mov.get('motivo', ''),
                mov.get('cantidad', 0),
                mov.get('sucursal_codigo', '')
            ))


# =========================
# EJECUCION
# =========================
def run_menu(username, db_manager, user_db_name):
    root = tk.Tk()
    MenuApp(root, username, db_manager, user_db_name)
    root.mainloop()


if __name__ == "__main__":
    print("Este modulo debe ejecutarse desde Drive.py o LoginApp.py")
