import axios from "axios";
import Sentiment from "sentiment";
const sentiment = new Sentiment();

const API_KEY = process.env.NEW_API;

interface News {
  source: {
    id: string;
    name: string;
  };
  author: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  content: string;
}

interface SentimentResult {
  title: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
}

const currentDate = new Date();
const previousDate = new Date(currentDate);
previousDate.setDate(currentDate.getDate() - 1);

const year = previousDate.getFullYear();
const month = String(previousDate.getMonth() + 1).padStart(2, "0");
const day = String(previousDate.getDate()).padStart(2, "0");
const today = `${year}-${month}-${day}`;

function preprocessText(text: string): string {
  return text.toLowerCase();
}

function getSentiment(text: string): {
  score: number;
  sentiment: "positive" | "negative" | "neutral";
} {
  const result = sentiment.analyze(text);
  let sentimentCategory: "positive" | "negative" | "neutral";

  if (result.score > 0) {
    sentimentCategory = "positive";
  } else if (result.score < 0) {
    sentimentCategory = "negative";
  } else {
    sentimentCategory = "neutral";
  }

  return { score: result.score, sentiment: sentimentCategory };
}

function analyzeSentiment(newsData: News[]): SentimentResult[] {
  return newsData.map((item) => {
    const { score, sentiment } = getSentiment(
      preprocessText(item.title + " " + item.description)
    );
    return {
      title: item.title,
      sentiment: sentiment,
      score: score,
    };
  });
}

export const newsControllers = {
  getNews: async ({ coinName }: { coinName: string }) => {
    try {
      const url = `https://newsapi.org/v2/everything?q=${coinName}&from=${today}&sortBy=publishedAt&apiKey=${API_KEY}`;
      console.log(url);

      const response = await axios.get(
        `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${coinName}`
      );
      console.log(today, API_KEY, coinName);

      const newsData: News[] = response.data.results;
      const sentimentResults = analyzeSentiment(newsData);

      // Calculate overall sentiment
      const totalScore = sentimentResults.reduce(
        (sum, result) => sum + result.score,
        0
      );
      const averageScore = totalScore / sentimentResults.length;
      const overallSentiment =
        averageScore > 0
          ? "positive"
          : averageScore < 0
          ? "negative"
          : "neutral";

      console.log(
        `Overall sentiment for ${coinName}: ${overallSentiment} (Score: ${averageScore.toFixed(
          2
        )})`
      );
      // console.log("Sentiment Analysis Results:", sentimentResults);

      return {
        overallSentiment,
        averageScore,
        sentimentResults,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  analyzeSentiment: async ({ text }: { text: string }) => {
    try {
      const { score, sentiment } = getSentiment(preprocessText(text));
      console.log(
        `Sentiment for provided text: ${sentiment} (Score: ${score})`
      );
      return { sentiment, score };
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};
