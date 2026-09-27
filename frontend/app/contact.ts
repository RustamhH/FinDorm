// Əlaqə məlumatları — burada dəyiş, sayt avtomatik yenilənir.
export const CONTACT = {
  email: "finddorm@gmail.com",
  phone: "051-394-08-59",
};

/** 051-394-08-59 -> +994513940859 */
export const toTel = (phone: string) => "+994" + phone.replace(/\D/g, "").replace(/^0/, "");

const PREFIXES = ["50", "51", "55", "10", "70", "77"];
export const BROKER_PHONE_REGEX = /^\+994(50|51|55|10|70|77)[1-9]\d{6}$/;

/** Small seeded PRNG, so a listing always gets the same number. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Demo broker number for a listing: "+994XXXXXXXXX" (operator prefix 50/51/55/10/70/77). */
export function brokerPhone(listingId: number): string {
  const rnd = mulberry32(listingId * 2654435761);
  const prefix = PREFIXES[Math.floor(rnd() * PREFIXES.length)];
  const rest = String(1 + Math.floor(rnd() * 9)) + Array.from({ length: 6 }, () => Math.floor(rnd() * 10)).join("");
  return `+994${prefix}${rest}`;
}

/** +994501234567 -> +994 50 123 45 67 */
export const formatPhone = (tel: string) => tel.replace(/^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/, "+994 $1 $2 $3 $4");
