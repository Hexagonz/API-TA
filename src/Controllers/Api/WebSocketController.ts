import WebSocket from "ws";
import { Server } from "http";
import axios from "axios";

class WebSocketController {
  private wss: WebSocket.Server;

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server });
    this.initializeSocket();
  }

  private initializeSocket() {
    this.wss.on("connection", (ws) => {
      console.log("[WS] Client connected");

      ws.on("message", async (data: WebSocket.RawData) => {
        try {
          const { image, nim, mapel } = JSON.parse(data.toString());
          if (!image || !nim || !mapel) {
            ws.send(JSON.stringify({ error: "Image dan NIM wajib dikirim" }));
            return;
          }
          const response = await axios.post("http://localhost:5005/predict", {
            image,
            nim,
            mapel
          });

          const result = response.data?.result || "Tidak Dikenal";
          ws.send(JSON.stringify({ result, absen: response.data?.absen  }));
        } catch (error: any) {
          console.error("[Recognition Error]", error.message);
          const errMsg =
            error.response?.data?.error || "Proses pengenalan gagal.";
          ws.send(JSON.stringify({ error: errMsg }));
        }
      });

      ws.on("close", () => {
        console.log("[WS] Client disconnected");
      });
    });
  }
}

export default WebSocketController;
