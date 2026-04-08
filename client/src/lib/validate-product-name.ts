const VOWELS = new Set("aeiouAEIOUyY");

function vowelRatio(word: string): number {
  if (!word.length) return 0;
  const letters = word.replace(/[^a-zA-Z]/g, "");
  if (!letters.length) return 0;
  const vowelCount = [...letters].filter((c) => VOWELS.has(c)).length;
  return vowelCount / letters.length;
}

function maxConsonantRun(word: string): number {
  const letters = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
  let max = 0;
  let run = 0;
  for (const ch of letters) {
    if (!VOWELS.has(ch)) {
      run++;
      if (run > max) max = run;
    } else {
      run = 0;
    }
  }
  return max;
}

function hasEnoughCommonBigrams(word: string): boolean {
  const COMMON_BIGRAMS = new Set([
    "an","ar","at","ch","cl","cr","de","dr","ea","ed","en","er","es","fl",
    "fr","gh","gl","gr","ha","he","hi","ho","in","it","le","li","ll","lo",
    "me","mo","nd","ne","ng","ni","no","nt","of","on","or","pl","pr","re",
    "sh","sl","sm","sn","sp","st","te","th","ti","to","tr","un","ur","wa",
    "wh","wi","sh","ck","qu","ph","wn","ow","ew","aw","oa","ai","ee","ou",
    "io","ia","oo","ss","ff","ll","mm","nn","pp","rr","tt","bb","cc","dd",
    "gg","zz","ac","ad","ag","al","am","ap","as","av","aw","ax","ay","az",
    "ba","be","bi","bo","br","bu","by","ca","ce","ci","co","cu","cy","da",
    "di","do","du","dy","ec","ef","eg","ej","ek","el","em","eu","ev","ew",
    "ey","ez","fa","fe","fi","fo","fu","ga","ge","gi","go","gu","gy","hi",
    "hu","hy","ic","id","if","ig","ij","ik","il","im","ip","ir","is","iu",
    "iv","iw","ix","iy","iz","ja","je","ji","jo","ju","ka","ke","ki","ko",
    "ku","la","lb","ld","lf","lg","lk","lm","lp","ls","lt","lu","lv","lw",
    "ly","ma","mb","mc","md","mf","mg","mk","ml","mp","ms","mt","mu","mv",
    "mw","my","na","nb","nc","nf","nk","nl","nm","np","ns","nt","nu","nv",
    "nw","ny","ob","oc","od","of","og","oj","ok","ol","om","op","oq","os",
    "ot","ov","ow","ox","oy","oz","pa","pb","pc","pd","pe","pg","pi","pk",
    "pm","pn","po","ps","pt","pu","py","qu","ra","rb","rc","rd","rf","rg",
    "rk","rl","rm","rn","rp","rs","rt","ru","rv","rw","ry","sa","sb","sc",
    "sd","se","sf","sg","si","sk","sl","so","sq","sr","ss","su","sv","sw",
    "sy","ta","tb","tc","td","tf","tg","ti","tk","tl","tm","tn","to","tp",
    "ts","tt","tu","tv","tw","ty","ua","ub","uc","ud","ue","uf","ug","ui",
    "uk","ul","um","up","uq","ur","us","ut","uu","uv","uw","ux","uy","uz",
    "va","ve","vi","vo","vu","vy","wa","we","wi","wo","wu","wy","xe","xi",
    "ya","ye","yi","yo","yu","za","ze","zi","zo","zu"
  ]);

  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 2) return false;
  let matches = 0;
  for (let i = 0; i < w.length - 1; i++) {
    if (COMMON_BIGRAMS.has(w[i] + w[i + 1])) matches++;
  }
  return matches / (w.length - 1) >= 0.3;
}

function trailingConsonantRun(word: string): number {
  const letters = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
  let run = 0;
  for (let i = letters.length - 1; i >= 0; i--) {
    if (!VOWELS.has(letters[i])) run++;
    else break;
  }
  return run;
}

function looksLikeGibberish(word: string): boolean {
  const clean = word.replace(/[^a-zA-Z]/g, "");
  if (clean.length < 2) return false;
  if (vowelRatio(clean) < 0.15) return true;
  if (maxConsonantRun(clean) > 4) return true;
  if (clean.length >= 5 && !hasEnoughCommonBigrams(clean)) return true;
  // Short words (≤5) ending in 3+ consonants with low vowel ratio = keyboard mash
  if (clean.length <= 5 && trailingConsonantRun(clean) >= 3 && vowelRatio(clean) < 0.35) return true;
  return false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProductName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: "Please enter a product name." };
  }

  if (trimmed.length < 3) {
    return {
      valid: false,
      error:
        "We could not identify this product name. Please enter a valid product such as: Face Wash, Glass Cleaner, Car Shampoo.",
    };
  }

  // Split into words; ignore numbers, punctuation-only tokens
  const words = trimmed
    .split(/[\s\-\/]+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter((w) => w.length >= 2);

  if (words.length === 0) {
    return {
      valid: false,
      error:
        "We could not identify this product name. Please enter a valid product such as: Face Wash, Glass Cleaner, Car Shampoo.",
    };
  }

  const gibberishWords = words.filter(looksLikeGibberish);

  if (gibberishWords.length > 0 && gibberishWords.length >= Math.ceil(words.length / 2)) {
    return {
      valid: false,
      error:
        "We could not identify this product name. Please enter a valid product such as: Face Wash, Glass Cleaner, Car Shampoo.",
    };
  }

  return { valid: true };
}
