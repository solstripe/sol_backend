import express from "express";
import http from "http";
import { Server } from "socket.io";
// import { walletControllers } from "./controllers/walletControllers";
import { newsControllers } from "./controllers/newsControllers";
import axios from "axios";

require("dotenv").config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);

interface TokenData {
  price: number;
  sentiment: string;
  mintAddress: string;
  symbol: string;
  lastUpdated: Date;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
}

// In-memory store for token data
export const tokenDataStore: { [key: string]: TokenData } = {};

export const SOLANA_TOKENS = [
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
async function fetchSolanaTokenData() {
  try {
    const ids = SOLANA_TOKENS.join("%2C");
    console.log(ids, "ids");

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": `${process.env.COIN_GECKO_API}`,
        },
      }
    );
    console.log(response.data, "response");

    return response.data;
  } catch (error) {
    console.error("Error fetching Solana token data:", error);
    return {};
  }
}

// Function to update token data
async function updateTokenData() {
  const solanaData = await fetchSolanaTokenData();

  for (const token of SOLANA_TOKENS) {
    try {
      const tokenData = solanaData[token];
      if (!tokenData) continue;

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
      tokenDataStore[token] = {
        price: tokenData.usd,
        sentiment: "positive",
        mintAddress: "", // You'll need to implement a way to get this
        symbol: token,
        lastUpdated: new Date(),
        marketCap: tokenData.usd_market_cap,
        volume24h: tokenData.usd_24h_vol,
        priceChange24h: tokenData.usd_24h_change,
      };

      console.log(`Updated data for ${token}`, tokenDataStore[token]);
      io.to(token).emit("tokenDataUpdate", tokenDataStore[token]);
    } catch (error) {
      console.error(`Error updating data for ${token}:`, error);
    }
  }

  //  Emit updated data to all connected clients

  // io.emit("tokenDataUpdate", tokenDataStore);
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
    let userDataStore: { [key: string]: TokenData } = {};

    for (const token of tokens) {
      // userDataStore[token] = tokenDataStore[token];
      io.to(token).emit("tokenDataUpdate", tokenDataStore[token]);
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
