// Top common English bigrams (Peter Norvig corpus + product-name extensions)
const COMMON_BIGRAMS = new Set([
  // Very high frequency
  "th","he","in","er","an","re","on","at","en","nd","ti","es","or","te","of",
  "ed","is","it","al","ar","st","to","nt","ng","se","ha","as","ou","io","le",
  "ve","co","me","de","hi","ri","ro","ic","ne","ea","ra","ce","li","ch","ll",
  "be","ma","si","om","ur","sh","wh","ph","ck","gh","qu","oo","ee","ai","oa",
  "ow","ew","ay","ly","ry","ny","ty","gy","sp","pr","tr","cl","cr","fl","fr",
  "gl","gr","bl","br","pl","sc","sl","sm","sn","sw","dr",
  // Additional common pairs
  "ca","la","fa","wa","sa","ba","pa","na","ta","da","ga","ja","ka","ra","ha",
  "lo","bo","so","go","ho","no","do","fo","mo","po","wo","yo","to","ro","co",
  "lu","bu","su","gu","hu","nu","du","fu","mu","pu","ru","tu","zu","cu","ju",
  "di","bi","fi","gi","ni","pi","qi","ri","si","vi","wi","xi","yi","zi","ki",
  "uc","ac","ec","ic","oc","el","il","ol","ul","em","im","am","um","ep","ap",
  "op","up","et","ot","ut","ev","av","iv","ov","ex","ax","ix","ey","oy","uy",
  "ab","ob","ub","eb","ad","od","ud","af","ef","if","of","uf","ag","eg","og",
  "ug","ah","eh","oh","uh","aj","oj","uj","ak","ek","ik","ok","uk","al","ol",
  "ul","an","on","un","aw","ew","iw","ow","uw","az","ez","iz","oz","uz","ns",
  "ls","rs","ts","ps","ld","nd","rd","sd","lt","nt","rt","ct","ft","gt","ht",
  "lm","rm","sm","mp","sp","rp","lp","tp","nc","lc","rc","tc","nk","lk","sk",
  "ss","ll","tt","mm","nn","pp","rr","dd","ff","bb","cc","gg","zz","ee","oo",
]);

function vowelRatio(word: string): number {
  const letters = word.replace(/[^a-zA-Z]/g, "");
  if (!letters.length) return 0;
  const vowels = new Set("aeiouyAEIOUY");
  return [...letters].filter((c) => vowels.has(c)).length / letters.length;
}

function maxConsonantRun(word: string): number {
  const vowels = new Set("aeiouyAEIOUY");
  const letters = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
  let max = 0, run = 0;
  for (const ch of letters) {
    if (!vowels.has(ch)) { run++; if (run > max) max = run; }
    else run = 0;
  }
  return max;
}

function hasAbnormalDoubleVowel(word: string): boolean {
  // "aa", "ii", "uu" almost never appear in real product words
  return /aa|ii|uu/i.test(word.replace(/[^a-zA-Z]/g, ""));
}

function commonBigramRate(word: string): number {
  const w = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (w.length < 2) return 1;
  let matches = 0;
  for (let i = 0; i < w.length - 1; i++) {
    if (COMMON_BIGRAMS.has(w[i] + w[i + 1])) matches++;
  }
  return matches / (w.length - 1);
}

function looksLikeGibberish(word: string): boolean {
  const clean = word.replace(/[^a-zA-Z]/g, "");
  if (clean.length < 2) return false;

  // No/very few vowels
  if (vowelRatio(clean) < 0.15) return true;

  // More than 4 consecutive consonants
  if (maxConsonantRun(clean) > 4) return true;

  // Repeated unusual vowels (aa, ii, uu) almost never real
  if (hasAbnormalDoubleVowel(clean)) return true;

  // For words 4+ chars: bigram match rate must exceed 35%
  if (clean.length >= 4 && commonBigramRate(clean) < 0.35) return true;

  return false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ERROR_MSG =
  "We could not identify this product name. Please enter a valid product such as: Face Wash, Glass Cleaner, Car Shampoo.";

export function validateProductName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: "Please enter a product name." };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: ERROR_MSG };
  }

  const words = trimmed
    .split(/[\s\-\/]+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter((w) => w.length >= 2);

  if (words.length === 0) {
    return { valid: false, error: ERROR_MSG };
  }

  const gibberishWords = words.filter(looksLikeGibberish);

  // Block if the majority of words look like gibberish
  if (gibberishWords.length > 0 && gibberishWords.length >= Math.ceil(words.length / 2)) {
    return { valid: false, error: ERROR_MSG };
  }

  return { valid: true };
}
