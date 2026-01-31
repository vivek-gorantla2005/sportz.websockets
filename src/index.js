import express from "express";
import { matchRouter } from "./routes/matches.js";
import { attachWebSocketServer } from "./ws/server.js";
import http from "http";

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || "0.0.0.0"

const app = express()
const server = http.createServer(app);


app.use(express.json())

app.get("/", (req, res) => {
    res.send("Hello World!")
})



app.use("/matches",matchRouter)

const {broadcastMatchCreated} = attachWebSocketServer(server)
app.locals.broadcastMatchCreated = broadcastMatchCreated

server.listen(PORT,HOST,()=>{
    const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`
    console.log(`Server running on ${baseUrl}`)
    console.log(`WebSocket running on ${baseUrl.replace('http','ws')}/ws`)
})
