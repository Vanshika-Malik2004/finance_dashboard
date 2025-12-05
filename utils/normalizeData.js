// utils/normalizeData.js (or inside useWidgetData.js)

function looksLikeAlphaTimeSeriesObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const firstKey = Object.keys(obj)[0];
  const firstVal = obj[firstKey];
  return (
    firstKey &&
    typeof firstVal === "object" &&
    firstVal !== null &&
    ("1. open" in firstVal || "4. close" in firstVal)
  );
}

function looksLikeFinnhubCandles(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const needed = ["c", "h", "l", "o", "t", "v"];
  return (
    needed.every((k) => Array.isArray(obj[k])) && typeof obj.s === "string"
  );
}

export function normalizeData(widget, extractedData, rawJson) {
  const { type } = widget || {};
  let list = [];
  let single = null;

  // 1) Nothing extracted → return empty
  if (extractedData == null) {
    return {
      raw: rawJson,
      extracted: extractedData,
      list: [],
      single: null,
      timestamp: Date.now(),
    };
  }

  // 2) CHART WIDGET SPECIAL CASES
  if (type === "chart") {
    // 2a) Finnhub candles at dataPath (root)
    if (looksLikeFinnhubCandles(extractedData)) {
      const { c, h, l, o, t, v } = extractedData;
      const n = t.length;
      list = [];
      for (let i = 0; i < n; i++) {
        list.push({
          time: t[i],
          open: o[i],
          high: h[i],
          low: l[i],
          close: c[i],
          volume: v[i],
        });
      }
      single = list[n - 1] || null;
    }
    // 2b) Alpha Vantage style: object-of-objects with "1. open" etc.
    else if (looksLikeAlphaTimeSeriesObject(extractedData)) {
      const entries = Object.entries(extractedData);
      list = entries
        .map(([timestamp, ohlc]) => ({
          time: timestamp,
          open: parseFloat(ohlc["1. open"]),
          high: parseFloat(ohlc["2. high"]),
          low: parseFloat(ohlc["3. low"]),
          close: parseFloat(ohlc["4. close"]),
          volume: parseFloat(ohlc["5. volume"]),
        }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));
      single = list[list.length - 1] || null;
    }
    // 2c) Already an array of objects → just use as-is, but sort by "time" if present
    else if (Array.isArray(extractedData)) {
      list = extractedData.slice();
      if (list.length && "time" in list[0]) {
        list.sort((a, b) => new Date(a.time) - new Date(b.time));
      }
      single = list[list.length - 1] || null;
    }
    // 2d) Fallback: object-of-objects without Alpha keys → flatten to { key, ...value }
    else if (typeof extractedData === "object") {
      const entries = Object.entries(extractedData);
      list = entries.map(([key, val]) =>
        typeof val === "object" && val !== null
          ? { key, ...val }
          : { key, value: val }
      );
      single = list[list.length - 1] || null;
    }

    return {
      raw: rawJson,
      extracted: extractedData,
      list,
      single,
      timestamp: Date.now(),
    };
  }

  // 3) NON-CHART WIDGETS (cards / tables) – generic behaviour

  // 3a) If it's already an array → table
  if (Array.isArray(extractedData)) {
    list = extractedData;
    single = extractedData[0] || null;
  }
  // 3b) If it's an object → card or one-row table
  else if (typeof extractedData === "object") {
    single = extractedData;
    list = [extractedData];
  }
  // 3c) Primitive value → wrap into { value }
  else {
    single = { value: extractedData };
    list = [single];
  }

  return {
    raw: rawJson,
    extracted: extractedData,
    list,
    single,
    timestamp: Date.now(),
  };
}
