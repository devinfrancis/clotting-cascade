// Fuzzy matching for typed answers and search: "Xa", "FXa", "factor 10a" all count.
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13 };

export function normalize(s) {
  let t = String(s).toLowerCase().normalize('NFKD');
  t = t.replace(/α/g, 'a').replace(/β/g, 'b').replace(/µ/g, 'u');
  t = t.replace(/glycoprotein/g, 'gp');
  // "factor X" / "f x a" / "FXa" -> "f10a"
  t = t.replace(/\b(?:factor|f)\s*-?\s*([ivx]+)(a?)\b/g, (m, r, a) => (ROMAN[r] ? `f${ROMAN[r]}${a}` : m));
  t = t.replace(/\bfactor\s*(\d+)(a?)\b/g, 'f$1$2');
  // A bare roman numeral with optional "a": "Xa" -> "f10a"
  t = t.replace(/^([ivx]+)(a?)$/, (m, r, a) => (ROMAN[r] ? `f${ROMAN[r]}${a}` : m));
  return t.replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

// Exact after normalization, or one typo for answers of 6+ characters
// (short answers like "cox1" vs "cox2" must match exactly).
export function matches(input, accepted) {
  const n = normalize(input);
  if (!n) return false;
  return accepted.some((a) => {
    const m = normalize(a);
    return n === m || (m.length >= 6 && levenshtein(n, m) <= 1);
  });
}
