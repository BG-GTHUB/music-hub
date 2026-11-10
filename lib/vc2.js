// Links Victorian Curriculum 2.0 codes (VC2AMU6P01, ...) to the VCAA site.
// The Music curriculum page scrolls to a code given after "#".
// Codes from other learning areas go to the VCAA search. Checked 2026-11-11.
const SITE = "https://f10.vcaa.vic.edu.au";
const AREAS = [
  ["VC2AMU", "the-arts/music", "Music"],
  ["VC2ADA", "the-arts/dance", "Dance"],
  ["VC2ADR", "the-arts/drama", "Drama"],
  ["VC2AMA", "the-arts/media-arts", "Media Arts"],
  ["VC2AVA", "the-arts/visual-arts", "Visual Arts"],
  ["VC2EAL", "english/english-as-an-additional-language", "EAL"],
  ["VC2E", "english/english", "English"],
  ["VC2M", "mathematics", "Mathematics"],
  ["VC2HP", "health-and-physical-education", "Health and PE"],
];

const STRANDS = { E: "Exploring", D: "Developing practices", C: "Creating", P: "Presenting" };

export function vc2Url(code) {
  const area = AREAS.find(([prefix]) => code.startsWith(prefix));
  return area
    ? `${SITE}/learning-areas/${area[1]}/curriculum#${code}`
    : `${SITE}/search?keys=${encodeURIComponent(code)}`;
}

// "Presenting, Levels 5 and 6" for a Music code; "" for anything else.
export function vc2Label(code) {
  const m = /^VC2AMU(F|2|4|6|8|10)([EDCP])\d+$/.exec(code);
  if (!m) {
    const area = AREAS.find(([prefix]) => code.startsWith(prefix));
    return area ? area[2] : "";
  }
  const band = { F: "Foundation", 2: "Levels 1 and 2", 4: "Levels 3 and 4", 6: "Levels 5 and 6", 8: "Levels 7 and 8", 10: "Levels 9 and 10" }[m[1]];
  return `${STRANDS[m[2]]}, ${band}`;
}
