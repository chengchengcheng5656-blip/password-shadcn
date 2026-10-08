export type PasswordOptions = {
  length: number;
  lower: boolean;
  upper: boolean;
  numbers: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
};

const AMBIGUOUS = new Set(["0", "O", "o", "1", "l", "I", "|"]);

const POOLS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}:;,.?",
} as const;

function filterAmbiguous(pool: string, avoidAmbiguous: boolean) {
  if (!avoidAmbiguous) return pool;
  return [...pool].filter((char) => !AMBIGUOUS.has(char)).join("");
}

export function getPools(options: PasswordOptions) {
  const pools: string[] = [];
  if (options.lower) pools.push(filterAmbiguous(POOLS.lower, options.avoidAmbiguous));
  if (options.upper) pools.push(filterAmbiguous(POOLS.upper, options.avoidAmbiguous));
  if (options.numbers) pools.push(filterAmbiguous(POOLS.numbers, options.avoidAmbiguous));
  if (options.symbols) pools.push(filterAmbiguous(POOLS.symbols, options.avoidAmbiguous));
  return pools.filter((pool) => pool.length > 0);
}

function randomIndex(size: number) {
  const limit = Math.floor(0x100000000 / size) * size;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % size;
}

function pick(pool: string) {
  return pool[randomIndex(pool.length)];
}

function shuffle(chars: string[]) {
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }
  return chars;
}

export function createPassword(options: PasswordOptions) {
  const pools = getPools(options);
  if (pools.length === 0) return "";

  const alphabet = pools.join("");
  const chars: string[] = [];

  for (const pool of pools) {
    if (chars.length >= options.length) break;
    chars.push(pick(pool));
  }

  while (chars.length < options.length) {
    chars.push(pick(alphabet));
  }

  return shuffle(chars).join("");
}

export function getEntropyBits(options: PasswordOptions) {
  const alphabetSize = new Set(getPools(options).join("")).size;
  if (alphabetSize === 0) return 0;
  return Math.round(options.length * Math.log2(alphabetSize));
}

export function getStrength(bits: number) {
  if (bits <= 0) {
    return { label: "无法生成", tone: "bg-muted", width: 0 };
  }
  if (bits < 36) {
    return { label: "弱", tone: "bg-destructive", width: 25 };
  }
  if (bits < 60) {
    return { label: "中等", tone: "bg-amber-500", width: 50 };
  }
  if (bits < 80) {
    return { label: "强", tone: "bg-lime-500", width: 75 };
  }
  return { label: "极强", tone: "bg-emerald-500", width: 100 };
}
