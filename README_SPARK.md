# ⚡ ShellDB — Apache Spark Analytics

Guía completa para configurar y ejecutar el pipeline de análisis con **Apache Spark real** en WSL.

---

## Arquitectura

```
analisis_spark.py
    │
    ├── Lee datos de MongoDB con PySpark
    │     ventas / detalle_ventas / sucursales / productos / empleados
    │
    ├── Ejecuta 9 jobs de Spark
    │     GroupBy, Window Functions, JOIN, Pivot, approxQuantile, STDDEV...
    │
    └── Guarda resultados en MongoDB → colección spark_results
                    │
                    ▼
          Next.js /api/spark-results
                    │
                    ▼
          Dashboard de Analytics (modo oscuro)
```

---

## Prerequisitos

### 1. Java 17 (requerido por Spark)

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk-headless

# Verificar
java -version
# Debe mostrar: openjdk version "17.x.x"
```

### 2. Configurar JAVA_HOME

```bash
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
source ~/.bashrc

# Verificar
echo $JAVA_HOME
```

### 3. Python y PySpark

```bash
pip3 install pyspark pymongo python-dotenv --break-system-packages

# Verificar PySpark
python3 -c "import pyspark; print('PySpark', pyspark.__version__)"
```

---

## Instalación del conector MongoDB-Spark

El conector permite que Spark lea/escriba directamente en MongoDB.

```bash
# Crear carpeta para el JAR
mkdir -p spark_jars

# Descargar el conector (solo una vez, ~20MB)
wget -P spark_jars/ \
  https://repo1.maven.org/maven2/org/mongodb/spark/mongo-spark-connector_2.12/10.3.0/mongo-spark-connector_2.12-10.3.0.jar

# Verificar que se descargó
ls -lh spark_jars/
```

---

## Configurar .env.local

Asegúrate de que tu archivo `.env.local` en la raíz del proyecto tenga:

```env
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@cluster.mongodb.net/NOMBRE_BASE_DATOS
JWT_SECRET=tu_clave_secreta_aqui
```

> ⚠️  El script extrae el nombre de la base de datos directamente del URI.
> Asegúrate de que el URI incluya el nombre de la BD al final: `.../mi_base_datos?...`

---

## Correr el pipeline

```bash
# Desde la raíz del proyecto ShellDB
python3 analisis_spark.py
```

### Salida esperada:

```
🔥  Iniciando Apache Spark...
✅  Spark iniciado correctamente

📦  Base de datos: mi_tienda

═══════════════════════════════════════════════════════
  STEP 1 — Ingesta de datos desde MongoDB
═══════════════════════════════════════════════════════
  ventas:           1,234 registros
  detalle_ventas:   4,567 registros
  sucursales:           3 registros
  productos:          150 registros
  empleados:           12 registros
  ───────────────────────────────────
  TOTAL:            5,966 registros

═══════════════════════════════════════════════════════
  STEP 2 — Transformaciones
═══════════════════════════════════════════════════════
  Columnas derivadas de tiempo aplicadas
  Tipos de datos normalizados

═══════════════════════════════════════════════════════
  STEP 3 — Agregaciones con Spark SQL
═══════════════════════════════════════════════════════

  [3A] KPIs globales...
  ✅  Guardado: kpis
  [3B] Ventas por sucursal...
  ✅  Guardado: ventas_por_sucursal
  [3C] Series mensuales...
  ✅  Guardado: series_mensuales
  [3D] Top productos...
  ✅  Guardado: top_productos
  [3E] Análisis temporal por hora...
  ✅  Guardado: series_hora
  [3F] Ventas por día de semana...
  ✅  Guardado: series_semana
  [3G] Stock por sucursal...
  ✅  Guardado: stock_por_sucursal
  [3H] Top empleados...
  ✅  Guardado: top_empleados
  [3I] Percentiles de ventas...
  ✅  Guardado: percentiles_ventas

═══════════════════════════════════════════════════════
  STEP 4 — Guardando metadata del job
═══════════════════════════════════════════════════════
  ✅  Guardado: job_metadata

═══════════════════════════════════════════════════════
  ✅  Pipeline completado exitosamente
  📊  5,966 registros procesados
  🗃️   9 análisis guardados en MongoDB → spark_results
  🕒  2025-01-15 14:30:22
═══════════════════════════════════════════════════════
```

---

## Ver los resultados en la app

1. Asegúrate de que Next.js esté corriendo: `pnpm dev`
2. Abre el navegador en `http://localhost:3000`
3. Inicia sesión y ve a **⚡ Spark Analytics** en el menú lateral
4. Verás las 5 pestañas con todas las gráficas

---

## Programar ejecución automática (opcional)

### Con cron en WSL (cada noche a las 2am):

```bash
crontab -e
```

Agrega esta línea:
```
0 2 * * * cd /home/TU_USUARIO/ShellDB && python3 analisis_spark.py >> /tmp/spark_log.txt 2>&1
```

### Con GitHub Actions (requiere servidor propio):

Crea `.github/workflows/spark.yml` — consulta la documentación de GitHub Actions.

---

## Jobs de Spark implementados

| Job | Operación Spark | Descripción |
|-----|----------------|-------------|
| 3A | `agg(sum, avg, max, min, stddev)` | KPIs globales |
| 3B | `groupBy + agg + Window(rank)` | Ventas por sucursal con ranking |
| 3C | `groupBy + pivot` | Series mensuales por sucursal |
| 3D | `groupBy + agg + orderBy + limit` | Top 10 productos |
| 3E | `withColumn(hour) + groupBy` | Análisis por hora |
| 3F | `withColumn(dayofweek) + groupBy` | Análisis por día de semana |
| 3G | pymongo (stock no está en Spark) | Estado de inventario |
| 3H | `filter + groupBy + agg + orderBy` | Top empleados vendedores |
| 3I | `stat.approxQuantile` | Percentiles P25/P50/P75/P90/P95 |

---

## Solución de problemas

### Error: JAVA_HOME not set
```bash
source ~/.bashrc
# o
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Error: JAR no encontrado
```bash
ls spark_jars/
# Si está vacío, re-descargar el JAR (ver sección de instalación)
```

### Error: Out of Memory
Edita `analisis_spark.py` y aumenta la memoria del driver:
```python
.config("spark.driver.memory", "2g")  # cambiar de 1g a 2g
```

### Error: Can't connect to MongoDB
Verifica que `.env.local` tenga el URI correcto y que incluya el nombre de la BD:
```
mongodb+srv://user:pass@host.mongodb.net/NOMBRE_BD?retryWrites=true
```

---

## Estructura de colección spark_results en MongoDB

```json
{
  "tipo": "kpis",
  "datos": { "totalIngresos": 150000, ... },
  "procesado_en": "2025-01-15T14:30:22Z",
  "version": "spark-3.x"
}
```

Cada tipo de análisis es un documento separado, identificado por el campo `tipo`.
