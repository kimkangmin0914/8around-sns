// Bounded JSON/text redaction, not a decoder for arbitrary encodings.
export const LIMITS = Object.freeze({
  jsonDepth: 8,
  objectDepth: 32,
  stringBytes: 524288,
  variantBytes: 65536,
});
export const EXCLUDED = "[EXCLUDED_REDACTION_LIMIT]";

export function createRedactor(knownValues) {
  const variants = new Set();
  for (const secret of knownValues.filter((value) => value.length > 0)) {
    let encoded = secret;
    for (let depth = 0; depth <= LIMITS.jsonDepth; depth++) {
      if (Buffer.byteLength(encoded) > LIMITS.variantBytes)
        throw new Error(
          "A redaction value exceeds the supported encoding bound.",
        );
      variants.add(encoded);
      encoded = JSON.stringify(encoded).slice(1, -1);
    }
  }
  const ordered = [...variants].sort((a, b) => b.length - a.length);
  const stats = { redactions: 0, excluded: 0 };
  const exclude = () => {
    stats.excluded++;
    return EXCLUDED;
  };
  const replace = (text, pattern, replacement) =>
    text.replace(pattern, (...args) => {
      stats.redactions++;
      return typeof replacement === "function"
        ? replacement(...args)
        : replacement;
    });
  function sanitize(value, objectDepth = 0, jsonDepth = 0) {
    if (objectDepth > LIMITS.objectDepth) return exclude();
    if (typeof value === "string") {
      if (
        Buffer.byteLength(value) > LIMITS.stringBytes ||
        /\\{257,}/.test(value)
      )
        return exclude();
      if (jsonDepth > LIMITS.jsonDepth) return exclude();
      // Keep original formatting when complete JSON needs no redaction.
      if (/^\s*["{[]/.test(value)) {
        let decoded;
        let parsed = false;
        try {
          decoded = JSON.parse(value);
          parsed = true;
        } catch {
          /* Mixed text below. */
        }
        if (parsed && decoded !== value) {
          const before = stats.redactions + stats.excluded;
          const safe = sanitize(decoded, objectDepth + 1, jsonDepth + 1);
          return stats.redactions + stats.excluded === before
            ? value
            : JSON.stringify(safe);
        }
      }
      // JSON string literals embedded in code or otherwise non-JSON text.
      value = value.replace(/"(?:[^"\\]|\\[\s\S])*"/g, (literal) => {
        let decoded;
        try {
          decoded = JSON.parse(literal);
        } catch {
          return literal;
        }
        const before = stats.redactions + stats.excluded;
        const safe = sanitize(decoded, objectDepth + 1, jsonDepth + 1);
        return stats.redactions + stats.excluded === before
          ? literal
          : JSON.stringify(safe);
      });
      // Escaped fragments need not be complete JSON. Include standard encoding
      // forms at every supported depth, covering quotes, slashes and CR/LF.
      for (const secret of ordered) {
        if (value.includes(secret)) {
          value = value.split(secret).join("[REDACTED_ENV_VALUE]");
          stats.redactions++;
        }
      }
      value = replace(
        value,
        /((?:encryptionKey|encryption\.key)\\*"\s*:\s*\\*")[A-Za-z0-9+/=]{20,}/g,
        (_match, prefix) => `${prefix}[REDACTED_BUILD_KEY]`,
      );
      for (const pattern of [
        /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
        /\b(?:sb_secret_|sb_publishable_|sk-proj-|sk-|gh[pousr]_|github_pat_)[A-Za-z0-9_-]{16,}\b/g,
      ])
        value = replace(value, pattern, "[REDACTED_TOKEN]");
      value = replace(
        value,
        /data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+/gi,
        "[REDACTED_LOCAL_IMAGE_ATTACHMENT]",
      );
      return value;
    }
    if (Array.isArray(value))
      return value.map((item) => sanitize(item, objectDepth + 1, jsonDepth));
    if (value && typeof value === "object") {
      if (value.type === "input_image") {
        if (value.image_url !== "[REDACTED_LOCAL_IMAGE_ATTACHMENT]")
          stats.redactions++;
        return {
          type: "input_image",
          image_url: "[REDACTED_LOCAL_IMAGE_ATTACHMENT]",
        };
      }
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          sanitize(key, objectDepth + 1, jsonDepth),
          /^(?:encryptionKey|encryption\.key)$/.test(key) &&
          typeof item === "string" &&
          /^[A-Za-z0-9+/=]{20,}$/.test(item)
            ? (stats.redactions++, "[REDACTED_BUILD_KEY]")
            : sanitize(item, objectDepth + 1, jsonDepth),
        ]),
      );
    }
    return value;
  }
  return { sanitize, stats };
}
