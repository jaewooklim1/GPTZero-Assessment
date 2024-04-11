const WebSocket = require("ws");
const axios = require("axios");

async function getRichieRichResponse(prompt) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("ws://localhost:8082/v1/stream");

    ws.on("open", () => {
      console.log("Websocket connection established");
      ws.send(prompt);
    });

    ws.on("message", (data) => {
      console.log("Received response from server:", data);
      resolve(data);
      ws.close();
    });

    ws.on("error", (error) => {
      console.error.apply("Websocket error:", error);
      reject(error);
    });
  });
}

module.exports = {
  getRichieRichResponse,
};
