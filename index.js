import qrcode from "qrcode-terminal";
import { downloadContentFromMessage, DisconnectReason } from "@whiskeysockets/baileys";

const GRUPO_DESTINO = "120363408618750412@g.us";

async function start() {
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ["Windows", "Chrome", "1.0.0"]
    });

    const contactos = {};

    sock.ev.on("contacts.upsert", (upserted) => {
        for (const c of upserted) {
            contactos[c.jid] = c;
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📱 ESCANEA ESTE QR:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("✅ CONECTADO");
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.restartRequired) {
                console.log("🔄 Reconectando...");
                start();
            } else {
                console.log("❌ DESCONECTADO...");
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const nombre = msg.pushName || "";

        if (from.endsWith("@g.us")) return;

        let numero = "";
        const senderJid = contactos[from]?.jid || from;
        if (senderJid.includes("@s.whatsapp.net")) {
            numero = senderJid.split("@")[0].replace(/:.*/, "");
        }

        const type = Object.keys(msg.message)[0];
        const texto =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            msg.message.documentMessage?.caption ||
            "";

        console.log(`📩 Mensaje de ${nombre}: ${texto}`);

        const header = `📌 *Nuevo mensaje*\n👤 *${nombre}*`;

        if (type === "conversation" || type === "extendedTextMessage") {
            await sock.sendMessage(GRUPO_DESTINO, {
                text: `${header}\n💬 ${texto}`
            });
        } else if (type === "imageMessage") {
            await sock.sendMessage(GRUPO_DESTINO, { text: header });
            const stream = await downloadContentFromMessage(msg.message.imageMessage, "image");
            const buffer = [];
            for await (const chunk of stream) buffer.push(chunk);
            await sock.sendMessage(GRUPO_DESTINO, {
                image: Buffer.concat(buffer),
                caption: texto || null
            });
        } else if (type === "videoMessage") {
            await sock.sendMessage(GRUPO_DESTINO, { text: header });
            const stream = await downloadContentFromMessage(msg.message.videoMessage, "video");
            const buffer = [];
            for await (const chunk of stream) buffer.push(chunk);
            await sock.sendMessage(GRUPO_DESTINO, {
                video: Buffer.concat(buffer),
                caption: texto || null
            });
        } else if (type === "audioMessage") {
            await sock.sendMessage(GRUPO_DESTINO, { text: header });
            const stream = await downloadContentFromMessage(msg.message.audioMessage, "audio");
            const buffer = [];
            for await (const chunk of stream) buffer.push(chunk);
            await sock.sendMessage(GRUPO_DESTINO, {
                audio: Buffer.concat(buffer),
                mimetype: msg.message.audioMessage.mimetype
            });
        } else if (type === "documentMessage") {
            await sock.sendMessage(GRUPO_DESTINO, { text: header });
            const stream = await downloadContentFromMessage(msg.message.documentMessage, "document");
            const buffer = [];
            for await (const chunk of stream) buffer.push(chunk);
            await sock.sendMessage(GRUPO_DESTINO, {
                document: Buffer.concat(buffer),
                mimetype: msg.message.documentMessage.mimetype,
                fileName: msg.message.documentMessage.fileName
            });
        } else {
            await sock.sendMessage(GRUPO_DESTINO, { text: `${header}\n🔄 *Tipo:* ${type}` });
            await sock.sendMessage(GRUPO_DESTINO, { forward: msg });
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
