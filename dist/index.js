"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOLANA_TOKENS = exports.tokenDataStore = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const axios_1 = __importDefault(require("axios"));
require("dotenv").config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
// In-memory store for token data
exports.tokenDataStore = {};
exports.SOLANA_TOKENS = [
    "solana",
    "bonk",
    "orca",
    "pyth-network",
    "shiba-inu",
    "helium",
    "jupiter",
    "drift-protocol",
    "wormhole",
];
// Function to fetch Solana token data
function fetchSolanaTokenData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ids = exports.SOLANA_TOKENS.join("%2C");
            console.log(ids, "ids");
            const response = yield axios_1.default.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`, {
                headers: {
                    accept: "application/json",
                    "x-cg-demo-api-key": `${process.env.COIN_GECKO_API}`,
                },
            });
            console.log(response.data, "response");
            return response.data;
        }
        catch (error) {
            console.error("Error fetching Solana token data:", error);
            return {};
        }
    });
}
// Function to update token data
function updateTokenData() {
    return __awaiter(this, void 0, void 0, function* () {
        const solanaData = yield fetchSolanaTokenData();
        for (const token of exports.SOLANA_TOKENS) {
            try {
                const tokenData = solanaData[token];
                if (!tokenData)
                    continue;
                // const sentimentData = await newsControllers.getNews({ coinName: token });
                // tokenDataStore[token] = {
                //   price: tokenData.usd,
                //   sentiment: sentimentData.overallSentiment,
                //   mintAddress: "", // You'll need to implement a way to get this
                //   symbol: token,
                //   lastUpdated: new Date(),
                //   marketCap: tokenData.usd_market_cap,
                //   volume24h: tokenData.usd_24h_vol,
                //   priceChange24h: tokenData.usd_24h_change,
                // };
                exports.tokenDataStore[token] = {
                    price: tokenData.usd,
                    sentiment: "positive",
                    mintAddress: "", // You'll need to implement a way to get this
                    symbol: token,
                    lastUpdated: new Date(),
                    marketCap: tokenData.usd_market_cap,
                    volume24h: tokenData.usd_24h_vol,
                    priceChange24h: tokenData.usd_24h_change,
                };
                console.log(`Updated data for ${token}`, exports.tokenDataStore[token]);
                io.to(token).emit("tokenDataUpdate", exports.tokenDataStore[token]);
            }
            catch (error) {
                console.error(`Error updating data for ${token}:`, error);
            }
        }
        //  Emit updated data to all connected clients
        // io.emit("tokenDataUpdate", tokenDataStore);
    });
}
// Update token data every minute
setInterval(updateTokenData, 6000);
app.get("/", (req, res) => {
    res.json({ msg: "hi user" });
});
io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("walletconnected", (data) => {
        console.log(data, "wallet connected");
    });
    socket.on("joinTokenRoom", ({ tokens }) => {
        console.log("joining room", tokens);
        socket.join(tokens);
        let userDataStore = {};
        for (const token of tokens) {
            // userDataStore[token] = tokenDataStore[token];
            io.to(token).emit("tokenDataUpdate", exports.tokenDataStore[token]);
        }
        console.log(userDataStore, "userTokenData");
        // Send current token data to the newly connected client
        // socket.emit("tokenDataUpdate", userDataStore);
    });
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});
server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
    // Initial update of token data
    updateTokenData();
});
