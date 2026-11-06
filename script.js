const CLAVE_ALMACEN = "lista-compra:productos";
let productos = cargarProductos();
let ordenAscendente = true;

function cargarProductos() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_ALMACEN));

        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.warn("No se pudo leer la lista guardada:", error);
        return [];
    }
}

function guardarProductos() {
    try {
        localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(productos));
    } catch (error) {
        console.warn("No se pudo guardar la lista:", error);
    }
}

const formulario = document.getElementById("formulario-producto");
const inputProduct = document.getElementById("input-producto");
const listaProducto = document.getElementById("lista-productos");
const btnOrdenar = document.getElementById("btn-ordenar");

function AgregarProducto() {
    const nombre = inputProduct.value.trim();

    if (nombre === "")
        return;

    productos.push({
        id : crypto.randomUUID(),
        nombre : nombre,
        completado : false
    });

    guardarProductos();
    renderLista();

    inputProduct.value = "";
    inputProduct
    .focus();
}

function renderLista() {
    listaProducto.innerHTML = "";

    const mensajeVacio = document.getElementById("mensaje-vacio");

    mensajeVacio.style.display = productos.length === 0 ? "block" : "none";

    productos.forEach(function(producto) {
        const elemento = document.createElement("li");
        const checkbox = document.createElement("input");
        const nombreProducto = document.createElement("span");
        const botonEliminar = document.createElement("button");

        checkbox.type = "checkbox";
        checkbox.checked = producto.completado

        nombreProducto.textContent = producto.nombre;
        nombreProducto.classList.add("nombre-producto");

        botonEliminar.textContent = "Eliminar";
        botonEliminar.type = "button";
        botonEliminar.classList.add("btn-eliminar");

        elemento.classList.toggle("completado", producto.completado)

        const idProducto = producto.id;

        checkbox.addEventListener("change", function() {
            const productoActualizado = productos.find(function(item) {
                return item.id === idProducto;
            });

            if (!productoActualizado)
                return;

            productoActualizado.completado = checkbox.checked;
            guardarProductos();
            renderLista();
        });

        botonEliminar.addEventListener("click", function() {
            productos = productos.filter(function(item) {
                return item.id !== idProducto;
            });

            guardarProductos();
            renderLista();
        });

        elemento.appendChild(checkbox);
        elemento.appendChild(nombreProducto)
        elemento.appendChild(botonEliminar);

        listaProducto.appendChild(elemento);
    });
}

formulario.addEventListener("submit", function(evento){
    evento.preventDefault();
    AgregarProducto();
});

btnOrdenar.addEventListener("click", function() {
    if (ordenAscendente) {
        productos.sort(function(a, b) {
            return a.nombre.localeCompare(
                b.nombre,
                "es",
                { sensitivity: "base" }
            );
        });

        ordenAscendente = false;
        btnOrdenar.textContent = "Ordenar Z-A";

    } else {
        productos.sort(function(a, b) {
            return b.nombre.localeCompare(
                a.nombre,
                "es",
                { sensitivity: "base" }
            );
        });

        ordenAscendente = true;
        btnOrdenar.textContent = "Ordenar A-Z";
    }

    guardarProductos();
    renderLista();
});

renderLista();