import { youtubeSearch } from "../../lib/scraper";
import { ratelimit } from "../../lib/ratelimit";
import { getCache, setCache } from "../../lib/cache";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown";

  if (!ratelimit(ip)) {
    return res.status(429).json({
      success: false,
      message: "Too many requests"
    });
  }

  const { q } = req.body || {};

  if (!q || q.length < 1) {
    return res.status(400).json({
      success: false,
      message: "Query must be at least 1 characters"
    });
  }

  try {

    const cacheKey = `search:${q}`;

    const cached = getCache(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        results: cached,
        cached: true
      });
    }

    const results = await youtubeSearch(q);

    setCache(cacheKey, results);

    return res.status(200).json({
      success: true,
      results
    });

  } catch (error) {

    console.error("Search API error:", error);

    return res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
}