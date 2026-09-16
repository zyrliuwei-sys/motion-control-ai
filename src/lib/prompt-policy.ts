/**
 * Fast, high-confidence prompt checks shared by the browser and server.
 *
 * Waffo remains the authoritative semantic review, but a small local guard
 * makes sure clearly explicit sexual requests are rejected before uploads,
 * billing, or a provider request. Separators are normalized so variants such
 * as "having-sex" are covered too.
 */
const restrictedPromptPatterns: RegExp[] = [
  /\b(?:sex|having\s+sex|have\s+sex)\b/iu,
  /\bsexual\s+intercourse\b/iu,
  /\b(?:explicit\s+sex|sex\s+acts?|sexual\s+acts?)\b/iu,
  /\b(?:porn|pornography|pornographic|xxx|nsfw|nude|nudity|naked|topless|erotic)\b/iu,
  /\b(?:fuck(?:ed|ing)?|masturbat(?:e|ion)|blowjob|handjob|cunnilingus|fellatio|ejaculat(?:e|ion)|orgasm|penetrat(?:e|ion)|cum|semen|orgy|threesome|gangbang|deepthroat|dildo|sex\s+toy)\b/iu,
  /(?:性交|性行为|做爱|性爱|色情|淫秽|裸照|裸体|裸露|口交|手淫|自慰|射精|高潮|插入|生殖器|阴茎|阴道|私处|乳头)/u,
  /(?:セックス|性交|ポルノ|裸|性行為)/u,
];

function normalizePrompt(prompt: string) {
  return prompt
    .normalize('NFKC')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasRestrictedPromptContent(prompt: string) {
  const normalized = normalizePrompt(prompt);
  return restrictedPromptPatterns.some((pattern) => pattern.test(normalized));
}
