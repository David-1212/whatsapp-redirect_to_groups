import qrcode from "qrcode-terminal";
import { DisconnectReason } from "@whiskeysockets/baileys";

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

        const id = msg.key.remoteJid;
        if (id.endsWith("@g.us")) {
            console.log("👥 GRUPO:", id);
        } else {
            console.log("👤 DM:", id);
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
