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
exports.newsControllers = void 0;
const axios_1 = __importDefault(require("axios"));
const sentiment_1 = __importDefault(require("sentiment"));
const sentiment = new sentiment_1.default();
const API_KEY = process.env.NEW_API;
const currentDate = new Date();
const previousDate = new Date(currentDate);
previousDate.setDate(currentDate.getDate() - 1);
const year = previousDate.getFullYear();
const month = String(previousDate.getMonth() + 1).padStart(2, "0");
const day = String(previousDate.getDate()).padStart(2, "0");
const today = `${year}-${month}-${day}`;
function preprocessText(text) {
    return text.toLowerCase();
}
function getSentiment(text) {
    const result = sentiment.analyze(text);
    let sentimentCategory;
    if (result.score > 0) {
        sentimentCategory = "positive";
    }
    else if (result.score < 0) {
        sentimentCategory = "negative";
    }
    else {
        sentimentCategory = "neutral";
    }
    return { score: result.score, sentiment: sentimentCategory };
}
function analyzeSentiment(newsData) {
    return newsData.map((item) => {
        const { score, sentiment } = getSentiment(preprocessText(item.title + " " + item.description));
        return {
            title: item.title,
            sentiment: sentiment,
            score: score,
        };
    });
}
exports.newsControllers = {
    getNews: (_a) => __awaiter(void 0, [_a], void 0, function* ({ coinName }) {
        try {
            const url = `https://newsapi.org/v2/everything?q=${coinName}&from=${today}&sortBy=publishedAt&apiKey=${API_KEY}`;
            console.log(url);
            const response = yield axios_1.default.get(`https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${coinName}`);
            console.log(today, API_KEY, coinName);
            const newsData = response.data.results;
            const sentimentResults = analyzeSentiment(newsData);
            // Calculate overall sentiment
            const totalScore = sentimentResults.reduce((sum, result) => sum + result.score, 0);
            const averageScore = totalScore / sentimentResults.length;
            const overallSentiment = averageScore > 0
                ? "positive"
                : averageScore < 0
                    ? "negative"
                    : "neutral";
            console.log(`Overall sentiment for ${coinName}: ${overallSentiment} (Score: ${averageScore.toFixed(2)})`);
            // console.log("Sentiment Analysis Results:", sentimentResults);
            return {
                overallSentiment,
                averageScore,
                sentimentResults,
            };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }),
    analyzeSentiment: (_a) => __awaiter(void 0, [_a], void 0, function* ({ text }) {
        try {
            const { score, sentiment } = getSentiment(preprocessText(text));
            console.log(`Sentiment for provided text: ${sentiment} (Score: ${score})`);
            return { sentiment, score };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }),
};
