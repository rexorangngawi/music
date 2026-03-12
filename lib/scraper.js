import yts from "yt-search";

const CONVERT_URL = "https://www.youtubemp3.ltd/convert";

async function ytdlmp3(yturl) {
  const res = await fetch(CONVERT_URL, {
    method: "POST",
    headers: {
      "Accept": "*/*",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0",
      "Origin": "https://www.youtubemp3.ltd",
      "Referer": "https://www.youtubemp3.ltd/id"
    },
    body: new URLSearchParams({ url: yturl }).toString()
  });

  if (!res.ok) {
    throw new Error(`Converter error: ${res.status}`);
  }

  const data = await res.json();

  if (!data?.link) {
    throw new Error("Failed to get download link");
  }

  return data.link;
}

export async function youtubeSearch(query) {
  const search = await yts(`music ${query}`);

  return search.videos.slice(0, 5).map(v => ({
    id: v.videoId,
    url: v.url,
    title: v.title,
    uploader: v.author?.name || "Unknown",
    thumbnail: v.thumbnail,
    duration: v.timestamp
  }));
}

export async function youtubePlay(url) {
  try {
    const mp3 = await ytdlmp3(url);

    const info = await yts({ videoId: url.split("v=")[1] });
    const video = info?.videos?.[0];

    return {
      success: true,
      title: video?.title || "Unknown",
      uploader: video?.author?.name || "Unknown",
      thumbnail: video?.thumbnail || null,
      play: mp3
    };

  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
}