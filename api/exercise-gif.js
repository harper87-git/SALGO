export default async function handler(req, res) {
  const { name, id } = req.query;

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RAPIDAPI_KEY env var not set" });
  }

  const headers = {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
  };

  // ── MODE 2: Proxy the actual GIF image ──────────────────────────────
  // Called by the <img> tag in ExDrawer via the URL returned in Mode 1
  if (id) {
    try {
      const imgUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(id)}&resolution=180`;
      const upstream = await fetch(imgUrl, { headers });

      if (!upstream.ok) {
        return res.status(upstream.status).end();
      }

      // Cache at Vercel edge for 7 days so repeat views never hit the API
      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=86400");

      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.send(buffer);
    } catch {
      return res.status(500).end();
    }
  }

  // ── MODE 1: Search exercise by name, return a proxy URL ─────────────
  // Called by the useExerciseGif hook in App.jsx
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name or id query param required" });
  }

  const normalized = name
    .toLowerCase()
    .replace(/\bdb\b/g, "dumbbell")
    .replace(/\bbb\b/g, "barbell")
    .replace(/\bohp\b/g, "overhead press")
    .replace(/\brdl\b/g, "romanian deadlift")
    .replace(/\bghr\b/g, "glute ham raise")
    .replace(/\bto 1rm\b/gi, "")
    .replace(/\bmax\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(normalized)}?limit=1&offset=0`;
    const upstream = await fetch(url, { headers });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ gifUrl: null });
    }

    const data = await upstream.json();

    if (!Array.isArray(data) || data.length === 0 || !data[0].id) {
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
      return res.json({ gifUrl: null });
    }

    // Return a URL that points back to THIS function in proxy mode
    const exerciseId = data[0].id;
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
    return res.json({ gifUrl: `/api/exercise-gif?id=${exerciseId}` });
  } catch {
    return res.json({ gifUrl: null });
  }
}
