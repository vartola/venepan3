const API_URL = 'api.php';
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarRecetas();
    document.getElementById('btn-guardar-receta').addEventListener('click', guardarReceta);
});

async function cargarProductos() {
    const res = await fetch(`${API_URL}?action=get_productos&categoria=Panaderia`);
    const productos = await res.json();
    const select = document.getElementById('receta-producto');
    select.innerHTML = '<option value="">Seleccione un producto</option>';
    productos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id_producto;
        option.textContent = p.nombre_pro;
        select.appendChild(option);
    });
}

async function cargarRecetas() {
    const res = await fetch(`${API_URL}?action=listar_recetas`);
    const recetas = await res.json();
    const tbody = document.getElementById('lista-recetas');
    tbody.innerHTML = '';

    let totalRecetas = recetas.length;
    let totalInsumos = 0;
    recetas.forEach(r => totalInsumos += r.insumos.length);

    document.getElementById('total-recetas').innerText = totalRecetas;
    document.getElementById('total-insumos-recetas').innerText = totalInsumos;
    document.getElementById('promedio-insumos').innerText = totalRecetas ? (totalInsumos / totalRecetas).toFixed(1) : 0;

    recetas.forEach(r => {
        let insumosHtml = r.insumos.map(i => `${i.nombre}: ${i.cantidad} kg`).join('<br>');
        const row = `
            <tr>
                <td><strong>${r.nombre_pro}</strong></td>
                <td>${insumosHtml}</td>
                <td>
                    <button onclick="editarReceta(${r.id_receta})" style="border:none; background:none; cursor:pointer; color:#3498db;"><i class="fas fa-edit"></i></button>
                    <button onclick="eliminarReceta(${r.id_receta})" style="border:none; background:none; cursor:pointer; color:#e74c3c; margin-left:10px;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function guardarReceta() {
    const id_producto = document.getElementById('receta-producto').value;
    if (!id_producto) {
        alert('Seleccione un producto');
        return;
    }
    const tipo = 'pan'; // fijo para panes, luego se puede extender
    const harina = parseFloat(document.getElementById('ing-harina').value) || 0;
    const levadura = parseFloat(document.getElementById('ing-levadura').value) || 0;
    const soya = parseFloat(document.getElementById('ing-soya').value) || 0;
    const cereales = parseFloat(document.getElementById('ing-cereales').value) || 0;

    const insumos = [];
    if (harina > 0) insumos.push({ nombre: 'Harina', cantidad: harina });
    if (levadura > 0) insumos.push({ nombre: 'Levadura', cantidad: levadura });
    if (soya > 0) insumos.push({ nombre: 'Soya liquida', cantidad: soya });
    if (cereales > 0) insumos.push({ nombre: 'Cereales', cantidad: cereales });

    if (insumos.length === 0) {
        alert('Agregue al menos un insumo');
        return;
    }

    const data = {
        id_receta: editandoId || null,
        id_producto: id_producto,
        tipo_produccion: tipo,
        insumos: insumos
    };

    const res = await fetch(`${API_URL}?action=guardar_receta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
        alert('Receta guardada correctamente');
        limpiarFormulario();
        cargarRecetas();
    } else {
        alert('Error: ' + result.message);
    }
}

async function editarReceta(id) {
    editandoId = id;
    // Cargar los datos de la receta actual (puedes hacer una llamada extra)
    const res = await fetch(`${API_URL}?action=listar_recetas`);
    const recetas = await res.json();
    const receta = recetas.find(r => r.id_receta == id);
    if (receta) {
        document.getElementById('receta-producto').value = receta.id_producto;
        // Limpiar campos y luego asignar según insumos existentes
        document.getElementById('ing-harina').value = '';
        document.getElementById('ing-levadura').value = '';
        document.getElementById('ing-soya').value = '';
        document.getElementById('ing-cereales').value = '';
        receta.insumos.forEach(i => {
            if (i.nombre === 'Harina') document.getElementById('ing-harina').value = i.cantidad;
            if (i.nombre === 'Levadura') document.getElementById('ing-levadura').value = i.cantidad;
            if (i.nombre === 'Soya liquida') document.getElementById('ing-soya').value = i.cantidad;
            if (i.nombre === 'Cereales') document.getElementById('ing-cereales').value = i.cantidad;
        });
        document.getElementById('btn-guardar-receta').innerHTML = '<i class="fas fa-sync"></i> ACTUALIZAR RECETA';
    }
}

async function eliminarReceta(id) {
    if (!confirm('¿Eliminar esta receta permanentemente?')) return;
    const res = await fetch(`${API_URL}?action=eliminar_receta`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_receta: id })
    });
    const result = await res.json();
    if (result.success) {
        alert('Receta eliminada');
        cargarRecetas();
        if (editandoId == id) limpiarFormulario();
    } else {
        alert('Error al eliminar');
    }
}

function limpiarFormulario() {
    document.getElementById('receta-producto').value = '';
    document.getElementById('ing-harina').value = '';
    document.getElementById('ing-levadura').value = '';
    document.getElementById('ing-soya').value = '';
    document.getElementById('ing-cereales').value = '';
    editandoId = null;
    document.getElementById('btn-guardar-receta').innerHTML = '<i class="fas fa-save"></i> GUARDAR FÓRMULA';
}