import express from "express";
import { matchRouter } from "./routes/matches.js";

const app = express()

app.use(express.json())

app.get("/", (req, res) => {
    res.send("Hello World!")
})

app.use("/matches",matchRouter)

app.listen(3000, () => {
    console.log("Server started on port 3000");
})
