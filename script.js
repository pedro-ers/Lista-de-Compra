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
const errorProducto = document.getElementById("error-producto");
const listaProducto = document.getElementById("lista-productos");
const btnOrdenar = document.getElementById("btn-ordenar");

// Muestra el error del formulario, marca el campo como inválido y le da el foco.
function mostrarErrorProducto(mensaje) {
    errorProducto.textContent = mensaje;
    errorProducto.hidden = false;
    inputProduct.setAttribute("aria-invalid", "true");
    inputProduct.focus();
}

// Oculta el error cuando el campo vuelve a ser válido.
function limpiarErrorProducto() {
    errorProducto.textContent = "";
    errorProducto.hidden = true;
    inputProduct.removeAttribute("aria-invalid");
}

function AgregarProducto() {
    const nombre = inputProduct.value.trim();

    // Validación propia (el formulario usa novalidate) para mostrar
    // siempre un mensaje visible y anunciado de forma consistente.
    if (nombre === "") {
        mostrarErrorProducto("Escribe un nombre antes de agregar el producto.");
        return;
    }

    // Defensa extra: maxlength ya limita la entrada en el navegador.
    if (nombre.length > 80) {
        mostrarErrorProducto("El nombre no puede superar los 80 caracteres.");
        return;
    }

    limpiarErrorProducto();

    productos.push({
        id : crypto.randomUUID(),
        nombre : nombre,
        completado : false
    });

    guardarProductos();
    renderLista();

    inputProduct.value = "";
    inputProduct.focus();
}

function crearFila(producto) {
    const elemento = document.createElement("li");
    const etiqueta = document.createElement("label");
    const checkbox = document.createElement("input");
    const nombreProducto = document.createElement("span");
    const botonEliminar = document.createElement("button");

    elemento.dataset.id = producto.id;
    etiqueta.classList.add("fila-producto");

    checkbox.type = "checkbox";
    checkbox.checked = producto.completado;

    nombreProducto.textContent = producto.nombre;
    nombreProducto.classList.add("nombre-producto");

    botonEliminar.textContent = "Eliminar";
    botonEliminar.type = "button";
    botonEliminar.classList.add("btn-eliminar");
    botonEliminar.setAttribute("aria-label", "Eliminar " + producto.nombre);

    elemento.classList.toggle("completado", producto.completado);

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
        // Guardamos la posición antes de filtrar: después ya no existe.
        const indiceEliminado = productos.findIndex(function(item) {
            return item.id === idProducto;
        });

        productos = productos.filter(function(item) {
            return item.id !== idProducto;
        });

        guardarProductos();
        renderLista();

        // La fila enfocada desaparece; llevamos el foco a un lugar predecible.
        enfocarTrasEliminar(indiceEliminado);
    });

    etiqueta.appendChild(checkbox);
    etiqueta.appendChild(nombreProducto);

    elemento.appendChild(etiqueta);
    elemento.appendChild(botonEliminar);

    return elemento;
}

function actualizarFila(fila, producto) {
    const checkbox = fila.querySelector('input[type="checkbox"]');
    const nombreProducto = fila.querySelector(".nombre-producto");
    const botonEliminar = fila.querySelector(".btn-eliminar");

    checkbox.checked = producto.completado;
    nombreProducto.textContent = producto.nombre;
    botonEliminar.setAttribute("aria-label", "Eliminar " + producto.nombre);

    fila.classList.toggle("completado", producto.completado);
}

// Tras eliminar una fila, coloca el foco en el siguiente producto.
// Si se borró el último, usa el anterior; si la lista queda vacía,
// devuelve el foco al campo de texto.
function enfocarTrasEliminar(indiceEliminado) {
    if (productos.length === 0) {
        inputProduct.focus();
        return;
    }

    // El producto siguiente ocupa ahora el índice del borrado;
    // si borramos el último, el índice se ajusta al anterior.
    const indiceDestino = Math.min(indiceEliminado, productos.length - 1);
    const filaDestino = listaProducto.children[indiceDestino];

    if (!filaDestino) {
        inputProduct.focus();
        return;
    }

    const checkboxDestino = filaDestino.querySelector('input[type="checkbox"]');

    if (checkboxDestino) {
        checkboxDestino.focus();
    } else {
        inputProduct.focus();
    }
}

// Actualiza el contador de la lista. Como vive en una región aria-live,
// cada cambio de texto se anuncia a los lectores de pantalla.
function actualizarEstadoLista() {
    const estadoLista = document.getElementById("estado-lista");

    const total = productos.length;
    const completados = productos.filter(function(producto) {
        return producto.completado;
    }).length;

    // Concordancia singular/plural para que el anuncio suene natural.
    const textoProductos = total === 1 ? "1 producto" : total + " productos";
    const textoCompletados = completados === 1
        ? "1 completado"
        : completados + " completados";

    const texto = textoProductos + ", " + textoCompletados;

    // Solo escribimos si el texto cambió: evita repetir el anuncio al ordenar.
    if (estadoLista.textContent !== texto) {
        estadoLista.textContent = texto;
    }
}

function renderLista() {
    const filasPorId = new Map();

    for (const fila of listaProducto.children) {
        filasPorId.set(fila.dataset.id, fila);
    }

    productos.forEach(function(producto, indice) {
        let fila = filasPorId.get(producto.id);

        if (fila) {
            actualizarFila(fila, producto);
            filasPorId.delete(producto.id);
        } else {
            fila = crearFila(producto);
        }

        const filaEnPosicion = listaProducto.children[indice];

        if (filaEnPosicion !== fila) {
            listaProducto.insertBefore(fila, filaEnPosicion || null);
        }
    });

    filasPorId.forEach(function(fila) {
        fila.remove();
    });

    const mensajeVacio = document.getElementById("mensaje-vacio");
    mensajeVacio.style.display = productos.length === 0 ? "block" : "none";

    // Mantiene sincronizado el contador visible y su anuncio accesible.
    actualizarEstadoLista();
}

// Al escribir contenido válido, ocultamos el error anterior.
inputProduct.addEventListener("input", function() {
    if (!errorProducto.hidden && inputProduct.value.trim() !== "") {
        limpiarErrorProducto();
    }
});

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