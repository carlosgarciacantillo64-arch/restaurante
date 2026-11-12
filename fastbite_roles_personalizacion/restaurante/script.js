// Configuración de FastBite
const WHATSAPP_TIENDA = "57XXXXXXXXXX"; // Indicativo + número, solo dígitos.
const CLAVE_COCINERO = "1234";
const CLAVE_MESERO = "5678";
const CLAVE_PEDIDOS_LOCAL = "fastbite_pedidos_local";
const CLAVE_ULTIMO_PEDIDO_CLIENTE = "fastbite_ultimo_pedido_cliente";
let sesionCocinero = false;
let sesionMesero = false;

let carrito = [];
let tipoPedido = null;
let datosCliente = {};
let pedidoConfirmado = false;

function seleccionarTipoPedido(tipo) {
    tipoPedido = tipo;
    datosCliente = {};
    pedidoConfirmado = false;
    const panel = document.getElementById("datos-pedido");
    const estado = document.getElementById("estado-pedido");
    estado.textContent = "";
    panel.hidden = false;

    if (tipo === "local") {
        panel.innerHTML = `
            <h3>Pedido en el local</h3>
            <p>Continúa con el menú. El mesero registrará tu número de mesa.</p>
            <button type="button" onclick="confirmarDatosPedido()">Continuar al menú</button>
        `;
    } else {
        panel.innerHTML = `
            <h3>Pedido a domicilio</h3>
            <label for="nombre-cliente">Nombre:</label>
            <input id="nombre-cliente" type="text" maxlength="70" placeholder="Tu nombre">
            <label for="direccion-cliente">Dirección de entrega:</label>
            <input id="direccion-cliente" type="text" maxlength="180" placeholder="Dirección completa">
            <label for="referencia-cliente">Indicaciones (opcional):</label>
            <input id="referencia-cliente" type="text" maxlength="180" placeholder="Barrio, casa, punto de referencia">
            <button type="button" onclick="confirmarDatosPedido()">Continuar al menú</button>
        `;
    }
}

function confirmarDatosPedido() {
    const estado = document.getElementById("estado-pedido");
    if (tipoPedido === "local") {
        datosCliente = {};
        estado.textContent = "Listo. El mesero asignará tu mesa cuando registres el pedido.";
    } else if (tipoPedido === "domicilio") {
        const nombre = document.getElementById("nombre-cliente").value.trim();
        const direccion = document.getElementById("direccion-cliente").value.trim();
        const referencia = document.getElementById("referencia-cliente").value.trim();
        if (!nombre || !direccion) {
            alert("Escribe tu nombre y la dirección de entrega.");
            return;
        }
        datosCliente = { nombre, direccion, referencia };
        estado.textContent = "Datos guardados. Ahora puedes elegir y personalizar tus productos.";
    }
    pedidoConfirmado = true;
    document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
}

function agregarProducto(nombre, precio, idCantidad) {
    if (!pedidoConfirmado) {
        alert("Primero selecciona si estás en el local o deseas pedir a domicilio.");
        document.getElementById("inicio").scrollIntoView({ behavior: "smooth" });
        return;
    }
    const input = document.getElementById(idCantidad);
    const cantidad = parseInt(input.value, 10);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
        alert("Selecciona una cantidad entre 1 y 99.");
        return;
    }

    const campoPersonalizacion = document.getElementById(`personalizacion-${idCantidad}`);
    const personalizacion = campoPersonalizacion ? campoPersonalizacion.value.trim() : "";
    const existente = carrito.find(p => p.nombre === nombre && p.personalizacion === personalizacion);
    if (existente) {
        existente.cantidad = Math.min(99, existente.cantidad + cantidad);
    } else {
        carrito.push({ nombre, precio, cantidad, personalizacion });
    }
    actualizarCarrito();
    input.value = 1;
    if (campoPersonalizacion) campoPersonalizacion.value = "";
    alert("Producto personalizado agregado correctamente.");
}

function actualizarCarrito() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");
    cartItems.innerHTML = "";
    let total = 0;
    let cantidadTotal = 0;
    if (carrito.length === 0) cartItems.innerHTML = "<p>Tu carrito está vacío.</p>";

    carrito.forEach((producto, index) => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;
        cantidadTotal += producto.cantidad;
        cartItems.innerHTML += `
            <div class="cart-item">
                <div><strong>${escaparHTML(producto.nombre)}</strong>
                    ${producto.personalizacion ? `<p class="cart-customization">Personalización: ${escaparHTML(producto.personalizacion)}</p>` : ""}
                </div>
                <div class="quantity-controls">
                    <button onclick="cambiarCantidad(${index}, -1)">-</button>
                    <strong>${producto.cantidad}</strong>
                    <button onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
                <strong>$${subtotal.toLocaleString("es-CO")}</strong>
                <button class="remove-btn" onclick="eliminarProducto(${index})">Eliminar</button>
            </div>`;
    });
    cartCount.textContent = cantidadTotal;
    cartTotal.textContent = total.toLocaleString("es-CO");
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
    if (carrito[index] && carrito[index].cantidad > 99) carrito[index].cantidad = 99;
    actualizarCarrito();
}
function eliminarProducto(index) { carrito.splice(index, 1); actualizarCarrito(); }
function vaciarCarrito() {
    carrito = [];
    actualizarCarrito();
    document.getElementById("checkout-message").textContent = "";
    alert("El carrito ha sido vaciado.");
}
function mostrarCarrito() { document.getElementById("carrito").scrollIntoView({ behavior: "smooth" }); }

function finalizarPedido() {
    const mensaje = document.getElementById("checkout-message");
    if (!pedidoConfirmado || !tipoPedido) {
        mensaje.textContent = "Primero selecciona el tipo de pedido y completa tus datos.";
        document.getElementById("inicio").scrollIntoView({ behavior: "smooth" });
        return;
    }
    if (carrito.length === 0) { mensaje.textContent = "Agrega al menos un producto antes de finalizar."; return; }

    const total = carrito.reduce((suma, p) => suma + p.precio * p.cantidad, 0);
    const lineasProductos = carrito.map(p =>
        `- ${p.nombre} x${p.cantidad}${p.personalizacion ? ` | Personalización: ${p.personalizacion}` : ""}: $${(p.precio * p.cantidad).toLocaleString("es-CO")}`
    );

    if (tipoPedido === "domicilio") {
        if (!/^57\d{10}$/.test(WHATSAPP_TIENDA)) {
            mensaje.textContent = "Falta configurar el WhatsApp del tendero en script.js (variable WHATSAPP_TIENDA).";
            return;
        }
        const texto = [
            "Hola, quiero realizar este pedido a domicilio:",
            `Nombre: ${datosCliente.nombre}`,
            `Dirección: ${datosCliente.direccion}`,
            datosCliente.referencia ? `Indicaciones: ${datosCliente.referencia}` : "",
            "", "PEDIDO:", ...lineasProductos, "", `TOTAL: $${total.toLocaleString("es-CO")}`
        ].filter(Boolean).join("\n");
        window.open(`https://wa.me/${WHATSAPP_TIENDA}?text=${encodeURIComponent(texto)}`, "_blank");
        mensaje.textContent = "Se abrió WhatsApp con el resumen. Revisa y pulsa Enviar para confirmar el pedido.";
    } else {
        const pedido = {
            id: `FB-${Date.now()}`,
            tipo: "local",
            mesa: null,
            productos: carrito.map(p => ({ ...p })),
            total,
            estado: "pendiente",
            mensajeCliente: "Tu pedido fue enviado. El mesero registrará tu mesa.",
            mensajeMesero: "Pedido nuevo recibido. Asigna una mesa para identificarlo.",
            creado: new Date().toISOString()
        };
        guardarPedidoCocina(pedido);
        sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO_CLIENTE, pedido.id);
        const aviso = document.getElementById("notificacion-pedido");
        aviso.hidden = false;
        aviso.textContent = pedido.mensajeCliente;
        mensaje.textContent = `¡Pedido enviado! Total: $${total.toLocaleString("es-CO")}. El mesero asignará tu mesa.`;
        carrito = [];
        actualizarCarrito();
    }
}

// ACCESO Y VISTA EXCLUSIVA DEL COCINERO
function mostrarAccesoCocinero() {
    const clave = prompt("Acceso de cocinero. Ingresa la contraseña:");
    if (clave === null) return;
    if (clave !== CLAVE_COCINERO) { alert("Contraseña incorrecta. Acceso denegado."); return; }
    sesionCocinero = true;
    sesionMesero = false;
    document.body.classList.remove("waiter-mode");
    document.body.classList.add("cook-mode");
    document.getElementById("panel-cocinero").hidden = false;
    document.getElementById("panel-mesero").hidden = true;
    renderizarPedidosCocina();
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function cerrarSesionCocinero() {
    sesionCocinero = false;
    document.body.classList.remove("cook-mode");
    document.getElementById("panel-cocinero").hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ACCESO Y VISTA EXCLUSIVA DEL MESERO
function mostrarAccesoMesero() {
    const clave = prompt("Acceso de mesero. Ingresa la contraseña:");
    if (clave === null) return;
    if (clave !== CLAVE_MESERO) { alert("Contraseña incorrecta. Acceso denegado."); return; }
    sesionMesero = true;
    sesionCocinero = false;
    document.body.classList.remove("cook-mode");
    document.body.classList.add("waiter-mode");
    document.getElementById("panel-mesero").hidden = false;
    document.getElementById("panel-cocinero").hidden = true;
    renderizarPedidosMesero();
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function cerrarSesionMesero() {
    sesionMesero = false;
    document.body.classList.remove("waiter-mode");
    document.getElementById("panel-mesero").hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function obtenerPedidosCocina() {
    try { return JSON.parse(localStorage.getItem(CLAVE_PEDIDOS_LOCAL) || "[]"); }
    catch (error) { return []; }
}
function guardarPedidos(pedidos) {
    localStorage.setItem(CLAVE_PEDIDOS_LOCAL, JSON.stringify(pedidos));
    renderizarPedidosCocina();
    renderizarPedidosMesero();
}
function guardarPedidoCocina(pedido) {
    const pedidos = obtenerPedidosCocina();
    pedidos.push(pedido);
    guardarPedidos(pedidos);
}

function asignarMesaPedido(id, mesa) {
    if (!mesa) { alert("Selecciona una mesa para asignarla al pedido."); return; }
    const pedidos = obtenerPedidosCocina();
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    pedido.mesa = Number(mesa);
    pedido.mensajeMesero = `El pedido ${pedido.id} fue asignado a la mesa #${pedido.mesa}.`;
    pedido.actualizado = new Date().toISOString();
    guardarPedidos(pedidos);
}

function cambiarEstadoPedido(id, estado) {
    const pedidos = obtenerPedidosCocina();
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;
    if (!pedido.mesa) { alert("El mesero debe asignar una mesa antes de enviar el pedido a preparación."); return; }
    pedido.estado = estado;
    pedido.actualizado = new Date().toISOString();
    if (estado === "preparacion") {
        pedido.mensajeCliente = "Su plato se esta preparando, pronto estara listo";
        pedido.mensajeMesero = `El plato de la mesa #${pedido.mesa} se esta preparando`;
    } else if (estado === "listo") {
        pedido.mensajeCliente = "Su plato esta listo";
        pedido.mensajeMesero = `El plato de la mesa #${pedido.mesa} esta listo`;
    }
    guardarPedidos(pedidos);
}

function renderizarPedidosCocina() {
    if (!sesionCocinero) return;
    const contenedor = document.getElementById("pedidos-cocina");
    const pedidos = obtenerPedidosCocina().filter(p => p.estado !== "listo")
        .sort((a, b) => (a.mesa || 999) - (b.mesa || 999) || new Date(a.creado) - new Date(b.creado));
    if (!pedidos.length) { contenedor.innerHTML = '<div class="kitchen-empty">No hay pedidos pendientes de preparación.</div>'; return; }
    const grupos = [...new Set(pedidos.map(p => p.mesa || 0))].sort((a,b) => a-b);
    contenedor.innerHTML = grupos.map(mesa => {
        const grupo = pedidos.filter(p => (p.mesa || 0) === mesa);
        return `<section class="table-orders"><h3>${mesa ? `🍽️ Mesa ${mesa}` : "⏳ Pedidos sin mesa asignada"}</h3>
            ${grupo.map(p => tarjetaPedidoCocina(p)).join("")}</section>`;
    }).join("");
}
function tarjetaPedidoCocina(pedido) {
    const hora = new Date(pedido.creado).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    const productos = pedido.productos.map(prod => `<li><div><span>${escaparHTML(prod.nombre)}</span>${prod.personalizacion ? `<small class="ticket-customization">Personalización: ${escaparHTML(prod.personalizacion)}</small>` : ""}</div><strong>x${prod.cantidad}</strong></li>`).join("");
    const estadoTexto = pedido.estado === "pendiente" ? "Pendiente" : "En preparación";
    return `<article class="kitchen-ticket"><div class="ticket-top"><strong>${pedido.id}</strong><span>${hora}</span></div>
        <span class="ticket-status status-${pedido.estado}">${estadoTexto}</span><ul>${productos}</ul>
        <p class="ticket-total">Total: $${Number(pedido.total).toLocaleString("es-CO")}</p>
        <div class="ticket-actions">${pedido.estado === "pendiente" ? `<button onclick="cambiarEstadoPedido('${pedido.id}', 'preparacion')">Iniciar preparación</button>` : `<button onclick="cambiarEstadoPedido('${pedido.id}', 'listo')">Marcar como listo</button>`}</div>
    </article>`;
}

function renderizarPedidosMesero() {
    if (!sesionMesero) return;
    const contenedor = document.getElementById("pedidos-mesero");
    const pedidos = obtenerPedidosCocina().sort((a,b) => new Date(b.creado) - new Date(a.creado));
    if (!pedidos.length) { contenedor.innerHTML = '<div class="kitchen-empty">Todavía no hay pedidos del local.</div>'; return; }
    contenedor.innerHTML = pedidos.map(p => {
        const productos = p.productos.map(prod => `<li><div><span>${escaparHTML(prod.nombre)} x${prod.cantidad}</span>${prod.personalizacion ? `<small class="ticket-customization">Personalización: ${escaparHTML(prod.personalizacion)}</small>` : ""}</div></li>`).join("");
        const estado = p.estado === "listo" ? "Listo" : p.estado === "preparacion" ? "En preparación" : "Pendiente";
        const aviso = p.mensajeMesero || "Pedido recibido.";
        return `<article class="kitchen-ticket waiter-ticket"><div class="ticket-top"><strong>${p.id}</strong><span>${new Date(p.creado).toLocaleTimeString("es-CO", {hour:"2-digit",minute:"2-digit"})}</span></div>
            <span class="ticket-status status-${p.estado}">${estado}</span><p class="waiter-notice">${escaparHTML(aviso)}</p><ul>${productos}</ul>
            <p class="ticket-total">Total: $${Number(p.total).toLocaleString("es-CO")}</p>
            ${!p.mesa ? `<div class="assign-table"><label for="mesa-${p.id}">Asignar mesa:</label><select id="mesa-${p.id}"><option value="">Selecciona una mesa</option>${Array.from({length:20},(_,i)=>`<option value="${i+1}">Mesa ${i+1}</option>`).join("")}</select><button onclick="asignarMesaPedido('${p.id}', document.getElementById('mesa-${p.id}').value)">Guardar mesa</button></div>` : `<p><strong>Mesa asignada: #${p.mesa}</strong></p>`}
        </article>`;
    }).join("");
}

function escaparHTML(texto) {
    return String(texto).replace(/[&<>"']/g, caracter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caracter]));
}

function actualizarAvisoCliente() {
    const pedidoId = sessionStorage.getItem(CLAVE_ULTIMO_PEDIDO_CLIENTE);
    if (!pedidoId) return;
    const pedido = obtenerPedidosCocina().find(p => p.id === pedidoId);
    if (!pedido) return;
    const aviso = document.getElementById("notificacion-pedido");
    if (!aviso) return;
    aviso.hidden = false;
    aviso.textContent = pedido.mensajeCliente || "Tu pedido está registrado.";
    if (pedido.estado === "listo") aviso.classList.add("order-notification-ready");
    else aviso.classList.remove("order-notification-ready");
}

window.addEventListener("storage", evento => {
    if (evento.key === CLAVE_PEDIDOS_LOCAL) {
        renderizarPedidosCocina();
        renderizarPedidosMesero();
        actualizarAvisoCliente();
    }
});
document.addEventListener("DOMContentLoaded", () => {
    actualizarCarrito();
    actualizarAvisoCliente();
});
