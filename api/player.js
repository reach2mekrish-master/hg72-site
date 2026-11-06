// Vercel serverless function: GET /api/player?tag=R2VPQCQ28
// Your key lives in the BRAWL_API_KEY environment variable, never in this file.
const TAG_RE = /^[0289PYLQGRJCUV]{3,12}$/;

module.exports = async function handler(req, res) {
  const tag = String(req.query.tag || "").toUpperCase().replace(/^#/, "").replace(/O/g, "0");
  if (!TAG_RE.test(tag)) return res.status(400).json({ error: "invalid tag" });
  if (!process.env.BRAWL_API_KEY) return res.status(500).json({ error: "missing key" });

  try {
    // RoyaleAPI proxy: lets the official API accept requests from any host
    const r = await fetch("https://bsproxy.royaleapi.dev/v1/players/%23" + tag, {
      headers: { Authorization: "Bearer " + process.env.BRAWL_API_KEY },
    });
    if (!r.ok) return res.status(r.status).json({ error: "lookup failed" });
    const p = await r.json();

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      name: p.name,
      tag: p.tag,
      expLevel: p.expLevel,
      trophies: p.trophies,
      highestTrophies: p.highestTrophies,
      "3vs3Victories": p["3vs3Victories"],
      soloVictories: p.soloVictories,
      duoVictories: p.duoVictories,
      highestAllTimeRankedRank: p.highestAllTimeRankedRank,
      club: p.club ? { name: p.club.name } : null,
      brawlers: (p.brawlers || []).map((b) => ({ name: b.name, power: b.power, trophies: b.trophies })),
    });
  } catch (e) {
    return res.status(502).json({ error: "upstream error" });
  }
};
