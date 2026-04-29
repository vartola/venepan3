const API_URL = 'api.php';
let editandoPiezaId = null;
let editandoMaquinaId = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarModales();
    inicializarEventos();
    inicializarPestanasInventario(); 
    cargarPiezas();
    cargarMaquinas();
    cargarMovimientos();
    cargarSelects();
});

async function cargarPiezas() {
    try {
        const response = await fetch(`${API_URL}?action=get_piezas`);
        const piezas = await response.json();
        
        const tbody = document.getElementById('lista-piezas');
        const totalPiezas = document.getElementById('total-piezas');
        const stockBajo = document.getElementById('stock-bajo');
        
        if (piezas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;">No hay piezas registradas</td></tr>`;
            if (totalPiezas) totalPiezas.textContent = '0';
            if (stockBajo) stockBajo.textContent = '0';
            return;
        }
        
        let bajoCount = 0;
        tbody.innerHTML = piezas.map(p => {
            const stockClass = p.stock_actual <= p.stock_minimo ? 'stock-bajo' : '';
            if (p.stock_actual <= p.stock_minimo) bajoCount++;
            
            let estadoColor = '';
            if (p.estado === 'Operativa') estadoColor = '#27ae60';
            else if (p.estado === 'En mantenimiento') estadoColor = '#f39c12';
            else if (p.estado === 'Defectuosa') estadoColor = '#e74c3c';
            else estadoColor = '#95a5a6';
            
            return `
                <tr>
                    <td><strong>${p.codigo}</strong></td>
                    <td>${p.nombre_pieza}</td>
                    <td>${p.maquina_asociada}</td>
                    <td>${p.categoria || '-'}</td>
                    <td class="${stockClass}" style="font-weight:bold;">${p.stock_actual}</td>
                    <td>${p.stock_minimo}</td>
                    <td><span style="background:${estadoColor}; color:white; padding:3px 10px; border-radius:15px; font-size:11px;">${p.estado}</span></td>
                    <td>
                        <button onclick="editarPieza(${p.id_pieza})" style="color:#3498db; border:none; background:none; cursor:pointer;"><i class="fas fa-edit"></i></button>
                        <button onclick="abrirMovimiento(${p.id_pieza}, '${p.nombre_pieza}')" style="color:#27ae60; border:none; background:none; cursor:pointer;"><i class="fas fa-exchange-alt"></i></button>
                        <button onclick="eliminarPieza(${p.id_pieza})" style="color:#e74c3c; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
        if (totalPiezas) totalPiezas.textContent = piezas.length;
        if (stockBajo) stockBajo.textContent = bajoCount;
    } catch (error) {
        console.error('Error al cargar piezas:', error);
    }
}

async function cargarMaquinas() {
    try {
        const response = await fetch(`${API_URL}?action=get_maquinas`);
        const maquinas = await response.json();
        
        const tbody = document.getElementById('lista-maquinas');
        const totalMaquinas = document.getElementById('total-maquinas');
        
        if (maquinas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">No hay máquinas registradas</td></tr>`;
            if (totalMaquinas) totalMaquinas.textContent = '0';
            return;
        }
        
        let estadoColor = '';
        tbody.innerHTML = maquinas.map(m => {
            if (m.estado === 'Operativa') estadoColor = '#27ae60';
            else if (m.estado === 'Mantenimiento') estadoColor = '#f39c12';
            else if (m.estado === 'Parada') estadoColor = '#e74c3c';
            else estadoColor = '#e67e22';
            
            return `
                <tr>
                    <td><strong>${m.nombre_maquina}</strong></td>
                    <td>${m.modelo || '-'}</td>
                    <td>${m.marca || '-'}</td>
                    <td>${m.ubicacion || '-'}</td>
                    <td><span style="background:${estadoColor}; color:white; padding:3px 10px; border-radius:15px; font-size:11px;">${m.estado}</span></td>
                    <td>${m.responsable || '-'}</td>
                    <td>
                        <button onclick="editarMaquina(${m.id_maquina})" style="color:#3498db; border:none; background:none; cursor:pointer;"><i class="fas fa-edit"></i></button>
                        <button onclick="eliminarMaquina(${m.id_maquina})" style="color:#e74c3c; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
        if (totalMaquinas) totalMaquinas.textContent = maquinas.length;
    } catch (error) {
        console.error('Error al cargar máquinas:', error);
    }
}

async function cargarMovimientos() {
    try {
        const response = await fetch(`${API_URL}?action=get_movimientos_piezas`);
        const movimientos = await response.json();
        
        const tbody = document.getElementById('lista-movimientos');
        
        if (movimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;">No hay movimientos registrados</td></tr>`;
            return;
        }
        
        tbody.innerHTML = movimientos.map(m => {
            const tipoColor = m.tipo_movimiento === 'ENTRADA' ? '#27ae60' : (m.tipo_movimiento === 'SALIDA' ? '#e74c3c' : '#f39c12');
            const fecha = new Date(m.fecha_movimiento).toLocaleString();
            
            return `
                <tr>
                    <td><small>${fecha}</small></td>
                    <td><strong>${m.nombre_pieza}</strong><br><small>${m.codigo}</small></td>
                    <td><span style="background:${tipoColor}; color:white; padding:2px 8px; border-radius:12px; font-size:11px;">${m.tipo_movimiento}</span></td>
                    <td style="font-weight:bold;">${m.cantidad}</td>
                    <td><small>${m.motivo || '-'}</small></td>
                    <td><small>${m.usuario || 'sistema'}</small></td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error al cargar movimientos:', error);
    }
}

async function cargarSelects() {
    try {
        const response = await fetch(`${API_URL}?action=get_maquinas`);
        const maquinas = await response.json();
        
        const selectMaquina = document.getElementById('pieza-maquina');
        const selectMovPieza = document.getElementById('mov-pieza');
        
        if (selectMaquina) {
            selectMaquina.innerHTML = '<option value="">Seleccionar máquina</option>';
            maquinas.forEach(m => {
                selectMaquina.innerHTML += `<option value="${m.nombre_maquina}">${m.nombre_maquina}</option>`;
            });
        }
        
        if (selectMovPieza) {
            const piezasResp = await fetch(`${API_URL}?action=get_piezas`);
            const piezas = await piezasResp.json();
            selectMovPieza.innerHTML = '<option value="">Seleccionar pieza</option>';
            piezas.forEach(p => {
                selectMovPieza.innerHTML += `<option value="${p.id_pieza}">${p.codigo} - ${p.nombre_pieza}</option>`;
            });
        }
    } catch (error) {
        console.error('Error al cargar selects:', error);
    }
}

async function guardarPieza() {
    const pieza = {
        id_pieza: editandoPiezaId,
        codigo: document.getElementById('pieza-codigo').value.trim(),
        nombre_pieza: document.getElementById('pieza-nombre').value.trim(),
        maquina_asociada: document.getElementById('pieza-maquina').value,
        categoria: document.getElementById('pieza-categoria').value,
        stock_actual: parseInt(document.getElementById('pieza-stock').value) || 0,
        stock_minimo: parseInt(document.getElementById('pieza-stock-minimo').value) || 5,
        ubicacion: document.getElementById('pieza-ubicacion').value,
        proveedor: document.getElementById('pieza-proveedor').value,
        precio_compra: parseFloat(document.getElementById('pieza-precio').value) || 0,
        estado: document.getElementById('pieza-estado').value,
        observaciones: document.getElementById('pieza-obs').value
    };
    
    if (!pieza.codigo || !pieza.nombre_pieza || !pieza.maquina_asociada) {
        alert('⚠️ Complete los campos obligatorios');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=save_pieza`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pieza)
        });
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            cerrarModales();
            cargarPiezas();
            cargarSelects();
            editandoPiezaId = null;
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function guardarMaquina() {
    const maquina = {
        id_maquina: editandoMaquinaId,
        nombre_maquina: document.getElementById('maquina-nombre').value.trim(),
        modelo: document.getElementById('maquina-modelo').value,
        marca: document.getElementById('maquina-marca').value,
        ubicacion: document.getElementById('maquina-ubicacion').value,
        estado: document.getElementById('maquina-estado').value,
        fecha_instalacion: document.getElementById('maquina-fecha-inst').value,
        ultimo_mantenimiento: document.getElementById('maquina-ultimo-mant').value,
        responsable: document.getElementById('maquina-responsable').value,
        observaciones: document.getElementById('maquina-obs').value
    };
    
    if (!maquina.nombre_maquina) {
        alert('⚠️ El nombre de la máquina es obligatorio');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=save_maquina`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(maquina)
        });
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            cerrarModales();
            cargarMaquinas();
            cargarSelects();
            editandoMaquinaId = null;
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function guardarMovimiento() {
    const id_pieza = document.getElementById('mov-pieza').value;
    const tipo = document.getElementById('mov-tipo').value;
    const cantidad = parseInt(document.getElementById('mov-cantidad').value);
    const motivo = document.getElementById('mov-motivo').value;
    
    if (!id_pieza || !tipo || !cantidad || cantidad <= 0) {
        alert('⚠️ Complete todos los campos');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=save_movimiento_pieza`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_pieza, tipo_movimiento: tipo, cantidad, motivo })
        });
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            cerrarModales();
            cargarPiezas();
            cargarMovimientos();
            cargarSelects();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

function editarPieza(id) {
    editandoPiezaId = id;
    document.getElementById('modal-pieza-titulo').innerHTML = '<i class="fas fa-edit"></i> Editar Pieza';
    document.getElementById('modal-pieza').classList.add('activo');
    document.getElementById('form-overlay').classList.add('activo');
    
    fetch(`${API_URL}?action=get_pieza&id=${id}`)
        .then(r => r.json())
        .then(p => {
            document.getElementById('pieza-codigo').value = p.codigo;
            document.getElementById('pieza-nombre').value = p.nombre_pieza;
            document.getElementById('pieza-maquina').value = p.maquina_asociada;
            document.getElementById('pieza-categoria').value = p.categoria || '';
            document.getElementById('pieza-stock').value = p.stock_actual;
            document.getElementById('pieza-stock-minimo').value = p.stock_minimo;
            document.getElementById('pieza-ubicacion').value = p.ubicacion || '';
            document.getElementById('pieza-proveedor').value = p.proveedor || '';
            document.getElementById('pieza-precio').value = p.precio_compra;
            document.getElementById('pieza-estado').value = p.estado;
            document.getElementById('pieza-obs').value = p.observaciones || '';
        });
}

function editarMaquina(id) {
    editandoMaquinaId = id;
    document.getElementById('modal-maquina-titulo').innerHTML = '<i class="fas fa-edit"></i> Editar Máquina';
    document.getElementById('modal-maquina').classList.add('activo');
    document.getElementById('form-overlay').classList.add('activo');
    
    fetch(`${API_URL}?action=get_maquina&id=${id}`)
        .then(r => r.json())
        .then(m => {
            document.getElementById('maquina-nombre').value = m.nombre_maquina;
            document.getElementById('maquina-modelo').value = m.modelo || '';
            document.getElementById('maquina-marca').value = m.marca || '';
            document.getElementById('maquina-ubicacion').value = m.ubicacion || '';
            document.getElementById('maquina-estado').value = m.estado;
            document.getElementById('maquina-fecha-inst').value = m.fecha_instalacion || '';
            document.getElementById('maquina-ultimo-mant').value = m.ultimo_mantenimiento || '';
            document.getElementById('maquina-responsable').value = m.responsable || '';
            document.getElementById('maquina-obs').value = m.observaciones || '';
        });
}

function abrirMovimiento(id, nombre) {
    document.getElementById('mov-pieza').value = id;
    document.getElementById('modal-movimiento').classList.add('activo');
    document.getElementById('form-overlay').classList.add('activo');
    document.getElementById('mov-cantidad').value = '';
    document.getElementById('mov-motivo').value = '';
}

async function eliminarPieza(id) {
    if (!confirm('¿Eliminar esta pieza permanentemente?')) return;
    const response = await fetch(`${API_URL}?action=delete_pieza`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    const result = await response.json();
    if (result.success) {
        alert('Pieza eliminada');
        cargarPiezas();
        cargarSelects();
    }
}

async function eliminarMaquina(id) {
    if (!confirm('¿Eliminar esta máquina? Se eliminarán también sus piezas asociadas.')) return;
    const response = await fetch(`${API_URL}?action=delete_maquina`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    const result = await response.json();
    if (result.success) {
        alert('Máquina eliminada');
        cargarMaquinas();
        cargarSelects();
    }
}

function inicializarModales() {
    const overlay = document.getElementById('form-overlay');
    const cerrarBtns = document.querySelectorAll('.cerrar-modal');
    
    cerrarBtns.forEach(btn => {
        btn.addEventListener('click', cerrarModales);
    });
    
    if (overlay) overlay.addEventListener('click', cerrarModales);
    
    document.getElementById('btn-nueva-pieza')?.addEventListener('click', () => {
        editandoPiezaId = null;
        document.getElementById('modal-pieza-titulo').innerHTML = '<i class="fas fa-plus"></i> Nueva Pieza';
        limpiarFormPieza();
        document.getElementById('modal-pieza').classList.add('activo');
        document.getElementById('form-overlay').classList.add('activo');
    });
    
    document.getElementById('btn-nueva-maquina')?.addEventListener('click', () => {
        editandoMaquinaId = null;
        document.getElementById('modal-maquina-titulo').innerHTML = '<i class="fas fa-plus"></i> Nueva Máquina';
        limpiarFormMaquina();
        document.getElementById('modal-maquina').classList.add('activo');
        document.getElementById('form-overlay').classList.add('activo');
    });
    
    document.getElementById('btn-guardar-pieza')?.addEventListener('click', guardarPieza);
    document.getElementById('btn-guardar-maquina')?.addEventListener('click', guardarMaquina);
    document.getElementById('btn-guardar-movimiento')?.addEventListener('click', guardarMovimiento);
}

function cerrarModales() {
    document.getElementById('modal-pieza')?.classList.remove('activo');
    document.getElementById('modal-maquina')?.classList.remove('activo');
    document.getElementById('modal-movimiento')?.classList.remove('activo');
    document.getElementById('form-overlay')?.classList.remove('activo');
}

function limpiarFormPieza() {
    document.querySelectorAll('#modal-pieza input, #modal-pieza select, #modal-pieza textarea').forEach(i => i.value = '');
    document.getElementById('pieza-stock').value = '0';
    document.getElementById('pieza-stock-minimo').value = '5';
}

function limpiarFormMaquina() {
    document.querySelectorAll('#modal-maquina input, #modal-maquina select, #modal-maquina textarea').forEach(i => i.value = '');
}

function inicializarEventos() {
    const menuHamburguesa = document.getElementById('menuHamburguesa');
    const menuDesplegable = document.getElementById('menuDesplegable');
    
    if (menuHamburguesa && menuDesplegable) {
        menuHamburguesa.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDesplegable.classList.toggle('mostrar');
        });
        
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const seccion = item.getAttribute('data-seccion');
                if (seccion === 'piezas') document.getElementById('btn-nueva-pieza')?.click();
                else if (seccion === 'maquinas') document.getElementById('btn-nueva-maquina')?.click();
                else if (seccion === 'movimientos') abrirMovimiento(null, '');
                menuDesplegable.classList.remove('mostrar');
            });
        });
    }
    
    document.addEventListener('click', (e) => {
        if (menuDesplegable && menuHamburguesa && !menuDesplegable.contains(e.target) && !menuHamburguesa.contains(e.target)) {
            menuDesplegable.classList.remove('mostrar');
        }
    });
}

function inicializarPestanasInventario() {
    const tabPiezas = document.getElementById('tab-piezas-btn');
    const tabMaquinas = document.getElementById('tab-maquinas-btn');
    const tabMovimientos = document.getElementById('tab-movimientos-btn');
    const contPiezas = document.getElementById('contenedor-piezas');
    const contMaquinas = document.getElementById('contenedor-maquinas');
    const contMovimientos = document.getElementById('contenedor-movimientos');

    if (tabPiezas && tabMaquinas && tabMovimientos) {
        tabPiezas.addEventListener('click', () => {
            tabPiezas.classList.add('active');
            tabMaquinas.classList.remove('active');
            tabMovimientos.classList.remove('active');
            contPiezas.style.display = 'block';
            contMaquinas.style.display = 'none';
            contMovimientos.style.display = 'none';
        });
        tabMaquinas.addEventListener('click', () => {
            tabMaquinas.classList.add('active');
            tabPiezas.classList.remove('active');
            tabMovimientos.classList.remove('active');
            contMaquinas.style.display = 'block';
            contPiezas.style.display = 'none';
            contMovimientos.style.display = 'none';
        });
        tabMovimientos.addEventListener('click', () => {
            tabMovimientos.classList.add('active');
            tabPiezas.classList.remove('active');
            tabMaquinas.classList.remove('active');
            contMovimientos.style.display = 'block';
            contPiezas.style.display = 'none';
            contMaquinas.style.display = 'none';
        });
    }
}