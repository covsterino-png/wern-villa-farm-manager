// ISO 11784/11785 livestock EID helpers.
// Scanners report the tag as 12 hex chars (48 bits): 10-bit country code + 38-bit individual number.
// That same tag is also written as a 15-digit decimal ISO number (3-digit country code + 12-digit individual number).

export function cleanHexEid(value) {
  return String(value || "").replace(/[^0-9a-fA-F]/g, "").toUpperCase();
}

export function cleanIsoEid(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isHexEid(value) {
  return cleanHexEid(value).length === 12;
}

export function isIsoEid(value) {
  return cleanIsoEid(value).length === 15;
}

export function hexToIso(hex) {
  const clean = cleanHexEid(hex);
  if (clean.length !== 12) return null;
  const bits = BigInt(`0x${clean}`).toString(2).padStart(48, "0");
  const country = parseInt(bits.slice(0, 10), 2);
  const national = BigInt(`0b${bits.slice(10)}`);
  return `${String(country).padStart(3, "0")}${national.toString().padStart(12, "0")}`;
}

export function isoToHex(iso) {
  const digits = cleanIsoEid(iso);
  if (digits.length !== 15) return null;
  const country = BigInt(digits.slice(0, 3));
  const national = BigInt(digits.slice(3));
  const bits = country.toString(2).padStart(10, "0") + national.toString(2).padStart(38, "0");
  return BigInt(`0b${bits}`).toString(16).padStart(12, "0").toUpperCase();
}

// Given an EID in either hex or ISO decimal format, return both representations.
export function getEidFormats(value) {
  if (isHexEid(value)) {
    const hex = cleanHexEid(value);
    return { hex, iso: hexToIso(hex) };
  }
  if (isIsoEid(value)) {
    const iso = cleanIsoEid(value);
    return { hex: isoToHex(iso), iso };
  }
  return { hex: null, iso: null };
}

// UK sheep EID national ID (12 digits after the country code) is issued as a
// 6-digit flock mark followed by a 6-digit individual animal number.
export function getEidBreakdown(value) {
  const { hex, iso } = getEidFormats(value);
  if (!hex || !iso) {
    return { hex: null, iso: null, countryCode: null, flockMark: null, individualNumber: null };
  }
  const national = iso.slice(3);
  return {
    hex,
    iso,
    countryCode: iso.slice(0, 3),
    flockMark: national.slice(0, 6),
    individualNumber: national.slice(6),
  };
}

