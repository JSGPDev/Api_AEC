class Chat {
    constructor(id) {
        this.id = id;
        this.chatFlow = {
            "start": {
                hola: {
                    "¡Hola! ¡Bienvenido a AEC! ¿Cómo estás hoy? ¿Qué te gustaría hacer? \n1: Ver nuestros servicios \n2: Obtener información avanzada \n\n Recuarda que puedes escrir comandos espesificos para hacer acciones a lo largo de esta convesacion, por ahora existen dos: \n'atras': al escribir esta unica palabra iras un paso atras en la convesacion en caso de que te quivoques con tu respuesta\n'adios': al escribir esta unica palabra, terminaras la conversacion inmediatamente.": {
                        1: {
                            "Estos son nuestros servicios: \n1: enfermería \n2: inyectología \n3: acompañamiento": {
                                1: {
                                    "Elegiste enfermería. ¿Qué te gustaría saber? \n1: Precio \n2: Contratar": {
                                        1: { "Precio de enfermería": "" },
                                        2: { "Contrataste enfermería": "" }
                                    }
                                },
                                2: {
                                    "Elegiste inyectología. ¿Qué te gustaría saber? \n1: Precio \n2: Contratar": {
                                        1: { "Precio de inyectología": "" },
                                        2: { "Contrataste inyectología": "" }
                                    }
                                },
                                3: { "Elegiste acompañamiento": "" }
                            }
                        },
                        2: { "Elegiste información avanzada": "" }
                    }
                },
                adios: { "¡Hasta luego! Que tengas un buen día.": "" }
            }
        };
        this.lastRes = "start";
        this.lastText = "";
    }

    handleUserResponse(respuesta) {
        const userRespuesta = respuesta.trim().toLowerCase();
        if (userRespuesta !== "adios" && userRespuesta !== "atras") {
            const Res = `${this.lastRes}|${userRespuesta}`;

            const botRes = getValueFromPath(this.chatFlow, Res);
            if (botRes.ok) {
                this.lastRes += `|${userRespuesta}|${botRes.texto}`;
                this.lastText = botRes.texto;
            }
            return botRes.ok ? botRes.texto : botRes.texto + "\n" + this.lastText;
        } else if (userRespuesta === "atras") {
            return this.handleBackResponse();
        } else if (userRespuesta === "adios") {
            const botRes = getValueFromPath(this.chatFlow, "start|adios");
            return botRes.ok ? botRes.texto : botRes.texto + "\n" + this.lastText;
        }
    }

    handleBackResponse() {
        const resParts = this.lastRes.split("|");
        if (resParts.length > 1) {
            const estadoAnterior = resParts[resParts.length - 3] === 'start' ? "Has vuelto al inicio. para reiniciar el chat envia un 'hola'" : resParts[resParts.length - 3];

            resParts.pop();
            resParts.pop();
            this.lastRes = resParts.join("|");

            return estadoAnterior;
        } else {
            this.lastRes = "start";
            this.lastText = "";
            return "Has vuelto al inicio. para reiniciar el chat envia un 'hola'";
        }
    }

}

function getValueFromPath(obj, path) {
    const keys = path.split("|");
    let current = obj;

    for (const key of keys) {
        if (current[key] === undefined) {
            return { ok: false, texto: "lo siento, no entiendo tu respuesta \n" + this.lastText };
        }
        current = current[key];
    }

    return { ok: true, texto: Object.keys(current)[0] };
}

module.exports = Chat;