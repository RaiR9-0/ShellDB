import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import bcrypt
from datetime import datetime
import os


# ===== COLORES =====
YELLOW_BG = "#E9D173"      # Fondo amarillo
PANEL_BG = "#FCF3CF"       # Panel claro
FORM_BG = "#FFFFFF"        # Blanco
TEXT_DARK = "#2C3E50"
BTN_GREEN = "#27AE60"
BTN_BLUE = "#3498DB"
BTN_GRAY = "#95A5A6"
BTN_RED = "#E74C3C"


class LoginApp:
    def __init__(self, root, db_manager):
        self.root = root
        self.db_manager = db_manager
        self.root.title("Sistema de Login - Tienda de Abarrotes")
        self.root.geometry("1100x650")
        self.root.resizable(False, False)
        self.logged_user = None
        self.user_db_name = None

        try:
            self.db = self.db_manager.get_database('proyecto')
            self.users = self.db['users']
            self.activation_codes = self.db['activation_codes']
            
            # Verificar conexion listando codigos disponibles
            codes_count = self.activation_codes.count_documents({"used": False})
            print(f"[v0] Conexion exitosa. Codigos de activacion disponibles: {codes_count}")
            
            # Listar codigos para debug
            for code in self.activation_codes.find({"used": False}):
                print(f"[v0] Codigo disponible: {code.get('code', 'N/A')}")
            
            messagebox.showinfo("Conexion", "Conectado a MongoDB exitosamente")
        except Exception as e:
            messagebox.showerror("Error", f"Error al conectar a MongoDB: {str(e)}")
            return

        self.create_widgets()

    def hash_password(self, password):
        """Hashea la contrasena usando bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    def verify_password(self, password, hashed):
        """Verifica una contrasena contra su hash bcrypt"""
        if isinstance(hashed, str):
            hashed = hashed.encode('utf-8')
        return bcrypt.checkpw(password.encode('utf-8'), hashed)

    def create_widgets(self):
        # ===== FRAME PRINCIPAL (AMARILLO) =====
        self.main_frame = tk.Frame(self.root, bg=YELLOW_BG)
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        # ===== PANEL CENTRAL =====
        self.form_frame = tk.Frame(self.main_frame, bg=FORM_BG)
        self.form_frame.pack(padx=40, pady=30, fill=tk.BOTH, expand=True)

        # ===== FRAME IZQUIERDO (IMAGEN) =====
        self.left_frame = tk.Frame(self.form_frame, bg=PANEL_BG)
        self.left_frame.pack(side="left", fill=tk.BOTH, expand=True)

        # Cargar imagen o mostrar placeholder
        try:
            if os.path.exists("imagenes/login1.png"):
                image = Image.open("imagenes/login1.png")
                image = image.resize((300, 300), Image.LANCZOS)
                self.login_image = ImageTk.PhotoImage(image)
                tk.Label(
                    self.left_frame,
                    image=self.login_image,
                    bg=PANEL_BG
                ).pack(expand=True)
            else:
                # Placeholder si no existe la imagen
                tk.Label(
                    self.left_frame,
                    text="TIENDA DE\nABARROTES",
                    font=("Segoe UI", 28, "bold"),
                    bg=PANEL_BG,
                    fg=TEXT_DARK
                ).pack(expand=True)
        except Exception as e:
            print(f"[v0] Error cargando imagen: {e}")
            tk.Label(
                self.left_frame,
                text="TIENDA DE\nABARROTES",
                font=("Segoe UI", 28, "bold"),
                bg=PANEL_BG,
                fg=TEXT_DARK
            ).pack(expand=True)

        # ===== FRAME DERECHO (LOGIN / REGISTRO) =====
        self.right_frame = tk.Frame(self.form_frame, bg=FORM_BG, padx=40)
        self.right_frame.pack(side="right", fill=tk.BOTH, expand=True)

        # Inicializar variables de registro
        self.register_visible = False

        # Mostrar formulario de login por defecto
        self.show_login_form()

        # Dar foco al campo de usuario
        self.root.after(100, lambda: self.username_entry.focus_set())

    def show_login_form(self):
        """Muestra el formulario de login"""
        for widget in self.right_frame.winfo_children():
            widget.destroy()

        self.register_visible = False

        login_content = tk.Frame(self.right_frame, bg=FORM_BG)
        login_content.pack(expand=True)

        # ===== TITULO LOGIN =====
        tk.Label(
            login_content,
            text="Iniciar Sesion",
            font=("Segoe UI", 22, "bold"),
            bg=FORM_BG,
            fg=TEXT_DARK
        ).pack(pady=(0, 25))

        # ===== USUARIO =====
        tk.Label(
            login_content,
            text="Usuario",
            font=("Segoe UI", 11),
            bg=FORM_BG,
            fg=TEXT_DARK
        ).pack(anchor="w")

        self.username_entry = tk.Entry(
            login_content,
            font=("Segoe UI", 11),
            width=28,
            relief=tk.FLAT,
            bg="#ECF0F1"
        )
        self.username_entry.pack(ipady=10, pady=(0, 15), fill=tk.X)

        # ===== CONTRASENA =====
        tk.Label(
            login_content,
            text="Contrasena",
            font=("Segoe UI", 11),
            bg=FORM_BG,
            fg=TEXT_DARK
        ).pack(anchor="w")

        self.password_entry = tk.Entry(
            login_content,
            font=("Segoe UI", 11),
            width=28,
            show="*",
            relief=tk.FLAT,
            bg="#ECF0F1"
        )
        self.password_entry.pack(ipady=10, pady=(0, 25), fill=tk.X)

        # ===== BOTONES =====
        tk.Button(
            login_content,
            text="INICIAR SESION",
            font=("Segoe UI", 11, "bold"),
            bg=BTN_GREEN,
            fg="white",
            width=24,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.login
        ).pack(pady=8)

        tk.Button(
            login_content,
            text="REGISTRARSE",
            font=("Segoe UI", 11, "bold"),
            bg=BTN_BLUE,
            fg="white",
            width=24,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.show_register_form
        ).pack(pady=8)

        # Bind Enter key
        self.password_entry.bind('<Return>', lambda e: self.login())
        self.username_entry.bind('<Return>', lambda e: self.password_entry.focus_set())

        # Dar foco
        self.root.after(50, lambda: self.username_entry.focus_set())

    def show_register_form(self):
        """Muestra el formulario de registro"""
        for widget in self.right_frame.winfo_children():
            widget.destroy()

        self.register_visible = True

        register_content = tk.Frame(self.right_frame, bg=FORM_BG)
        register_content.pack(expand=True)

        # ===== TITULO REGISTRO =====
        tk.Label(
            register_content,
            text="Registro de Usuario",
            font=("Segoe UI", 20, "bold"),
            bg=FORM_BG,
            fg=TEXT_DARK
        ).pack(pady=(0, 15))

        tk.Label(
            register_content,
            text="Se creara una tienda exclusiva para ti",
            font=("Segoe UI", 9, "italic"),
            bg=FORM_BG,
            fg=BTN_GRAY
        ).pack(pady=(0, 15))

        # ===== CAMPOS DE REGISTRO =====
        fields_frame = tk.Frame(register_content, bg=FORM_BG)
        fields_frame.pack()

        # Usuario
        tk.Label(fields_frame, text="Usuario *", font=("Segoe UI", 10), bg=FORM_BG, fg=TEXT_DARK).pack(anchor="w")
        self.reg_username = tk.Entry(fields_frame, font=("Segoe UI", 10), width=32, relief=tk.FLAT, bg="#ECF0F1")
        self.reg_username.pack(ipady=8, pady=(0, 10), fill=tk.X)

        # Contrasena
        tk.Label(fields_frame, text="Contrasena * (min 6 caracteres)", font=("Segoe UI", 10), bg=FORM_BG, fg=TEXT_DARK).pack(anchor="w")
        self.reg_password = tk.Entry(fields_frame, font=("Segoe UI", 10), width=32, show="*", relief=tk.FLAT, bg="#ECF0F1")
        self.reg_password.pack(ipady=8, pady=(0, 10), fill=tk.X)

        # Confirmar contrasena
        tk.Label(fields_frame, text="Confirmar Contrasena *", font=("Segoe UI", 10), bg=FORM_BG, fg=TEXT_DARK).pack(anchor="w")
        self.reg_password_confirm = tk.Entry(fields_frame, font=("Segoe UI", 10), width=32, show="*", relief=tk.FLAT, bg="#ECF0F1")
        self.reg_password_confirm.pack(ipady=8, pady=(0, 10), fill=tk.X)

        # Email
        tk.Label(fields_frame, text="Correo Electronico *", font=("Segoe UI", 10), bg=FORM_BG, fg=TEXT_DARK).pack(anchor="w")
        self.reg_email = tk.Entry(fields_frame, font=("Segoe UI", 10), width=32, relief=tk.FLAT, bg="#ECF0F1")
        self.reg_email.pack(ipady=8, pady=(0, 10), fill=tk.X)

        # Telefono
        tk.Label(fields_frame, text="Telefono *", font=("Segoe UI", 10), bg=FORM_BG, fg=TEXT_DARK).pack(anchor="w")
        self.reg_phone = tk.Entry(fields_frame, font=("Segoe UI", 10), width=32, relief=tk.FLAT, bg="#ECF0F1")
        self.reg_phone.pack(ipady=8, pady=(0, 10), fill=tk.X)

        # Codigo de activacion
        tk.Label(fields_frame, text="Codigo de Activacion *", font=("Segoe UI", 10, "bold"), bg=FORM_BG, fg=BTN_RED).pack(anchor="w")
        self.reg_activation_code = tk.Entry(fields_frame, font=("Segoe UI", 10), width=32, relief=tk.FLAT, bg="#FADBD8")
        self.reg_activation_code.pack(ipady=8, pady=(0, 15), fill=tk.X)

        # ===== BOTONES REGISTRO =====
        tk.Button(
            register_content,
            text="REGISTRAR Y CREAR MI TIENDA",
            font=("Segoe UI", 10, "bold"),
            bg=BTN_GREEN,
            fg="white",
            width=28,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.submit_registration
        ).pack(pady=8)

        tk.Button(
            register_content,
            text="VOLVER A LOGIN",
            font=("Segoe UI", 10, "bold"),
            bg=BTN_GRAY,
            fg="white",
            width=28,
            height=2,
            relief=tk.FLAT,
            cursor="hand2",
            command=self.show_login_form
        ).pack(pady=8)

        # Dar foco
        self.root.after(50, lambda: self.reg_username.focus_set())

    # ===== FUNCIONES DE AUTENTICACION =====
    def login(self):
        """Funcion de inicio de sesion"""
        username = self.username_entry.get().strip()
        password = self.password_entry.get()

        if not username or not password:
            messagebox.showwarning("Advertencia", "Por favor complete todos los campos")
            return

        print(f"[v0] Intentando login para usuario: {username}")

        # Buscar usuario en la base de datos
        user = self.users.find_one({"username": username})

        if user:
            print(f"[v0] Usuario encontrado: {user.get('username')}")
            print(f"[v0] Base de datos del usuario: {user.get('database_name', 'No asignada')}")
            
            if self.verify_password(password, user['password']):
                self.logged_user = username
                self.user_db_name = user.get('database_name')
                
                if not self.user_db_name:
                    # Si el usuario no tiene base de datos asignada, crearla
                    self.user_db_name = self.db_manager.create_user_database(username)
                    self.users.update_one(
                        {"username": username},
                        {"$set": {"database_name": self.user_db_name}}
                    )
                
                messagebox.showinfo("Exito", f"Bienvenido {username}!\nAccediendo a tu tienda: {self.user_db_name}")
                self.open_menu()
            else:
                print("[v0] Contrasena incorrecta")
                messagebox.showerror("Error", "Usuario o contrasena incorrectos")
        else:
            print("[v0] Usuario no encontrado")
            messagebox.showerror("Error", "Usuario o contrasena incorrectos")

    def validate_activation_code(self, code):
        """
        Valida un codigo de activacion en MongoDB.
        Busca EXACTAMENTE en el campo 'code' de la coleccion 'activation_codes'.
        """
        code = code.strip().upper()  # Normalizar el codigo
        print(f"[v0] Validando codigo de activacion: '{code}'")
        
        try:
            # Buscar el codigo exacto
            activation_code = self.activation_codes.find_one({
                "code": code,
                "used": False
            })
            
            if activation_code:
                print(f"[v0] Codigo encontrado y valido: {activation_code}")
                return activation_code
            
            # Si no se encuentra, buscar sin importar mayusculas/minusculas
            activation_code = self.activation_codes.find_one({
                "code": {"$regex": f"^{code}$", "$options": "i"},
                "used": False
            })
            
            if activation_code:
                print(f"[v0] Codigo encontrado (case insensitive): {activation_code}")
                return activation_code
            
            # Verificar si el codigo existe pero ya fue usado
            used_code = self.activation_codes.find_one({"code": code})
            if used_code:
                print(f"[v0] El codigo existe pero ya fue usado: {used_code}")
                return None
            
            # Listar todos los codigos disponibles para debug
            print("[v0] Codigos disponibles en la base de datos:")
            for c in self.activation_codes.find():
                print(f"  - code: '{c.get('code')}', used: {c.get('used')}")
            
            print(f"[v0] Codigo '{code}' NO encontrado en la base de datos")
            return None
            
        except Exception as e:
            print(f"[v0] Error al validar codigo de activacion: {e}")
            return None

    def mark_code_as_used(self, code, username):
        """Marca un codigo de activacion como usado"""
        code = code.strip().upper()
        try:
            result = self.activation_codes.update_one(
                {"code": {"$regex": f"^{code}$", "$options": "i"}},
                {
                    "$set": {
                        "used": True,
                        "used_by": username,
                        "used_at": datetime.now()
                    }
                }
            )
            print(f"[v0] Codigo marcado como usado. Documentos modificados: {result.modified_count}")
        except Exception as e:
            print(f"[v0] Error al marcar codigo como usado: {e}")

    def register_user(self, username, password, password_confirm, email, phone, activation_code):
        """
        Registra un nuevo usuario y crea su base de datos exclusiva.
        """
        # Validar campos obligatorios
        if not all([username, password, password_confirm, email, phone, activation_code]):
            return False, "Todos los campos son obligatorios"

        # Validar que las contrasenas coincidan
        if password != password_confirm:
            return False, "Las contrasenas no coinciden"

        # Validar longitud de contrasena
        if len(password) < 6:
            return False, "La contrasena debe tener al menos 6 caracteres"

        # Validar formato de email basico
        if "@" not in email or "." not in email:
            return False, "El correo electronico no es valido"

        # Verificar si el usuario ya existe
        if self.users.find_one({"username": username}):
            return False, "El nombre de usuario ya existe"

        # Verificar si el email ya existe
        if self.users.find_one({"email": email}):
            return False, "El correo electronico ya esta registrado"

        # Validar codigo de activacion
        print(f"[v0] Iniciando validacion del codigo: {activation_code}")
        code_doc = self.validate_activation_code(activation_code)
        
        if not code_doc:
            return False, "Codigo de activacion invalido o ya utilizado.\nCodigos validos: ACT001, ACT002, ACT003, DEMO2024, TIENDA001"

        try:
            # Crear la base de datos exclusiva del usuario
            user_db_name = self.db_manager.create_user_database(username)
            
            # Crear el usuario con referencia a su base de datos
            user_doc = {
                "username": username,
                "password": self.hash_password(password),
                "email": email,
                "phone": phone,
                "database_name": user_db_name,  # Nombre de la BD exclusiva
                "activation_code_used": activation_code.strip().upper(),
                "created_at": datetime.now(),
                "last_login": None,
                "active": True
            }
            
            self.users.insert_one(user_doc)
            print(f"[v0] Usuario creado: {username}")
            print(f"[v0] Base de datos asignada: {user_db_name}")

            # Marcar el codigo como usado
            self.mark_code_as_used(activation_code, username)

            return True, f"Usuario registrado exitosamente!\n\nSe ha creado tu tienda: {user_db_name}\n\nYa puedes iniciar sesion."

        except Exception as e:
            print(f"[v0] Error al registrar usuario: {e}")
            return False, f"Error al registrar usuario: {str(e)}"

    def submit_registration(self):
        """Procesa el formulario de registro"""
        username = self.reg_username.get().strip()
        password = self.reg_password.get()
        password_confirm = self.reg_password_confirm.get()
        email = self.reg_email.get().strip()
        phone = self.reg_phone.get().strip()
        activation_code = self.reg_activation_code.get().strip()

        # Llamar a la funcion de registro
        success, message = self.register_user(
            username, password, password_confirm, email, phone, activation_code
        )

        if success:
            messagebox.showinfo("Exito", message)
            self.show_login_form()
        else:
            messagebox.showerror("Error", message)

    def open_menu(self):
        """Abre el menu principal con la base de datos del usuario"""
        self.root.destroy()
        import menu
        menu.run_menu(self.logged_user, self.db_manager, self.user_db_name)


def run_login(db_manager):
    root = tk.Tk()
    app = LoginApp(root, db_manager)
    root.mainloop()


if __name__ == "__main__":
    import ConectionDB
    db_manager = ConectionDB.MongoDBManager()
    run_login(db_manager)
