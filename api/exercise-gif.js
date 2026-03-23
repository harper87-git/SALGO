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
  if (id) {
    try {
      const imgUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(id)}&resolution=180`;
      const upstream = await fetch(imgUrl, { headers });
      if (!upstream.ok) return res.status(upstream.status).end();

      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=86400");
      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.send(buffer);
    } catch {
      return res.status(500).end();
    }
  }

  // ── MODE 1: Search exercise by name ─────────────────────────────────
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name or id query param required" });
  }

  // Aggressive normalization to get a clean base exercise name
  let cleaned = name
    .toLowerCase()
    // Expand common abbreviations
    .replace(/\bdb\b/g, "dumbbell")
    .replace(/\bbb\b/g, "barbell")
    .replace(/\bohp\b/g, "overhead press")
    .replace(/\brdl\b/g, "romanian deadlift")
    .replace(/\bghr\b/g, "glute ham raise")
    .replace(/\bez\b/g, "ez")
    .replace(/\brev\b/g, "reverse")
    .replace(/\balt\b/g, "alternating")
    // Strip L/R unilateral suffixes
    .replace(/\s+[lr]$/i, "")
    // Strip "w/ anything" compound suffixes
    .replace(/\s+w\/.*$/i, "")
    // Strip "to anything" compound suffixes (e.g. "close grip press to fly")
    .replace(/\s+to\s+(?:fly|rev|reverse|front|back|lunge|press|curl|raise).*$/i, "")
    // Strip leading numbered patterns like "1,1,2"
    .replace(/^[\d,]+\s+/g, "")
    // Strip training modifiers
    .replace(/\b(warmup|warm-up|warm up|amrap|emom|tempo|speed|heavy|max|pause|banded)\b/gi, "")
    .replace(/\bto 1rm\b/gi, "")
    // Strip set/rep descriptors that sometimes end up in names
    .replace(/\b\d+\s*(rep|set|min|sec|minute|second)s?\b/gi, "")
    // Clean up
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Skip searches for names that are clearly not individual exercises
  const skipPatterns = ["rest", "cardio", "foam roll", "stretch", "warm-up", "warm up", "limber", "release"];
  if (!cleaned || cleaned.length < 3 || skipPatterns.some(p => cleaned.includes(p))) {
    return res.json({ gifUrl: null });
  }

  // Try the full cleaned name first, then progressively shorter versions
  const attempts = [cleaned];

  // If multi-word, also try just the first 2-3 meaningful words as a fallback
  const words = cleaned.split(" ");
  if (words.length > 3) attempts.push(words.slice(0, 3).join(" "));
  if (words.length > 2) attempts.push(words.slice(0, 2).join(" "));

  for (const query of attempts) {
    try {
      const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query)}?limit=1&offset=0`;
      const upstream = await fetch(url, { headers });
      if (!upstream.ok) continue;

      const data = await upstream.json();
      if (Array.isArray(data) && data.length > 0 && data[0].id) {
        res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
        return res.json({ gifUrl: `/api/exercise-gif?id=${data[0].id}` });
      }
    } catch {
      continue;
    }
  }

  // Nothing found after all attempts
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
  return res.json({ gifUrl: null });
}
