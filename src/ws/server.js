import { WebSocketServer, WebSocket } from "ws"
import { wsArcjet } from "../arcjet.js"

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify(payload))
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
    })

    wss.on("connection", async (socket,req) => {
        if(wsArcjet){
            try{
                const decision = await wsArcjet.protect(req)
                if(decision.isDenied()){
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? "Too many requests" : "Forbidden";
                    socket.close(code,reason)
                    return
                }
            }catch(err){
                console.error("WS connection error",err)
                socket.close(1011,"Internal server error")
            }
        }
        sendJson(socket, { type: "welcome" })
        socket.on("error", console.error)
    })

    function broadcastMatchCreated(match) {
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "match_created",
                    data: match
                }))
            }
        }
    }

    return { broadcastMatchCreated }
}