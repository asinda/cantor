export type YouTubeInfo = {
  title: string;
  channel: string;
  thumbnail: string;
  video_id: string;
};

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function fetchYouTubeInfo(url: string): Promise<YouTubeInfo | null> {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      title:     data.title ?? "",
      channel:   data.author_name ?? "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      video_id:  videoId,
    };
  } catch {
    return null;
  }
}
