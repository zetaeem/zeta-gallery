/* Modo oscuro */
const themeToggleBtn = document.getElementById("theme-toggle");
const bodyElement = document.body;

/* Recuperar tema guardado */
if (localStorage.getItem("theme") === "dark") {
    bodyElement.classList.add("dark-mode");
}

/* Cambiar y guardar tema */
themeToggleBtn?.addEventListener("click", () => {
    const oscuro = bodyElement.classList.toggle("dark-mode");
    localStorage.setItem("theme", oscuro ? "dark" : "light");
});


/* Miniaturas de las prendas */
const principal = document.getElementById("foto-principal");
const botones = document.querySelectorAll(".miniaturas button");

if (principal) {
    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            principal.src = boton.dataset.src;
            principal.alt = boton.dataset.alt;

            botones.forEach(b => b.classList.remove("activa"));
            boton.classList.add("activa");
        });
    });
}


/* Buscador de diseños */
const buscador = document.getElementById("buscarPrenda");
const tarjetas = document.querySelectorAll(".galeria .tarjeta");
const mensajeSinResultados = document.getElementById("sin-resultados");
const contadorModelos = document.getElementById("modelos-count");

buscador?.addEventListener("input", () => {
    const consulta = buscador.value.toLocaleLowerCase("es").trim();
    let visibles = 0;

    /* Filtrar prendas */
    tarjetas.forEach(tarjeta => {
        const coincide = tarjeta.textContent
            .toLocaleLowerCase("es")
            .includes(consulta);

        tarjeta.hidden = !coincide;

        if (coincide) visibles++;
    });

    /* Mensaje sin resultados */
    if (mensajeSinResultados) {
        mensajeSinResultados.hidden = visibles !== 0;
    }

    /* Actualizar contador */
    if (contadorModelos) {
        contadorModelos.textContent =
            visibles + (visibles === 1 ? " modelo" : " modelos");
    }
});


/* Elementos con animación de entrada */
const elementosAnimados = document.querySelectorAll(
    "header.hero, #galeria .section-head, #galeria .buscador, " +
    "#galeria .tarjeta, #marca .marca-grid, " +
    ".volver, .detalle-grid > div, footer"
);

/* Preferencia de movimiento */
const preferenciaMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

/* Guardar transiciones originales */
const transicionesOriginales = new Map();

elementosAnimados.forEach(elemento => {
    transicionesOriginales.set(elemento, {
        valor: elemento.style.getPropertyValue("transition"),
        prioridad: elemento.style.getPropertyPriority("transition")
    });
});

let observadorAnimaciones = null;
let frameAnimaciones = null;
let versionAnimaciones = 0;


/* Restaurar transiciones */
function restaurarTransicion(elemento) {
    const original = transicionesOriginales.get(elemento);

    if (original.valor) {
        elemento.style.setProperty(
            "transition",
            original.valor,
            original.prioridad
        );
    } else {
        elemento.style.removeProperty("transition");
    }
}


/* Esperar la carga de imágenes */
async function esperarImagenDelBloque(elemento) {
    const imagen = elemento.querySelector("img");

    if (!imagen) return;

    let temporizador;
    let limpiarEscucha = () => {};

    try {
        let imagenLista;

        if (typeof imagen.decode === "function") {
            imagenLista = imagen.decode();

        } else if (!imagen.complete) {
            imagenLista = new Promise(resolve => {
                const terminar = () => resolve();

                limpiarEscucha = () => {
                    imagen.removeEventListener("load", terminar);
                    imagen.removeEventListener("error", terminar);
                };

                imagen.addEventListener("load", terminar, {
                    once: true
                });

                imagen.addEventListener("error", terminar, {
                    once: true
                });
            });

        } else {
            return;
        }

        /* Espera máxima de dos segundos */
        await Promise.race([
            imagenLista,
            new Promise(resolve => {
                temporizador = setTimeout(resolve, 2000);
            })
        ]);

    } catch {
        /* Mostrar aunque falle la imagen */
    } finally {
        clearTimeout(temporizador);
        limpiarEscucha();
    }
}


/* Iniciar animaciones */
function iniciarAnimaciones() {
    const versionActual = ++versionAnimaciones;

    /* Cancelar animaciones anteriores */
    if (frameAnimaciones !== null) {
        cancelAnimationFrame(frameAnimaciones);
        frameAnimaciones = null;
    }

    observadorAnimaciones?.disconnect();
    observadorAnimaciones = null;

    const animar =
        "IntersectionObserver" in window &&
        !preferenciaMovimiento.matches;

    /* Preparar estado inicial */
    elementosAnimados.forEach(elemento => {
        elemento.style.setProperty("transition", "none");
        elemento.classList.toggle("reveal", animar);
        elemento.classList.remove("visible");
    });

    bodyElement.classList.toggle("animaciones-activas", animar);

    /* Aplicar estado inicial */
    void bodyElement.offsetHeight;

    elementosAnimados.forEach(restaurarTransicion);

    if (!animar) return;

    /* Detectar elementos visibles */
    frameAnimaciones = requestAnimationFrame(() => {
        frameAnimaciones = null;

        if (versionActual !== versionAnimaciones) return;

        observadorAnimaciones = new IntersectionObserver(
            (entradas, observer) => {

                if (versionActual !== versionAnimaciones) return;

                entradas.forEach(entrada => {
                    if (!entrada.isIntersecting) return;

                    observer.unobserve(entrada.target);

                    esperarImagenDelBloque(entrada.target).then(() => {
                        if (
                            versionActual === versionAnimaciones &&
                            !preferenciaMovimiento.matches
                        ) {
                            entrada.target.classList.add("visible");
                        }
                    });
                });
            },
            { threshold: 0.12 }
        );

        elementosAnimados.forEach(elemento => {
            observadorAnimaciones.observe(elemento);
        });
    });
}


/* Animar al cargar */
iniciarAnimaciones();

/* Animar al regresar a una página */
window.addEventListener("pageshow", evento => {
    if (evento.persisted) iniciarAnimaciones();
});

/* Respetar movimiento reducido */
preferenciaMovimiento.addEventListener("change", iniciarAnimaciones);


/* Visor de fotografías */
(() => {
    const foto = document.getElementById("foto-principal");

    if (!foto) return;

    /* Contenedor de imagen principal */
    const contenedor = document.createElement("div");

    contenedor.className = "zoom-contenedor";
    contenedor.tabIndex = 0;
    contenedor.setAttribute("role", "button");
    contenedor.setAttribute("aria-label", "Ampliar fotografía");

    foto.parentNode.insertBefore(contenedor, foto);
    contenedor.appendChild(foto);


    /* Crear pantalla completa */
    const visor = document.createElement("dialog");

    visor.className = "zoom-pantalla";
    visor.setAttribute("aria-label", "Visor de fotografías ZETA");

    visor.innerHTML = `
        <div class="zoom-barra">
            <span>ZETA / VISOR</span>

            <button class="zoom-cerrar"
                    aria-label="Cerrar visor">×</button>
        </div>

        <div class="zoom-area">
            <img alt="" draggable="false">
        </div>

        <div class="zoom-controles">
            <button class="zoom-menos"
                    aria-label="Reducir zoom">−</button>

            <span class="zoom-porcentaje">100%</span>

            <button class="zoom-mas"
                    aria-label="Aumentar zoom">+</button>

            <button class="zoom-reset"
                    aria-label="Restablecer zoom">↺</button>
        </div>
    `;

    bodyElement.appendChild(visor);


    /* Elementos del visor */
    const area = visor.querySelector(".zoom-area");
    const imagen = area.querySelector("img");
    const porcentaje = visor.querySelector(".zoom-porcentaje");


    /* Variables de ampliación */
    let escala = 1;
    let x = 0;
    let y = 0;
    let inicioX = 0;
    let inicioY = 0;
    let arrastrando = false;


    /* Actualizar posición y escala */
    function actualizar() {
        const limiteX = Math.max(
            0,
            (imagen.offsetWidth * escala - area.clientWidth) / 2
        );

        const limiteY = Math.max(
            0,
            (imagen.offsetHeight * escala - area.clientHeight) / 2
        );

        x = Math.max(-limiteX, Math.min(limiteX, x));
        y = Math.max(-limiteY, Math.min(limiteY, y));

        imagen.style.transform =
            `translate(${x}px, ${y}px) scale(${escala})`;

        porcentaje.textContent = Math.round(escala * 100) + "%";

        imagen.style.cursor = escala > 1 ? "grab" : "zoom-in";
    }


    /* Zoom del 100% al 400% */
    function cambiarZoom(cantidad) {
        escala = Math.min(4, Math.max(1, escala + cantidad));

        if (escala === 1) {
            x = 0;
            y = 0;
        }

        actualizar();
    }


    /* Restablecer ampliación */
    function restablecer() {
        escala = 1;
        x = 0;
        y = 0;

        actualizar();
    }


    /* Abrir pantalla completa */
    function abrirZoom() {
        if (visor.open) return;

        imagen.src = foto.currentSrc || foto.src;
        imagen.alt = foto.alt;

        visor.showModal();

        document.documentElement.classList.add("zoom-abierto");
        bodyElement.classList.add("zoom-abierto");

        restablecer();
    }


    /* Abrir mediante clic */
    contenedor.addEventListener("click", abrirZoom);


    /* Abrir mediante teclado */
    contenedor.addEventListener("keydown", evento => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            abrirZoom();
        }
    });


    /* Cerrar pantalla completa */
    visor.querySelector(".zoom-cerrar")
        .addEventListener("click", () => visor.close());

    visor.addEventListener("close", () => {
        document.documentElement.classList.remove("zoom-abierto");
        bodyElement.classList.remove("zoom-abierto");

        arrastrando = false;

        restablecer();
        contenedor.focus({ preventScroll: true });
    });


    /* Botones de zoom */
    visor.querySelector(".zoom-mas")
        .addEventListener("click", () => cambiarZoom(0.25));

    visor.querySelector(".zoom-menos")
        .addEventListener("click", () => cambiarZoom(-0.25));

    visor.querySelector(".zoom-reset")
        .addEventListener("click", restablecer);


    /* Zoom con rueda del mouse */
    area.addEventListener("wheel", evento => {
        evento.preventDefault();

        cambiarZoom(evento.deltaY < 0 ? 0.15 : -0.15);

    }, { passive: false });


    /* Iniciar arrastre */
    area.addEventListener("pointerdown", evento => {
        if (escala <= 1 || evento.button !== 0) return;

        arrastrando = true;

        inicioX = evento.clientX - x;
        inicioY = evento.clientY - y;

        area.setPointerCapture(evento.pointerId);

        imagen.style.cursor = "grabbing";
    });


    /* Mover imagen ampliada */
    area.addEventListener("pointermove", evento => {
        if (!arrastrando) return;

        x = evento.clientX - inicioX;
        y = evento.clientY - inicioY;

        actualizar();

        imagen.style.cursor = "grabbing";
    });


    /* Finalizar arrastre */
    function terminarArrastre() {
        arrastrando = false;
        actualizar();
    }

    area.addEventListener("pointerup", terminarArrastre);
    area.addEventListener("pointercancel", terminarArrastre);


    /* Doble clic para ampliar */
    imagen.addEventListener("dblclick", () => {
        if (escala === 1) {
            cambiarZoom(1);
        } else {
            restablecer();
        }
    });


    /* Actualizar al cargar imagen */
    imagen.addEventListener("load", actualizar);


    /* Adaptar visor a la pantalla */
    window.addEventListener("resize", () => {
        if (visor.open) actualizar();
    });

})();


/* Regresar al inicio al presionar ZETA */
document.querySelectorAll('a.brandmark[href="#inicio"]')
    .forEach(logo => {
        logo.addEventListener("click", evento => {
            evento.preventDefault();

            window.scrollTo({
                top: 0,
                behavior: preferenciaMovimiento.matches
                    ? "auto"
                    : "smooth"
            });
        });
    });