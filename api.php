<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==================== CONFIGURACIÓN BD ====================
$host = 'localhost';
$dbname = 'venepan_db';
$username = 'root';
$password = 'venepan123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ==================== FUNCIONES DE PANIFICACION ====================
function getProduccionPan($pdo, $mes, $anio) {
    $sql = "SELECT p.*, pr.nombre_pro, pr.peso_u 
            FROM produccion_panes p
            JOIN productos pr ON p.id_producto = pr.id_producto
            WHERE MONTH(p.fecha) = ? AND YEAR(p.fecha) = ?
            ORDER BY p.fecha DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mes, $anio]);
    return $stmt->fetchAll();
}

function saveProduccionPan($pdo, $data) {
    $sql = "INSERT INTO produccion_panes 
            (id_producto, fecha, medidas, paquetes, unidades, bd, rendimiento, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        $data['id_producto'],
        $data['fecha'],
        $data['medidas'] ?? 0,
        $data['paquetes'] ?? 0,
        $data['unidades'] ?? 0,
        $data['bd'] ?? 0,
        $data['rendimiento'] ?? 0,
        $data['observaciones'] ?? null
    ]);
    if ($success) {
        return $pdo->lastInsertId();
    } else {
        return false;
    }
}

function updateProduccionPan($pdo, $id, $data) {
    $sql = "UPDATE produccion_panes 
            SET id_producto = ?, fecha = ?, medidas = ?, paquetes = ?, 
                unidades = ?, bd = ?, rendimiento = ?, observaciones = ?
            WHERE id_produccion = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        $data['id_producto'],
        $data['fecha'],
        $data['medidas'] ?? 0,
        $data['paquetes'] ?? 0,
        $data['unidades'] ?? 0,
        $data['bd'] ?? 0,
        $data['rendimiento'] ?? 0,
        $data['observaciones'] ?? null,
        $id
    ]);
}

function deleteProduccionPan($pdo, $id) {
    $sql = "DELETE FROM produccion_panes WHERE id_produccion = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([$id]);
}

// ==================== FUNCIONES DE PRODUCTOS ====================
function getProductos($pdo, $categoria = null) {
    $sql = "SELECT p.*, c.nombre_cat 
            FROM productos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.activo = 1";
    if ($categoria) {
        $sql .= " AND c.nombre_cat = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$categoria]);
    } else {
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
    }
    return $stmt->fetchAll();
}

// ==================== FUNCIONES DE ESTADÍSTICAS ====================
function getStats($pdo) {
    $stats = [];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM productos WHERE activo = 1");
    $stats['total_productos'] = $stmt->fetch()['total'];
    
    $stmt = $pdo->prepare("SELECT SUM(medidas) as total FROM produccion_panes WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?");
    $stmt->execute([date('m'), date('Y')]);
    $stats['produccion_mes'] = $stmt->fetch()['total'] ?? 0;
    
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM empleados");
        $stats['total_empleados'] = $stmt->fetch()['total'];
    } catch (PDOException $e) {
        $stats['total_empleados'] = 0;
    }
    
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM materia_prima WHERE stock_kg < 10 AND stock_kg > 0");
        $stats['bajo_stock'] = $stmt->fetch()['total'];
    } catch (PDOException $e) {
        $stats['bajo_stock'] = 0;
    }
    
    return $stats;
}

// ==================== FUNCIONES DE CEREALES ====================
function getProduccionCereales($pdo, $mes, $anio) {
    $sql = "SELECT * FROM cereales_produccion 
            WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? 
            ORDER BY fecha DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mes, $anio]);
    return $stmt->fetchAll();
}

function saveProduccionCereales($pdo, $data) {
    if (isset($data['id']) && $data['id'] > 0) {
        $sql = "UPDATE cereales_produccion SET 
                tipo_cereal = ?, fecha = ?, medida_base = ?, medida_jarabe = ?,
                base_reproceso = ?, jarabe_reproceso = ?, total_medidas = ?,
                sobrante_seca = ?, sobrante_jarabe = ?, total_mezcla_procesada = ?,
                medidas_procesadas = ?, bobina = ?, primera = ?, segunda = ?,
                desecho_mezcla = ?, desecho_marmita = ?, desecho_empaque = ?,
                empaque_danado = ?, total_producido = ?, merma = ?,
                total_sin_desecho = ?, medida_base_en = ?, medida_jarabe_en = ?,
                uni_teorica = ?, prod_teorica = ?
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['tipo_cereal'], $data['fecha'], $data['medida_base'], $data['medida_jarabe'],
            $data['base_reproceso'], $data['jarabe_reproceso'], $data['total_medidas'],
            $data['sobrante_seca'], $data['sobrante_jarabe'], $data['total_mezcla_procesada'],
            $data['medidas_procesadas'], $data['bobina'], $data['primera'], $data['segunda'],
            $data['desecho_mezcla'], $data['desecho_marmita'], $data['desecho_empaque'],
            $data['empaque_danado'], $data['total_producido'], $data['merma'],
            $data['total_sin_desecho'], $data['medida_base_en'], $data['medida_jarabe_en'],
            $data['uni_teorica'], $data['prod_teorica'], $data['id']
        ]);
    } else {
        $sql = "INSERT INTO cereales_produccion (
                tipo_cereal, fecha, medida_base, medida_jarabe, base_reproceso, jarabe_reproceso,
                total_medidas, sobrante_seca, sobrante_jarabe, total_mezcla_procesada,
                medidas_procesadas, bobina, primera, segunda, desecho_mezcla, desecho_marmita,
                desecho_empaque, empaque_danado, total_producido, merma, total_sin_desecho,
                medida_base_en, medida_jarabe_en, uni_teorica, prod_teorica
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['tipo_cereal'], $data['fecha'], $data['medida_base'], $data['medida_jarabe'],
            $data['base_reproceso'], $data['jarabe_reproceso'], $data['total_medidas'],
            $data['sobrante_seca'], $data['sobrante_jarabe'], $data['total_mezcla_procesada'],
            $data['medidas_procesadas'], $data['bobina'], $data['primera'], $data['segunda'],
            $data['desecho_mezcla'], $data['desecho_marmita'], $data['desecho_empaque'],
            $data['empaque_danado'], $data['total_producido'], $data['merma'],
            $data['total_sin_desecho'], $data['medida_base_en'], $data['medida_jarabe_en'],
            $data['uni_teorica'], $data['prod_teorica']
        ]);
    }
}

function deleteProduccionCereales($pdo, $id) {
    $sql = "DELETE FROM cereales_produccion WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([$id]);
}

// ==================== FUNCIONES DE DESPACHO CEREALES ====================
function getDespachoCereales($pdo, $mes, $anio) {
    $sql = "SELECT * FROM cereales_despacho 
            WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? 
            ORDER BY fecha DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mes, $anio]);
    return $stmt->fetchAll();
}

function saveDespachoCereales($pdo, $data) {
    if (isset($data['id']) && $data['id'] > 0) {
        $sql = "UPDATE cereales_despacho SET 
                lote = ?, fecha = ?, u12 = ?, u8 = ?, uL = ?, 
                b12 = ?, b8 = ?, bL = ?, kg = ?, u2da = ?, 
                viruta = ?, desecho = ?, rend = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['lote'], $data['fecha'], $data['u12'], $data['u8'], $data['uL'],
            $data['b12'], $data['b8'], $data['bL'], $data['kg'], $data['u2da'],
            $data['viruta'], $data['desecho'], $data['rend'], $data['id']
        ]);
    } else {
        $sql = "INSERT INTO cereales_despacho (
                lote, fecha, u12, u8, uL, b12, b8, bL, kg, u2da, viruta, desecho, rend
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['lote'], $data['fecha'], $data['u12'], $data['u8'], $data['uL'],
            $data['b12'], $data['b8'], $data['bL'], $data['kg'], $data['u2da'],
            $data['viruta'], $data['desecho'], $data['rend']
        ]);
    }
}

function deleteDespachoCereales($pdo, $id) {
    $sql = "DELETE FROM cereales_despacho WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([$id]);
}

// ==================== FUNCIONES DE SOYA ====================
function getProduccionSoya($pdo, $mes, $anio) {
    $sql = "SELECT ps.*, pv.nombre_provee 
            FROM produccion_soya ps
            LEFT JOIN proveedores pv ON ps.id_proveedor = pv.id_proveedor
            WHERE MONTH(ps.fecha) = ? AND YEAR(ps.fecha) = ?
            ORDER BY ps.fecha DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mes, $anio]);
    return $stmt->fetchAll();
}

function saveProduccionSoya($pdo, $data) {
    error_log("=== saveProduccionSoya ===");
    error_log("Datos recibidos: " . json_encode($data));
    
    $id_producto = isset($data['id_producto']) ? $data['id_producto'] : 12;
    
    if (isset($data['id_soya']) && $data['id_soya'] > 0) {
        $sql = "UPDATE produccion_soya SET 
                id_producto = ?, fecha = ?, lote = ?, medidas = ?, soya_desgranada = ?,
                azufre = ?, humedad = ?, primera = ?, desecho_humedo = ?,
                desecho_seco = ?, total_producido = ?, id_proveedor = ?
                WHERE id_soya = ?";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $id_producto, $data['fecha'], $data['lote'], $data['medidas'], $data['soya_desgranada'],
            $data['azufre'], $data['humedad'], $data['primera'], $data['desecho_humedo'],
            $data['desecho_seco'], $data['total_producido'], $data['id_proveedor'], $data['id_soya']
        ]);
        error_log("UPDATE result: " . ($result ? "true" : "false"));
        return $result;
    } else {
        $sql = "INSERT INTO produccion_soya (
                id_producto, fecha, lote, medidas, soya_desgranada, azufre, humedad,
                primera, desecho_humedo, desecho_seco, total_producido, id_proveedor
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $id_producto, $data['fecha'], $data['lote'], $data['medidas'], $data['soya_desgranada'],
            $data['azufre'], $data['humedad'], $data['primera'], $data['desecho_humedo'],
            $data['desecho_seco'], $data['total_producido'], $data['id_proveedor']
        ]);
        error_log("INSERT result: " . ($result ? "true" : "false"));
        if (!$result) {
            error_log("PDO Error: " . json_encode($stmt->errorInfo()));
        }
        return $result;
    }
}

function deleteProduccionSoya($pdo, $id) {
    $sql = "DELETE FROM produccion_soya WHERE id_soya = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([$id]);
}

// ===== DESPACHO SOYA =====
function getDespachoSoya($pdo, $mes, $anio) {
    $sql = "SELECT * FROM soya_despacho 
            WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
            ORDER BY fecha DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mes, $anio]);
    return $stmt->fetchAll();
}

function saveDespachoSoya($pdo, $data) {
    if (isset($data['id_despacho']) && $data['id_despacho'] > 0) {
        $sql = "UPDATE soya_despacho SET 
                lote = ?, fecha = ?, u125g = ?, u250g = ?, u8kg = ?, u12kg = ?, total_kg = ?
                WHERE id_despacho = ?";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['lote'], $data['fecha'], $data['u125g'], $data['u250g'],
            $data['u8kg'], $data['u12kg'], $data['total_kg'], $data['id_despacho']
        ]);
    } else {
        $sql = "INSERT INTO soya_despacho (lote, fecha, u125g, u250g, u8kg, u12kg, total_kg)
                VALUES (?,?,?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['lote'], $data['fecha'], $data['u125g'], $data['u250g'],
            $data['u8kg'], $data['u12kg'], $data['total_kg']
        ]);
    }
}

function deleteDespachoSoya($pdo, $id) {
    $sql = "DELETE FROM soya_despacho WHERE id_despacho = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([$id]);
}

// ==================== FUNCIONES MATERIA PRIMA ====================
function getInventarioMateria($pdo, $tipo = null) {
    $sql = "SELECT l.id_lote, l.numero_lote, l.cantidad_disponible, l.fecha_elaboracion, l.fecha_vencimiento,
                   e.producto, e.proveedor, e.tipo, e.peso_presentacion
            FROM lotes_mp l
            JOIN entradas_mp e ON l.id_entrada = e.id_entrada
            WHERE l.cantidad_disponible > 0";
    if ($tipo) {
        $sql .= " AND e.tipo = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tipo]);
    } else {
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
    }
    return $stmt->fetchAll();
}

function getHistorialMateriaGlobal($pdo, $mes = null, $anio = null, $tipo_movimiento = null) {
    $sql = "SELECT m.*, e.producto, l.numero_lote, e.tipo
            FROM movimientos_mp m
            JOIN lotes_mp l ON m.id_lote = l.id_lote
            JOIN entradas_mp e ON l.id_entrada = e.id_entrada
            WHERE 1=1";
    $params = [];
    if ($mes && $anio) {
        $sql .= " AND MONTH(m.fecha) = ? AND YEAR(m.fecha) = ?";
        $params[] = $mes; $params[] = $anio;
    }
    if ($tipo_movimiento && $tipo_movimiento !== 'todos') {
        $sql .= " AND m.tipo = ?";
        $params[] = $tipo_movimiento;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function getHistorialMateria($pdo, $mes = null, $anio = null, $tipo = null) {
    $sql = "SELECT m.*, e.producto, l.numero_lote
            FROM movimientos_mp m
            JOIN lotes_mp l ON m.id_lote = l.id_lote
            JOIN entradas_mp e ON l.id_entrada = e.id_entrada";
    $conditions = [];
    $params = [];
    if ($mes && $anio) {
        $conditions[] = "MONTH(m.fecha) = ? AND YEAR(m.fecha) = ?";
        $params[] = $mes; $params[] = $anio;
    }
    if ($tipo) {
        $conditions[] = "e.tipo = ?";
        $params[] = $tipo;
    }
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function registrarEntradaMateria($pdo, $data) {
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO entradas_mp 
            (fecha, tipo, producto, peso_presentacion, proveedor, n_factura, tobos, cajas, bultos, tambores, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['fecha'], $data['tipo'], $data['producto'],
            $data['peso_presentacion'] ?? null, $data['proveedor'] ?? null, $data['n_factura'] ?? null,
            $data['tobos'] ?? 0, $data['cajas'] ?? 0, $data['bultos'] ?? 0,
            $data['tambores'] ?? 0, $data['observaciones'] ?? null
        ]);
        $id_entrada = $pdo->lastInsertId();
        foreach ($data['lotes'] as $lote) {
            $stmt2 = $pdo->prepare("INSERT INTO lotes_mp 
                (id_entrada, numero_lote, cantidad, fecha_elaboracion, fecha_vencimiento, cantidad_disponible)
                VALUES (?, ?, ?, ?, ?, ?)");
            $stmt2->execute([
                $id_entrada, $lote['numero_lote'], $lote['cantidad'],
                $lote['fecha_elaboracion'] ?? null, $lote['fecha_vencimiento'] ?? null, $lote['cantidad']
            ]);
            $id_lote = $pdo->lastInsertId();
            $stmt3 = $pdo->prepare("INSERT INTO movimientos_mp (id_lote, tipo, cantidad, detalle) VALUES (?, 'entrada', ?, ?)");
            $stmt3->execute([$id_lote, $lote['cantidad'], "Ingreso inicial lote {$lote['numero_lote']}"]);
        }
        $pdo->commit();
        return ['success' => true, 'id_entrada' => $id_entrada];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

function registrarSalidaMateria($pdo, $producto_nombre, $cantidad, $detalle, $modulo_origen = 'inventario', $referencia_id = null, $tipo = null) {
    try {
        $pdo->beginTransaction();
        $sql = "SELECT l.* FROM lotes_mp l
                JOIN entradas_mp e ON l.id_entrada = e.id_entrada
                WHERE e.producto = ?";
        $params = [$producto_nombre];
        if ($tipo) {
            $sql .= " AND e.tipo = ?";
            $params[] = $tipo;
        }
        $sql .= " AND l.cantidad_disponible > 0
                  ORDER BY l.fecha_elaboracion ASC, l.id_lote ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $lotes = $stmt->fetchAll();
        
        if (empty($lotes)) throw new Exception("No hay stock disponible de $producto_nombre");
        
        $restante = $cantidad;
        $movimientos = [];
        foreach ($lotes as $lote) {
            if ($restante <= 0) break;
            $a_consumir = min($lote['cantidad_disponible'], $restante);
            $update = $pdo->prepare("UPDATE lotes_mp SET cantidad_disponible = cantidad_disponible - ? WHERE id_lote = ?");
            $update->execute([$a_consumir, $lote['id_lote']]);
            $insert = $pdo->prepare("INSERT INTO movimientos_mp (id_lote, tipo, cantidad, detalle, modulo_origen, referencia_id) VALUES (?, 'salida', ?, ?, ?, ?)");
            $insert->execute([$lote['id_lote'], $a_consumir, $detalle, $modulo_origen, $referencia_id]);
            $movimientos[] = $insert->lastInsertId();
            $restante -= $a_consumir;
        }
        if ($restante > 0) throw new Exception("Stock insuficiente. Faltan $restante kg");
        $pdo->commit();
        return ['success' => true, 'movimientos' => $movimientos];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

function updateLoteMateria($pdo, $id_lote, $data) {
    $sql = "UPDATE lotes_mp SET cantidad_disponible = ?, fecha_elaboracion = ?, fecha_vencimiento = ? WHERE id_lote = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        $data['cantidad_disponible'],
        $data['fecha_elaboracion'],
        $data['fecha_vencimiento'],
        $id_lote
    ]);
}

function deleteLoteMateria($pdo, $id_lote) {
    // Primero eliminar movimientos asociados
    $stmt = $pdo->prepare("DELETE FROM movimientos_mp WHERE id_lote = ?");
    $stmt->execute([$id_lote]);
    // Luego eliminar el lote
    $stmt = $pdo->prepare("DELETE FROM lotes_mp WHERE id_lote = ?");
    return $stmt->execute([$id_lote]);
}

function clearHistorialMateria($pdo) {
    $sql = "DELETE FROM movimientos_mp";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute();
}

// ==================== FUNCIONES DE EMPLEADOS ====================
function getEmpleados($pdo) {
    $sql = "SELECT * FROM empleados ORDER BY apellido, nombre";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
}

function saveEmpleado($pdo, $data) {
    if (!empty($data['editando']) && $data['editando'] === true) {
        $sql = "UPDATE empleados SET 
                nombre=?, apellido=?, fecha_nac=?, fecha_ingreso=?, telefono=?, correo=?, 
                direccion=?, hijos=?, estudiante=?, talla_camisa=?, talla_pantalon=?, 
                talla_zapato=?, condicion_medica=?, alergias=?, religion=?, estado_civil=?, 
                cargo=?, salario=? 
                WHERE cedula=?";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $data['nombre'], $data['apellido'], $data['fecha_nac'], $data['fecha_ingreso'],
            $data['telefono'], $data['correo'], $data['direccion'], $data['hijos'],
            $data['estudiante'], $data['talla_camisa'], $data['talla_pantalon'], $data['talla_zapato'],
            $data['condicion_medica'], $data['alergias'], $data['religion'], $data['estado_civil'],
            $data['cargo'], $data['salario'], $data['cedula']
        ]);
        return ['success' => $result, 'message' => $result ? 'Empleado actualizado' : 'Error al actualizar'];
    } else {
        $sql = "INSERT INTO empleados (
                cedula, nombre, apellido, fecha_nac, fecha_ingreso, telefono, correo, direccion,
                hijos, estudiante, talla_camisa, talla_pantalon, talla_zapato, condicion_medica,
                alergias, religion, estado_civil, cargo, salario
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            $data['cedula'], $data['nombre'], $data['apellido'], $data['fecha_nac'], $data['fecha_ingreso'],
            $data['telefono'], $data['correo'], $data['direccion'], $data['hijos'], $data['estudiante'],
            $data['talla_camisa'], $data['talla_pantalon'], $data['talla_zapato'], $data['condicion_medica'],
            $data['alergias'], $data['religion'], $data['estado_civil'], $data['cargo'], $data['salario']
        ]);
        return ['success' => $result, 'message' => $result ? 'Empleado registrado' : 'Error al registrar'];
    }
}

function deleteEmpleado($pdo, $cedula) {
    $sql = "DELETE FROM empleados WHERE cedula = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$cedula]);
    return ['success' => $result, 'message' => $result ? 'Empleado eliminado' : 'Error al eliminar'];
}

// ==================== FUNCIONES DE INVENTARIO DE PIEZAS ====================
function getPiezas($pdo) {
    $sql = "SELECT * FROM piezas_maquinas ORDER BY nombre_pieza";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
}

function getPieza($pdo, $id) {
    $sql = "SELECT * FROM piezas_maquinas WHERE id_pieza = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function savePieza($pdo, $data) {
    if (isset($data['id_pieza']) && $data['id_pieza'] > 0) {
        $sql = "UPDATE piezas_maquinas SET codigo=?, nombre_pieza=?, maquina_asociada=?, categoria=?,
                stock_actual=?, stock_minimo=?, ubicacion=?, proveedor=?, precio_compra=?, estado=?, observaciones=?
                WHERE id_pieza=?";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['codigo'], $data['nombre_pieza'], $data['maquina_asociada'], $data['categoria'],
            $data['stock_actual'], $data['stock_minimo'], $data['ubicacion'], $data['proveedor'],
            $data['precio_compra'], $data['estado'], $data['observaciones'], $data['id_pieza']
        ]);
    } else {
        $sql = "INSERT INTO piezas_maquinas (codigo, nombre_pieza, maquina_asociada, categoria,
                stock_actual, stock_minimo, ubicacion, proveedor, precio_compra, estado, observaciones)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['codigo'], $data['nombre_pieza'], $data['maquina_asociada'], $data['categoria'],
            $data['stock_actual'], $data['stock_minimo'], $data['ubicacion'], $data['proveedor'],
            $data['precio_compra'], $data['estado'], $data['observaciones']
        ]);
    }
}

function deletePieza($pdo, $id) {
    $sql = "DELETE FROM piezas_maquinas WHERE id_pieza = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([$id]);
}

function getMaquinas($pdo) {
    $sql = "SELECT * FROM maquinas ORDER BY nombre_maquina";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
}

function getMaquina($pdo, $id) {
    $sql = "SELECT * FROM maquinas WHERE id_maquina = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function saveMaquina($pdo, $data) {
    if (isset($data['id_maquina']) && $data['id_maquina'] > 0) {
        $sql = "UPDATE maquinas SET nombre_maquina=?, modelo=?, marca=?, ubicacion=?,
                estado=?, fecha_instalacion=?, ultimo_mantenimiento=?, responsable=?, observaciones=?
                WHERE id_maquina=?";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['nombre_maquina'], $data['modelo'], $data['marca'], $data['ubicacion'],
            $data['estado'], $data['fecha_instalacion'], $data['ultimo_mantenimiento'],
            $data['responsable'], $data['observaciones'], $data['id_maquina']
        ]);
    } else {
        $sql = "INSERT INTO maquinas (nombre_maquina, modelo, marca, ubicacion, estado,
                fecha_instalacion, ultimo_mantenimiento, responsable, observaciones)
                VALUES (?,?,?,?,?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            $data['nombre_maquina'], $data['modelo'], $data['marca'], $data['ubicacion'],
            $data['estado'], $data['fecha_instalacion'], $data['ultimo_mantenimiento'],
            $data['responsable'], $data['observaciones']
        ]);
    }
}

function deleteMaquina($pdo, $id) {
    $sql = "DELETE FROM maquinas WHERE id_maquina = ?";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([$id]);
}

function getMovimientosPiezas($pdo) {
    $sql = "SELECT m.*, p.codigo, p.nombre_pieza 
            FROM movimientos_piezas m
            JOIN piezas_maquinas p ON m.id_pieza = p.id_pieza
            ORDER BY m.fecha_movimiento DESC LIMIT 100";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll();
}

function saveMovimientoPieza($pdo, $data) {
    $updateStock = $data['tipo_movimiento'] === 'ENTRADA' 
        ? "UPDATE piezas_maquinas SET stock_actual = stock_actual + ? WHERE id_pieza = ?"
        : "UPDATE piezas_maquinas SET stock_actual = stock_actual - ? WHERE id_pieza = ?";
    
    $stmt = $pdo->prepare($updateStock);
    $stmt->execute([$data['cantidad'], $data['id_pieza']]);
    
    $sql = "INSERT INTO movimientos_piezas (id_pieza, tipo_movimiento, cantidad, motivo, usuario)
            VALUES (?,?,?,?,?)";
    $stmt = $pdo->prepare($sql);
    return $stmt->execute([
        $data['id_pieza'], $data['tipo_movimiento'], $data['cantidad'],
        $data['motivo'] ?? null, $_SERVER['REMOTE_ADDR']
    ]);
}

// ==================== FUNCIONES DE EMPAQUES  ====================
function getEmpaques($pdo, $mes = null, $anio = null) {
    return [];
}

function saveEmpaque($pdo, $data) {
    // TODO: implementar
    return ['success' => false, 'message' => 'Módulo de empaques no implementado'];
}

function deleteEmpaque($pdo, $id) {
    return ['success' => false, 'message' => 'Módulo de empaques no implementado'];
}

// Obtener receta de un producto
function getReceta($pdo, $id_producto, $tipo_produccion) {
    $sql = "SELECT r.id_receta, ri.nombre_insumo, ri.cantidad_kg 
            FROM recetas r 
            JOIN receta_insumos ri ON r.id_receta = ri.id_receta
            WHERE r.id_producto = ? AND r.tipo_produccion = ? AND r.activo = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_producto, $tipo_produccion]);
    return $stmt->fetchAll();
}

function descontarInsumosProduccion($pdo, $id_produccion, $modulo, $insumos) {
    try {
        $pdo->beginTransaction();
        foreach ($insumos as $nombre_insumo => $cantidad) {
            $result = registrarSalidaMateria($pdo, $nombre_insumo, $cantidad, "Consumo para producción $modulo ID $id_produccion", $modulo, $id_produccion, 'materia_prima');
            if (!$result['success']) {
                throw new Exception($result['message']);
            }
        }
        $pdo->commit();
        return ['success' => true];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
// ==================== funciones de recetas  ====================
function listarRecetas($pdo) {
    $sql = "SELECT r.id_receta, r.id_producto, p.nombre_pro, r.tipo_produccion,
                   GROUP_CONCAT(CONCAT(ri.nombre_insumo, ':', ri.cantidad_kg) SEPARATOR '|') AS insumos
            FROM recetas r
            JOIN productos p ON r.id_producto = p.id_producto
            LEFT JOIN receta_insumos ri ON r.id_receta = ri.id_receta
            WHERE r.activo = 1
            GROUP BY r.id_receta";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $recetas = $stmt->fetchAll();
    foreach ($recetas as &$rec) {
        $insumosArray = [];
        if ($rec['insumos']) {
            $pares = explode('|', $rec['insumos']);
            foreach ($pares as $par) {
                list($nombre, $cantidad) = explode(':', $par);
                $insumosArray[] = ['nombre' => $nombre, 'cantidad' => $cantidad];
            }
        }
        $rec['insumos'] = $insumosArray;
    }
    return $recetas;
}

function guardarReceta($pdo, $data) {
    try {
        $pdo->beginTransaction();
        if (isset($data['id_receta']) && $data['id_receta'] > 0) {
            // Actualizar
            $stmt = $pdo->prepare("UPDATE recetas SET id_producto = ?, tipo_produccion = ? WHERE id_receta = ?");
            $stmt->execute([$data['id_producto'], $data['tipo_produccion'], $data['id_receta']]);
            $id_receta = $data['id_receta'];
            // Eliminar insumos antiguos
            $stmtDel = $pdo->prepare("DELETE FROM receta_insumos WHERE id_receta = ?");
            $stmtDel->execute([$id_receta]);
        } else {
            // Insertar nueva
            $stmt = $pdo->prepare("INSERT INTO recetas (id_producto, tipo_produccion) VALUES (?, ?)");
            $stmt->execute([$data['id_producto'], $data['tipo_produccion']]);
            $id_receta = $pdo->lastInsertId();
        }
        // Insertar insumos
        foreach ($data['insumos'] as $insumo) {
            $stmtIns = $pdo->prepare("INSERT INTO receta_insumos (id_receta, nombre_insumo, cantidad_kg) VALUES (?, ?, ?)");
            $stmtIns->execute([$id_receta, $insumo['nombre'], $insumo['cantidad']]);
        }
        $pdo->commit();
        return ['success' => true, 'id_receta' => $id_receta];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

function eliminarReceta($pdo, $id_receta) {
    $stmt = $pdo->prepare("UPDATE recetas SET activo = 0 WHERE id_receta = ?");
    return ['success' => $stmt->execute([$id_receta])];
}

// ==================== RUTEO DE ACCIONES (SWITCH) ====================
try {
    switch($action) {
        // ===== INVENTARIO PIEZAS =====
        case 'get_piezas':
            echo json_encode(getPiezas($pdo));
            break;
        case 'get_pieza':
            $id = $_GET['id'] ?? null;
            echo json_encode($id ? getPieza($pdo, $id) : []);
            break;
        case 'save_pieza':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = savePieza($pdo, $data);
                echo json_encode(['success' => $result, 'message' => $result ? 'Pieza guardada' : 'Error al guardar']);
            }
            break;
        case 'delete_pieza':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = deletePieza($pdo, $data['id']);
                echo json_encode(['success' => $result]);
            }
            break;
        case 'get_maquinas':
            echo json_encode(getMaquinas($pdo));
            break;
        case 'get_maquina':
            $id = $_GET['id'] ?? null;
            echo json_encode($id ? getMaquina($pdo, $id) : []);
            break;
        case 'save_maquina':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveMaquina($pdo, $data);
                echo json_encode(['success' => $result, 'message' => $result ? 'Máquina guardada' : 'Error al guardar']);
            }
            break;
        case 'delete_maquina':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = deleteMaquina($pdo, $data['id']);
                echo json_encode(['success' => $result]);
            }
            break;
        case 'get_movimientos_piezas':
            echo json_encode(getMovimientosPiezas($pdo));
            break;
        case 'save_movimiento_pieza':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveMovimientoPieza($pdo, $data);
                echo json_encode(['success' => $result, 'message' => $result ? 'Movimiento registrado' : 'Error al registrar']);
            }
            break;

        // ===== MATERIA PRIMA =====
        case 'get_inventario_materia':
            $tipo = $_GET['tipo'] ?? null;
            echo json_encode(getInventarioMateria($pdo, $tipo));
            break;
        case 'get_historial_materia':
            $mes = $_GET['mes'] ?? null;
            $anio = $_GET['anio'] ?? null;
            $tipo_movimiento = $_GET['tipo_movimiento'] ?? 'todos';
            echo json_encode(getHistorialMateriaGlobal($pdo, $mes, $anio, $tipo_movimiento));
            break;
        case 'registrar_entrada_materia':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                echo json_encode(registrarEntradaMateria($pdo, $data));
            }
            break;
        case 'registrar_salida_materia':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = registrarSalidaMateria(
                    $pdo,
                    $data['producto'],
                    $data['cantidad'],
                    $data['detalle'],
                    $data['modulo_origen'] ?? 'inventario',
                    $data['referencia_id'] ?? null,
                    $data['tipo'] ?? null   
                );
                echo json_encode($result);
            }
            break;
        case 'update_lote_materia':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = updateLoteMateria($pdo, $data['id_lote'], $data);
                echo json_encode(['success' => $result]);
            }
            break;
        case 'delete_lote_materia':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = deleteLoteMateria($pdo, $data['id_lote']);
                echo json_encode(['success' => $result]);
            }
            break;
        case 'clear_historial_materia':
            if ($method === 'DELETE') {
                $result = clearHistorialMateria($pdo);
                echo json_encode(['success' => $result]);
            }
            break;

        // ===== PANIFICACION =====
        case 'get_panaderia':
            $mes = $_GET['mes'] ?? date('m');
            $anio = $_GET['anio'] ?? date('Y');
            echo json_encode(getProduccionPan($pdo, $mes, $anio));
            break;
        case 'get_panaderia_by_id':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $sql = "SELECT * FROM produccion_panes WHERE id_produccion = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode($result ?: ['error' => 'Registro no encontrado']);
            } else {
                echo json_encode(['error' => 'ID no proporcionado']);
            }
            break;
case 'save_panaderia':
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = saveProduccionPan($pdo, $data);
        if ($id) {
            echo json_encode(['success' => true, 'message' => 'Producción guardada', 'id_produccion' => $id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al guardar']);
        }
    }
    break;
        case 'update_panaderia':
            if ($method === 'PUT') {
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? $_GET['id'] ?? null;
                if ($id) {
                    $result = updateProduccionPan($pdo, $id, $data);
                    echo json_encode(['success' => $result]);
                } else {
                    echo json_encode(['error' => 'ID no proporcionado']);
                }
            }
            break;
        case 'delete_panaderia':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? $_GET['id'] ?? null;
                if ($id) {
                    $result = deleteProduccionPan($pdo, $id);
                    echo json_encode(['success' => $result]);
                } else {
                    echo json_encode(['error' => 'ID no proporcionado']);
                }
            }
            break;

        // ===== CEREALES PRODUCCIÓN =====
        case 'get_cereales_produccion':
            $mes = $_GET['mes'] ?? date('m');
            $anio = $_GET['anio'] ?? date('Y');
            echo json_encode(getProduccionCereales($pdo, $mes, $anio));
            break;
        case 'get_cereales_produccion_by_id':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $sql = "SELECT * FROM cereales_produccion WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id]);
                $result = $stmt->fetch();
                echo json_encode($result ?: ['error' => 'Registro no encontrado']);
            } else {
                echo json_encode(['error' => 'ID no proporcionado']);
            }
            break;
        case 'save_cereales_produccion':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveProduccionCereales($pdo, $data);
                echo json_encode(['success' => $result, 'message' => $result ? 'Guardado correctamente' : 'Error al guardar']);
            }
            break;
        case 'delete_cereales_produccion':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? $_GET['id'] ?? null;
                if ($id) {
                    $result = deleteProduccionCereales($pdo, $id);
                    echo json_encode(['success' => $result]);
                }
            }
            break;

        // ===== DESPACHO CEREALES =====
        case 'get_cereales_despacho':
            $mes = $_GET['mes'] ?? date('m');
            $anio = $_GET['anio'] ?? date('Y');
            echo json_encode(getDespachoCereales($pdo, $mes, $anio));
            break;
        case 'get_cereales_despacho_by_id':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $sql = "SELECT * FROM cereales_despacho WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id]);
                $result = $stmt->fetch();
                echo json_encode($result ?: ['error' => 'Registro no encontrado']);
            } else {
                echo json_encode(['error' => 'ID no proporcionado']);
            }
            break;
        case 'save_cereales_despacho':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveDespachoCereales($pdo, $data);
                echo json_encode(['success' => $result, 'message' => $result ? 'Despacho guardado' : 'Error al guardar']);
            }
            break;
        case 'delete_cereales_despacho':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? $_GET['id'] ?? null;
                if ($id) {
                    $result = deleteDespachoCereales($pdo, $id);
                    echo json_encode(['success' => $result]);
                }
            }
            break;

        // ===== EMPAQUES (stubs) =====
        case 'get_empaques':
            echo json_encode(getEmpaques($pdo, $_GET['mes'] ?? null, $_GET['anio'] ?? null));
            break;
        case 'save_empaque':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveEmpaque($pdo, $data);
                echo json_encode($result);
            }
            break;
        case 'delete_empaque':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? $_GET['id'] ?? null;
                if ($id) {
                    $result = deleteEmpaque($pdo, $id);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
                }
            }
            break;

        // ===== SOYA PRODUCCIÓN =====
        case 'get_soya_produccion':
            $mes = $_GET['mes'] ?? date('m');
            $anio = $_GET['anio'] ?? date('Y');
            echo json_encode(getProduccionSoya($pdo, $mes, $anio));
            break;
        case 'save_soya_produccion':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveProduccionSoya($pdo, $data);
                echo json_encode(['success' => $result, 'message' => $result ? 'Producción guardada' : 'Error al guardar']);
            }
            break;
        case 'delete_soya_produccion':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? $_GET['id'] ?? null;
                if ($id) {
                    $result = deleteProduccionSoya($pdo, $id);
                    echo json_encode(['success' => $result]);
                }
            }
            break;

        // ===== EMPLEADOS =====
        case 'get_empleados':
            echo json_encode(getEmpleados($pdo));
            break;
        case 'save_empleado':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveEmpleado($pdo, $data);
                echo json_encode($result);
            }
            break;
        case 'delete_empleado':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $cedula = $data['cedula'] ?? $_GET['cedula'] ?? null;
                if ($cedula) {
                    $result = deleteEmpleado($pdo, $cedula);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Cédula no proporcionada']);
                }
            }
            break;

        // ===== SOYA DESPACHO =====
        case 'get_soya_despacho':
            $mes = $_GET['mes'] ?? date('m');
            $anio = $_GET['anio'] ?? date('Y');
            echo json_encode(getDespachoSoya($pdo, $mes, $anio));
            break;
        case 'save_soya_despacho':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = saveDespachoSoya($pdo, $data);
                echo json_encode(['success' => $result, 'message' => $result ? 'Despacho guardado' : 'Error al guardar']);
            }
            break;
        case 'delete_soya_despacho':
            if ($method === 'DELETE') {
                $data = json_decode(file_get_contents('php://input'), true);
                $id = $data['id'] ?? $_GET['id'] ?? null;
                if ($id) {
                    $result = deleteDespachoSoya($pdo, $id);
                    echo json_encode(['success' => $result]);
                }
            }
            break;

        case 'get_receta':
                $id_producto = $_GET['id_producto'] ?? 0;
                $tipo = $_GET['tipo'] ?? ''; 
                echo json_encode(getReceta($pdo, $id_producto, $tipo));
            break;
        case 'descontar_insumos':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                echo json_encode(descontarInsumosProduccion($pdo, $data['id_produccion'], $data['modulo'], $data['insumos']));
    }
    break;

// ===== RECETARIO =====
    case 'listar_recetas':
    echo json_encode(listarRecetas($pdo));
    break;
case 'guardar_receta':
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode(guardarReceta($pdo, $data));
    }
    break;
case 'eliminar_receta':
    if ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode(eliminarReceta($pdo, $data['id_receta']));
    }
    break;

        // ===== PRODUCTOS =====
        case 'get_productos':
            $categoria = $_GET['categoria'] ?? null;
            echo json_encode(getProductos($pdo, $categoria));
            break;

        // ===== ESTADÍSTICAS =====
        case 'get_stats':
            echo json_encode(getStats($pdo));
            break;

        // ===== TEST =====
        case 'test':
            echo json_encode(['success' => true, 'message' => 'API funcionando', 'timestamp' => date('Y-m-d H:i:s')]);
            break;

        default:
            echo json_encode(['error' => 'Acción no válida']);
    }
} catch(PDOException $e) {
    echo json_encode(['error' => 'Error en BD: ' . $e->getMessage()]);
}
?>