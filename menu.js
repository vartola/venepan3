document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="sidebar-brand">
                <img src="LOGO DE VENEPAN.jpg" class="company-logo">
                <p>SISTEMA VENEPAN</p>
            </div>
            <ul class="nav-menu">
                <li class="nav-item" data-page="index.html" onclick="location.href='index.html'"><i class="fas fa-th-large"></i> Dashboard</li>
                <li class="nav-item" data-page="panificacion.html" onclick="location.href='panificacion.html'"><i class="fas fa-bread-slice"></i> Panificación</li>
                <li class="nav-item" data-page="cereales.html" onclick="location.href='cereales.html'"><i class="fas fa-seedling"></i> Cereales</li>
                <li class="nav-item" data-page="soya.html" onclick="location.href='soya.html'"><i class="fas fa-leaf"></i> Soya</li>
                <li class="nav-item" data-page="Materia.html" onclick="location.href='Materia.html'"><i class="fas fa-boxes"></i> Materia Prima</li>
                <li class="nav-item" data-page="empleados.html" onclick="location.href='empleados.html'"><i class="fas fa-users"></i> Personal</li>
                <li class="nav-item" data-page="recetas.html" onclick="location.href='recetas.html'"><i class="fas fa-book"></i> Recetario</li>
                <!-- ===== <li class="nav-item" data-page="empaques.html" onclick="location.href='empaques.html'"><i class="fas fa-box-open"></i> Empaques</li>===== -->
                <li class="nav-item" data-page="inventario.html" onclick="location.href='inventario.html'"><i class="fas fa-cogs"></i> Inventario</li>
                <li class="nav-item" data-page="Resumen.html" onclick="location.href='Resumen.html'"><i class="fas fa-chart-bar"></i> Resumen</li>
            </ul>
        `;

        const actual = window.location.pathname.split("/").pop() || 'index.html';
        const items = sidebar.querySelectorAll('.nav-item');
        items.forEach(item => {
            if (item.getAttribute('data-page') === actual) {
                item.classList.add('active');
            }
        });
    }
});