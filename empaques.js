const API_URL = 'api.php';
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Establecer fecha actual por defecto
    const fechaInput = document.getElementById('empaque-fecha');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    
    cargarEmpaques();
    
    // Botón guardar
    const btnGuardar = document.getElementById('btn-guardar-empaque');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarEmpaque);
    }
    
    // Calcular porcentaje automáticamente
    const entregadoInput = document.getElementById('empaque-entregado');
    const danadoInput = document.getElementById('empaque-danado');
    const porcentajeInput = document.getElementById('empaque-porcentaje');
    
    function calcularPorcentaje() {
        const entregado = parseFloat(entregadoInput.value) || 0;
        const danado = parseFloat(danadoInput.value) || 0;
        if (entregado > 0) {
            const porcentaje = (danado / entregado * 100).toFixed(2);
            porcentajeInput.value = porcentaje;
        } else {
            porcentajeInput.value = 0;
        }
    }
    
    if (entregadoInput) entregadoInput.addEventListener('input', calcularPorcentaje);
    if (danadoInput) danadoInput.addEventListener('input', calcularPorcentaje);
    
    // Validación de números positivos
    const camposNumericos = ['empaque-entregado', 'empaque-danado', 'empaque-unidades'];
    camposNumericos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
            });
            input.addEventListener('input', function() {
                if (this.value < 0) this.value = 0;
            });
        }
    });
    
    // ESC para cerrar modales (si hay)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Cerrar modal si existe
        }
    });
});

async function cargarEmpaques() {
    try {
        const response = await fetch(`${API_URL}?action=get_empaques`);
        const empaques = await response.json();
        
        const lista = document.getElementById('lista-empaques');
        if (!lista) return;
        
        if (empaques.length === 0) {
            lista.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#999;">
                <i class="fas fa-box-open" style="font-size:40px;display:block;margin-bottom:10px;"></i>
                No hay registros de empaques
            </td></tr>`;
            return;
        }
        
        lista.innerHTML = empaques.map(item => {
            let colorPorcentaje = item.porcentaje_danado > 5 ? "#e74c3c" : "#2ecc71";
            const fecha = item.fecha_registro ? item.fecha_registro.split('-').reverse().join('/') : 'N/A';
            
            return `
                <tr>
                    <td><strong>${item.nombre_pro || item.producto || 'Producto'}</strong><br><small style="color:#666;">${fecha}</small></td>
                    <td>${item.material_entregado}</td>
                    <td>${item.material_danado}</td>
                    <td>
                        <span style="background:${colorPorcentaje}; color:white; padding:3px 8px; border-radius:10px; font-size:12px; font-weight:bold;">
                            ${parseFloat(item.porcentaje_danado).toFixed(2)}%
                        </span>
                    </td>
                    <td style="font-weight:bold;">${item.unidades} Und</td>
                    <td>
                        <button onclick="editarEmpaque(${item.id_empaques})" 
                            style="color:#3498db; border:none; background:none; cursor:pointer;" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarEmpaque(${item.id_empaques})" 
                            style="color:#e74c3c; border:none; background:none; cursor:pointer; margin-left:10px;" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error al cargar empaques:', error);
        mostrarNotificacion('Error al conectar con la base de datos', 'error');
    }
}

async function guardarEmpaque() {
    const productoSelect = document.getElementById('empaque-producto');
    const productoTexto = productoSelect.options[productoSelect.selectedIndex]?.text;
    const idProducto = obtenerIdProducto(productoSelect.value);
    
    const entregado = parseInt(document.getElementById('empaque-entregado').value) || 0;
    const danado = parseInt(document.getElementById('empaque-danado').value) || 0;
    const unidades = parseInt(document.getElementById('empaque-unidades').value) || 0;
    const fecha = document.getElementById('empaque-fecha').value;
    const observaciones = document.getElementById('empaque-observaciones')?.value || '';
    
    if (!productoTexto || !entregado || !fecha) {
        mostrarNotificacion('⚠️ Complete Producto, Material Entregado y Fecha', 'error');
        return;
    }
    
    const registro = {
        id_empaques: editandoId || null,
        id_producto: idProducto,
        material_entregado: entregado,
        material_danado: danado,
        unidades: unidades,
        fecha_registro: fecha,
        observaciones: observaciones
    };
    
    const btnGuardar = document.getElementById('btn-guardar-empaque');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> GUARDANDO...';
    btnGuardar.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}?action=save_empaque`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion(result.message || 'Registro guardado correctamente', 'success');
            editandoId = null;
            limpiarCampos();
            await cargarEmpaques();
        } else {
            mostrarNotificacion(result.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión con el servidor', 'error');
    } finally {
        btnGuardar.innerHTML = textoOriginal;
        btnGuardar.disabled = false;
    }
}

async function editarEmpaque(id) {
    try {
        const response = await fetch(`${API_URL}?action=get_empaques`);
        const empaques = await response.json();
        const item = empaques.find(e => e.id_empaques === id);
        
        if (item) {
            // Buscar el option del select por el nombre del producto
            const select = document.getElementById('empaque-producto');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].text === item.nombre_pro) {
                    select.selectedIndex = i;
                    break;
                }
            }
            document.getElementById('empaque-entregado').value = item.material_entregado;
            document.getElementById('empaque-danado').value = item.material_danado;
            document.getElementById('empaque-unidades').value = item.unidades;
            document.getElementById('empaque-fecha').value = item.fecha_registro;
            if (document.getElementById('empaque-observaciones')) {
                document.getElementById('empaque-observaciones').value = item.observaciones || '';
            }
            
            // Recalcular porcentaje
            const porcentaje = (item.material_danado / item.material_entregado * 100).toFixed(2);
            document.getElementById('empaque-porcentaje').value = porcentaje;
            
            editandoId = id;
            const btnGuardar = document.getElementById('btn-guardar-empaque');
            btnGuardar.innerHTML = '<i class="fas fa-sync"></i> ACTUALIZAR REGISTRO';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al editar:', error);
        mostrarNotificacion('Error al cargar los datos', 'error');
    }
}

async function eliminarEmpaque(id) {
    if (!confirm('¿Desea eliminar este registro permanentemente?')) return;
    
    try {
        const response = await fetch(`${API_URL}?action=delete_empaque`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('Registro eliminado correctamente', 'success');
            await cargarEmpaques();
        } else {
            mostrarNotificacion('Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

function obtenerIdProducto(valorSelect) {
    // Mapeo de productos a IDs (debe coincidir con tu tabla productos)
    const mapaProductos = {
        'CHOCO BOLITAS': 8,
        'CHOKO CHISPYS': 9,
        'AROS FRUTADOS': 10,
        'AROS MIEL': 11,
        'PAN INTEGRAL': 1,
        'PAN C/A': 2,
        'PAN BLANCO': 3,
        'PAN MIEL': 4,
        'TOSTADAS': 7
    };
    return mapaProductos[valorSelect] || 1;
}

function limpiarCampos() {
    document.getElementById('empaque-producto').value = "";
    document.getElementById('empaque-entregado').value = "";
    document.getElementById('empaque-danado').value = "";
    document.getElementById('empaque-porcentaje').value = "";
    document.getElementById('empaque-unidades').value = "";
    if (document.getElementById('empaque-observaciones')) {
        document.getElementById('empaque-observaciones').value = "";
    }
    // Resetear fecha a hoy
    const fechaInput = document.getElementById('empaque-fecha');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    editandoId = null;
    
    const btnGuardar = document.getElementById('btn-guardar-empaque');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> GUARDAR REGISTRO';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${mensaje}`;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 8px;
        z-index: 10001;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}

// Hacer funciones globales
window.editarEmpaque = editarEmpaque;
window.eliminarEmpaque = eliminarEmpaque;