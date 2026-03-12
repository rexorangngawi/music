import { youtubePlay } from "../../lib/scraper";
import { getCache, setCache } from "../../lib/cache";
import { ratelimit } from "../../lib/ratelimit";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success:false,
      message:"Method not allowed"
    });
  }

  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown";

  if (!ratelimit(ip)) {
    return res.status(429).json({
      success:false,
      message:"Too many requests"
    });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({
      success:false,
      message:"URL is required"
    });
  }

  try {

    const cached = getCache(url);

    if (cached) {
      return res.status(200).json(cached);
    }

    const result = await youtubePlay(url);

    if (!result.success) {
      return res.status(500).json(result);
    }

    setCache(url, result);

    return res.status(200).json(result);

  } catch (error) {

    console.error("Play API error:", error);

    return res.status(500).json({
      success:false,
      message:"Failed to fetch audio"
    });
  }
}