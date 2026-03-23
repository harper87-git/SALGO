export default async function handler(req, res) {
  const { name } = req.query;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name query param required" });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "RAPIDAPI_KEY env var not set" });
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

    const upstream = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ gifUrl: null });
    }

    const data = await upstream.json();

    if (!Array.isArray(data) || data.length === 0) {
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
      return res.json({ gifUrl: null });
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
    return res.json({ gifUrl: data[0].gifUrl || null });
  } catch (err) {
    return res.status(500).json({ gifUrl: null });
  }
}
