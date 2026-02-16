from pymongo import MongoClient
import tkinter as tk
from tkinter import messagebox
from datetime import datetime

ATLAS_URI = "mongodb+srv://jorgefranciscodlc:74VzN1702@clustershellx.rjbicmn.mongodb.net/?appName=ClusterShellx"


class MongoDBConnection:
    def __init__(self, uri=ATLAS_URI):
        self.uri = uri
        self.client = None
        self.connect()
    
    def connect(self):
        try:
            self.client = MongoClient(self.uri)
            # Test the connection
            self.client.admin.command('ping')
            print("[v0] Conectado a MongoDB Atlas exitosamente")
        except Exception as e:
            messagebox.showerror("Error", f"Error al conectar a MongoDB Atlas: {str(e)}\n\nVerifica tu conexion a internet y las credenciales.")
            raise e
    
    def get_database(self, db_name):
        return self.client[db_name]
    
    def list_databases(self):
        """Lista todas las bases de datos"""
        return self.client.list_database_names()
    
    def database_exists(self, db_name):
        """Verifica si una base de datos existe"""
        return db_name in self.list_databases()
    
    def close(self):
        if self.client:
            self.client.close()
            print("[v0] MongoDB connection closed")
    
    def __del__(self):
        self.close()


class MongoDBManager:
    _instance = None
    
    def __new__(cls, uri=ATLAS_URI):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.connection = MongoDBConnection(uri)
        return cls._instance
    
    def get_collection(self, collection_name, db_name='proyecto'):
        db = self.connection.get_database(db_name)
        return db[collection_name]
    
    def get_database(self, db_name):
        return self.connection.get_database(db_name)
    
    def database_exists(self, db_name):
        return self.connection.database_exists(db_name)
    
    def create_user_database(self, username):
        """
        Crea una base de datos exclusiva para el usuario con la estructura
        completa de una tienda de abarrotes.
        """
        # Nombre de la base de datos del usuario (sanitizado)
        db_name = f"tienda_{username.lower().replace(' ', '_')}"
        
        # Obtener la base de datos (se crea automaticamente al insertar datos)
        user_db = self.connection.get_database(db_name)
        
        # ===== CREAR COLECCIONES CON ESTRUCTURA =====
        
        # 1. SUCURSALES
        sucursales = user_db['sucursales']
        if sucursales.count_documents({}) == 0:
            sucursales.insert_many([
                {
                    "codigo": "SUC001",
                    "nombre": "Sucursal Central",
                    "direccion": "Calle Principal #123",
                    "telefono": "555-0001",
                    "activa": True,
                    "fecha_creacion": datetime.now()
                },
                {
                    "codigo": "SUC002",
                    "nombre": "Sucursal Norte",
                    "direccion": "Av. Norte #456",
                    "telefono": "555-0002",
                    "activa": True,
                    "fecha_creacion": datetime.now()
                }
            ])
        
        # 2. CATEGORIAS DE PRODUCTOS
        categorias = user_db['categorias']
        if categorias.count_documents({}) == 0:
            categorias.insert_many([
                {"codigo": "CAT001", "nombre": "Abarrotes", "descripcion": "Productos basicos"},
                {"codigo": "CAT002", "nombre": "Lacteos", "descripcion": "Leche y derivados"},
                {"codigo": "CAT003", "nombre": "Bebidas", "descripcion": "Refrescos y aguas"},
                {"codigo": "CAT004", "nombre": "Limpieza", "descripcion": "Productos de limpieza"},
                {"codigo": "CAT005", "nombre": "Frutas y Verduras", "descripcion": "Productos frescos"}
            ])
        
        # 3. PRODUCTOS (con stock por sucursal)
        productos = user_db['productos']
        if productos.count_documents({}) == 0:
            productos.insert_many([
                {
                    "codigo": "PROD001",
                    "nombre": "Arroz 1kg",
                    "categoria_codigo": "CAT001",
                    "precio_compra": 18.00,
                    "precio_venta": 25.00,
                    "unidad": "kg",
                    "stock_por_sucursal": {
                        "SUC001": 100,
                        "SUC002": 80
                    },
                    "stock_minimo": 20,
                    "activo": True,
                    "fecha_registro": datetime.now()
                },
                {
                    "codigo": "PROD002",
                    "nombre": "Frijol 1kg",
                    "categoria_codigo": "CAT001",
                    "precio_compra": 22.00,
                    "precio_venta": 32.00,
                    "unidad": "kg",
                    "stock_por_sucursal": {
                        "SUC001": 75,
                        "SUC002": 60
                    },
                    "stock_minimo": 15,
                    "activo": True,
                    "fecha_registro": datetime.now()
                },
                {
                    "codigo": "PROD003",
                    "nombre": "Leche 1L",
                    "categoria_codigo": "CAT002",
                    "precio_compra": 18.00,
                    "precio_venta": 24.00,
                    "unidad": "litro",
                    "stock_por_sucursal": {
                        "SUC001": 50,
                        "SUC002": 45
                    },
                    "stock_minimo": 10,
                    "activo": True,
                    "fecha_registro": datetime.now()
                },
                {
                    "codigo": "PROD004",
                    "nombre": "Refresco 2L",
                    "categoria_codigo": "CAT003",
                    "precio_compra": 15.00,
                    "precio_venta": 22.00,
                    "unidad": "pieza",
                    "stock_por_sucursal": {
                        "SUC001": 120,
                        "SUC002": 90
                    },
                    "stock_minimo": 25,
                    "activo": True,
                    "fecha_registro": datetime.now()
                },
                {
                    "codigo": "PROD005",
                    "nombre": "Jabon en polvo 1kg",
                    "categoria_codigo": "CAT004",
                    "precio_compra": 35.00,
                    "precio_venta": 48.00,
                    "unidad": "kg",
                    "stock_por_sucursal": {
                        "SUC001": 40,
                        "SUC002": 35
                    },
                    "stock_minimo": 10,
                    "activo": True,
                    "fecha_registro": datetime.now()
                }
            ])
        
        # 4. EMPLEADOS (relacionados con sucursales)
        empleados = user_db['empleados']
        if empleados.count_documents({}) == 0:
            empleados.insert_many([
                {
                    "codigo": "EMP001",
                    "nombre": "Juan Perez",
                    "puesto": "Cajero",
                    "sucursal_codigo": "SUC001",
                    "telefono": "555-1001",
                    "email": "juan@tienda.com",
                    "salario": 8000.00,
                    "fecha_ingreso": datetime.now(),
                    "activo": True
                },
                {
                    "codigo": "EMP002",
                    "nombre": "Maria Garcia",
                    "puesto": "Encargada",
                    "sucursal_codigo": "SUC001",
                    "telefono": "555-1002",
                    "email": "maria@tienda.com",
                    "salario": 12000.00,
                    "fecha_ingreso": datetime.now(),
                    "activo": True
                },
                {
                    "codigo": "EMP003",
                    "nombre": "Carlos Lopez",
                    "puesto": "Cajero",
                    "sucursal_codigo": "SUC002",
                    "telefono": "555-1003",
                    "email": "carlos@tienda.com",
                    "salario": 8000.00,
                    "fecha_ingreso": datetime.now(),
                    "activo": True
                }
            ])
        
        # 5. PROVEEDORES
        proveedores = user_db['proveedores']
        if proveedores.count_documents({}) == 0:
            proveedores.insert_many([
                {
                    "codigo": "PROV001",
                    "nombre": "Distribuidora Central",
                    "contacto": "Pedro Sanchez",
                    "telefono": "555-2001",
                    "email": "ventas@distcentral.com",
                    "direccion": "Zona Industrial #100",
                    "activo": True
                },
                {
                    "codigo": "PROV002",
                    "nombre": "Lacteos del Norte",
                    "contacto": "Ana Martinez",
                    "telefono": "555-2002",
                    "email": "pedidos@lacteosnorte.com",
                    "direccion": "Carretera Norte km 5",
                    "activo": True
                }
            ])
        
        # 6. COMPRAS (a proveedores)
        compras = user_db['compras']
        # Crear indices
        compras.create_index([("fecha", -1)])
        compras.create_index([("sucursal_codigo", 1)])
        
        # 7. VENTAS
        ventas = user_db['ventas']
        # Crear indices
        ventas.create_index([("fecha", -1)])
        ventas.create_index([("sucursal_codigo", 1)])
        ventas.create_index([("empleado_codigo", 1)])
        
        # 8. DETALLE DE VENTAS
        detalle_ventas = user_db['detalle_ventas']
        detalle_ventas.create_index([("venta_id", 1)])
        detalle_ventas.create_index([("producto_codigo", 1)])
        
        # 9. DETALLE DE COMPRAS
        detalle_compras = user_db['detalle_compras']
        detalle_compras.create_index([("compra_id", 1)])
        detalle_compras.create_index([("producto_codigo", 1)])
        
        # 10. MOVIMIENTOS DE INVENTARIO (para rastrear cambios de stock)
        movimientos = user_db['movimientos_inventario']
        movimientos.create_index([("fecha", -1)])
        movimientos.create_index([("producto_codigo", 1)])
        movimientos.create_index([("sucursal_codigo", 1)])
        
        print(f"[v0] Base de datos '{db_name}' creada exitosamente con estructura de tienda")
        return db_name
    
    def get_user_database_name(self, username):
        """Obtiene el nombre de la base de datos del usuario"""
        return f"tienda_{username.lower().replace(' ', '_')}"
    
    def close(self):
        if self.connection:
            self.connection.close()


def setup_activation_codes(db_manager):
    """
    Configura codigos de activacion de ejemplo en la base de datos.
    Ejecutar una vez para crear codigos de prueba.
    """
    db = db_manager.get_database('proyecto')
    activation_codes = db['activation_codes']
    
    # Verificar si ya existen codigos
    if activation_codes.count_documents({}) == 0:
        codes = [
            {"code": "ACT001", "used": False, "created_at": datetime.now()},
            {"code": "ACT002", "used": False, "created_at": datetime.now()},
            {"code": "ACT003", "used": False, "created_at": datetime.now()},
            {"code": "DEMO2024", "used": False, "created_at": datetime.now()},
            {"code": "TIENDA001", "used": False, "created_at": datetime.now()},
        ]
        activation_codes.insert_many(codes)
        print("[v0] Codigos de activacion creados: ACT001, ACT002, ACT003, DEMO2024, TIENDA001")
    else:
        print("[v0] Los codigos de activacion ya existen")


if __name__ == "__main__":
    # Prueba de conexion y setup inicial
    manager = MongoDBManager()
    setup_activation_codes(manager)
