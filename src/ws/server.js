import { WebSocketServer, WebSocket } from "ws"
import { wsArcjet } from "../arcjet.js"

/**
 * Map<matchId, Set<WebSocket>>
 */
const matchSubscribers = new Map()

/* ----------------------------- helpers ----------------------------- */

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify(payload))
}

/* -------------------------- subscriptions -------------------------- */

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set())
    }

    const subscribers = matchSubscribers.get(matchId)

    if (!subscribers.has(socket)) {
        subscribers.add(socket)
        socket.subscriptions.add(matchId)
    }
}

function unsubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId)
    if (!subscribers) return

    subscribers.delete(socket)

    if (subscribers.size === 0) {
        matchSubscribers.delete(matchId)
    }
}

function cleanUpSubscriptions(socket) {
    for (const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket)
    }
    socket.subscriptions.clear()
}

/* --------------------------- broadcasting -------------------------- */

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId)
    if (!subscribers || subscribers.size === 0) return

    const message = JSON.stringify(payload)

    for (const client of subscribers) {
        if (client.readyState !== WebSocket.OPEN) {
            subscribers.delete(client)
            continue
        }
        client.send(message)
    }
}

function broadcastToAll(wss, payload) {
    const message = JSON.stringify(payload)

    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    }
}

/* -------------------------- message handler ------------------------- */

function handleMessage(socket, data) {
    let message

    try {
        message = JSON.parse(data.toString())
    } catch {
        sendJson(socket, { type: "error", message: "Invalid JSON" })
        return
    }

    if (
        message.type === "subscribe" &&
        typeof message.matchId === "number" &&
        Number.isInteger(message.matchId)
    ) {
        subscribe(message.matchId, socket)
        sendJson(socket, { type: "subscribed", matchId: message.matchId })
        return
    }

    if (
        message.type === "unsubscribe" &&
        typeof message.matchId === "number" &&
        Number.isInteger(message.matchId)
    ) {
        unsubscribe(message.matchId, socket)
        socket.subscriptions.delete(message.matchId)
        sendJson(socket, { type: "unsubscribed", matchId: message.matchId })
        return
    }

    sendJson(socket, { type: "error", message: "Unknown message type" })
}

/* -------------------------- server attach --------------------------- */

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
    })

    /* -------- heartbeat (prevents ghost connections) -------- */

    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                ws.terminate()
                return
            }
            ws.isAlive = false
            ws.ping()
        })
    }, 30000)

    wss.on("close", () => clearInterval(heartbeatInterval))

    /* ------------------------ connection ------------------------ */

    wss.on("connection", async (socket, req) => {
        /* Arcjet protection */
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req)
                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008
                    const reason = decision.reason.isRateLimit()
                        ? "Too many requests"
                        : "Forbidden"
                    socket.close(code, reason)
                    return
                }
            } catch (err) {
                console.error("WS Arcjet error:", err)
                socket.close(1011, "Internal server error")
                return
            }
        }

        /* socket init */
        socket.subscriptions = new Set()
        socket.isAlive = true

        sendJson(socket, { type: "welcome" })

        socket.on("pong", () => {
            socket.isAlive = true
        })

        socket.on("message", (data) => handleMessage(socket, data))

        socket.on("close", () => cleanUpSubscriptions(socket))

        socket.on("error", () => {
            socket.terminate()
        })
    })

    /* -------------------- exposed broadcasters -------------------- */

    function broadcastMatchCreated(match) {
        broadcastToAll(wss, { type: "match_created", data: match })
    }

    function broadcastCommentary(matchId, commentary) {
        broadcastToMatch(matchId, {
            type: "commentary",
            data: commentary,
        })
    }

    return {
        broadcastMatchCreated,
        broadcastCommentary,
    }
}