import qrcode from "qrcode-terminal";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

async function start() {
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        browser: ["Windows", "Chrome", "1.0.0"]
    });

    const GRUPOS = {
        CTA: "120363024888095178@g.us",
        SERVICIOS: "120363426639499760@g.us"
    };

    const reglas = [
        {
            nombre: "SOPORTE CTA",
            grupo: GRUPOS.CTA,
            keywords: [
                "internet", "wifi", "red", "conexion", "switch", "cta",
                "cable", "modem", "router", "señal", "telefonia", "linea",
                "telefono", "llamada", "lento",
                "velocidad", "fibra", "coaxial", "television", "tv",
                "reporte", "tecnico", "configuracion","apagado",
                "reiniciar", "cftv",
                "hdmi", "puerto", "pantalla", "monitor", "display",
                "video", "hd", "4k", "resolucion", "imagen",
                "puerto de red", "solucion hdmi",
                "usb", "vga", "dvi", "adaptador", "convertidor",
                "splitter", "amplificador", "distribuidor", "cableado",
                "ponchado", "rj45", "cat5", "cat6", "fibra optica",
                "repetidor", "access point", "ap",
                "puente", "malla", "vpn", "dhcp", "dns", "ip",
                "gateway", "ping", "latencia", "paquete", "perdida",
                "intermitente", "desconecta", "se cae", "laguea",
                "streaming", "netflix", "spotify", "youtube",
                "whatsapp", "navegador", "correo", "outlook",
                "zoom", " teams", " meet", "no prende", "no enciende",
                "sin imagen", "sin video", "sin señal", "se apaga",
                "parpadea", "enciende", "apagar", "prende",
                "control remoto", "bateria", "cargador",
                "fuente de poder", "voltaje", "regulador",
                "no hay internet", "sin internet", "no carga",
                "lentitud", "congelado", "se traba", "no abre",
                "error", "codigo de error", "configurar","camaras"
            ]
        },
        {
            nombre: "SERVICIOS GENERALES",
            grupo: GRUPOS.SERVICIOS,
            keywords: [
                "luz", "agua", "baño", "mantenimiento", "limpieza",
                "drenaje", "tuberia", "gotera", "fuga", "corto","sucio",
                "electricidad", "contacto", "apagador", "ventilador",
                "clima", "aire", "refrigeracion", "pintura", "plomero",
                "cerrajero", "vidrio", "poda", "jardin", "basura","registro",
                "fumigacion", "desperfecto",
                "daño", "cisterna", "bomba", "tanque","plafon","plafón",
                "filtracion","filtración", "humedad", "goteras", "plomeria",
                "electricista", "carpinteria", "herreria", "soldadura",
                "albañil", "albañileria", "azulejo", "loseta", "piso",
                "pared", "techo", "losa", "block", "cemento", "arena",
                "herreria", "cancel", "ventana", "puerta", "chapa",
                "candado", "llave", "cerradura", "bisagra",
                "cortina", "persiana", "toldo", "mosquitero",
                "tinaco", "boiler", "calentador", "gas",
                "valvula", "llave de paso", "medidor",
                "purificador", "filtro", "sedimentos",
                "azulejo", "grieta", "cuarteadura", "desague",
                "registro", "coladera", "sifon", "bajo de agua",
                "inundacion", "anegado", "encharcado",
                "foco", "lampara", "luminario", "balastra",
                "interruptor", "termico", "pastilla",
                "no hay luz", "sin luz", "sin agua",
                "tapa", "asa", "manija", "jaladera",
                "rejilla", "respirador", "extractor",
                "campana", "horno", "estufa", "refrigerador"
            ]
        }
    ];

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log("📱 ESCANEA ESTE QR:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("✅ CONECTADO");
        }

        if (connection === "close") {
            console.log("❌ DESCONECTADO...");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const nombre = msg.pushName || msg.key.participant || from;

        if (from.endsWith("@g.us")) return;

        const type = Object.keys(msg.message)[0];
        const texto =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            msg.message.documentMessage?.caption ||
            "";

        const textoLower = texto.toLowerCase();

        console.log("📩 Mensaje:", texto);

        for (const regla of reglas) {
            if (regla.keywords.some(k => textoLower.includes(k))) {
                console.log(`➡️ Enviando a ${regla.nombre}`);

                const header = `📌 *Nuevo reporte (${regla.nombre})*\n👤 *${nombre}*`;

                if (type === "conversation" || type === "extendedTextMessage") {
                    await sock.sendMessage(regla.grupo, {
                        text: `${header}\n💬 ${texto}`
                    });
                } else {
                    await sock.sendMessage(regla.grupo, {
                        text: header
                    });

                    if (type === "imageMessage") {
                        const stream = await downloadContentFromMessage(msg.message.imageMessage, "image");
                        const buffer = [];
                        for await (const chunk of stream) buffer.push(chunk);
                        await sock.sendMessage(regla.grupo, {
                            image: Buffer.concat(buffer),
                            caption: texto || null
                        });
                    } else if (type === "videoMessage") {
                        const stream = await downloadContentFromMessage(msg.message.videoMessage, "video");
                        const buffer = [];
                        for await (const chunk of stream) buffer.push(chunk);
                        await sock.sendMessage(regla.grupo, {
                            video: Buffer.concat(buffer),
                            caption: texto || null
                        });
                    } else {
                        await sock.sendMessage(regla.grupo, { forward: msg });
                    }
                }

                return;
            }
        }

        console.log("❌ No se encontró categoría");
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
