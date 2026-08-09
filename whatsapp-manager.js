const fs = require("fs");
const path = require("path");
const { handleNumber } = require("./utils/utils");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("baileys");
const { v4: uuidv4 } = require("uuid");

class WhatsAppClientManager {
  constructor() {
    this.client = null;
    this.readyAt = null;
    this.sessionId = null;
  }

  async initSession(session_id) {
    console.log(`Initializing single WhatsApp session`);
    return new Promise(async (resolve, reject) => {
      let settled = false;
      try {
        // Auth folder path
        const sessionId = session_id || uuidv4();
        const sessionPath = path.join(__dirname, "sessions", sessionId);

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const sock = makeWASocket({
          // version: [2, 3000, 1034074495],
          auth: state,
          printQRInTerminal: false,
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr }) => {
            if (qr && !settled) {
              settled = true;
              resolve({ qr, sessionId });
            }

            if (connection === "open") {
              console.log(`WhatsApp connected`);
              this.client = sock;
              this.readyAt = new Date();
              this.sessionId = sessionId;
              settled = true;
              return resolve({
                status: "authenticated",
                sessionId: sessionId,
                message: "WhatsApp session ready",
              });
            }

            if (connection === "close") {
              const reason = lastDisconnect?.error?.output?.statusCode;
              if (reason === DisconnectReason.loggedOut) {
                console.log(`Logged out`);
                this.client = null;
                this.readyAt = null;
                this.sessionId = null;
                fs.rmSync(sessionPath, { recursive: true, force: true });
              } else {
                console.log(`Reconnecting session...`);
                setTimeout(() => {
                  this.initSession(sessionId)
                    .then(() => console.log(`Reconnected`))
                    .catch((err) => console.error("Reconnect failed:", err));
                }, 3000);
              }
            }
          },
        );

        // Store the socket instance
        this.client = sock;
        this.sessionId = sessionId;
      } catch (err) {
        console.error("Session initialization error:", err);
        if (!settled) {
          settled = true;
          reject(err);
        }
      }
    });
  }

  async sendMessage(message, to, fileName, mimeType, base64data) {
    try {
      if (!this.client) throw new Error("WhatsApp client not connected");
      const chatId = handleNumber(to);
      console.log("Chat ID", chatId);

      if (!!base64data) {
        const buffer = Buffer.from(base64data, "base64");
        const sentMessage = await this.client.sendMessage(chatId, {
          image: mimeType?.startsWith("image/") ? buffer : undefined,
          document: mimeType?.startsWith("application/") ? buffer : undefined,
          video: mimeType?.startsWith("video/") ? buffer : undefined,
          mimetype: mimeType || undefined,
          fileName: fileName || `nota.pdf`,
          caption: message,
        });
        return {
          status: "success",
          messageId: sentMessage,
        };
      } else {
        const sentMessage = await this.client.sendMessage(chatId, {
          text: message,
        });
        return {
          status: "success",
          messageId: sentMessage,
        };
      }
    } catch (err) {
      console.error("Sending message error:", err);
      return {
        status: "error",
        error: err.message,
      };
    }
  }

  getClient() {
    return this.client || null;
  }

  checkSessionStatus() {
    console.log({ Client: this.client });
    if (this.client && this.client.info) return "ready";
    if (this.client && this.client.pupPage && !this.client.info)
      return "connecting";
    return "disconnected";
  }
}

module.exports = { WhatsAppClientManager };
