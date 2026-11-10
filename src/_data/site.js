// Loads everything in content/ and computes every derived value.
// Templates only render what this file returns.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";

const CONTENT = "content";
const LESSON_MINUTES = 50;
const warnings = [];
const warn = (msg) => warnings.push(msg);

const read = (file) => matter(fs.readFileSync(file, "utf8"));
const list = (dir, ext = ".md") =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort() : [];
const isoDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d ? String(d) : "");

// "25 min" -> 25. Placeholders and blanks -> null.
function minutes(time) {
  const m = /(\d+)/.exec(String(time ?? ""));
  return m && !String(time).trim().startsWith("[") ? Number(m[1]) : null;
}

// [6] -> "Year 6", [5, 6] -> "Years 5 and 6", [34] -> "Year 3/4".
function yearLabel(levels = []) {
  const names = levels.map((l) => (String(l) === "34" ? "3/4" : String(l)));
  if (names.length === 0) return "";
  if (names.length === 1) return `Year ${names[0]}`;
  return `Years ${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

// Order for sorting cards: Year 1 first, Year 6 last.
const levelOrder = (levels = []) => Math.min(...levels.map((l) => (String(l) === "34" ? 3.5 : Number(l))));

// ---- Classes -------------------------------------------------------------
const classes = yaml.load(fs.readFileSync(path.join(CONTENT, "classes.yml"), "utf8"));

// ---- Terms ---------------------------------------------------------------
const terms = list(path.join(CONTENT, "terms")).map((file) => {
  const { data, content } = read(path.join(CONTENT, "terms", file));
  return { id: file.replace(/\.md$/, ""), ...data, starts: isoDate(data.starts), notes: content.trim() };
});
const currentTerm = terms.at(-1) || null;

// ---- Mini lessons --------------------------------------------------------
const minis = {};
for (const file of list(path.join(CONTENT, "minis"))) {
  const slug = file.replace(/\.md$/, "");
  const { data, content } = read(path.join(CONTENT, "minis", file));
  minis[slug] = {
    slug,
    url: `/minis/${slug}/`,
    title: data.title || slug,
    kind: data.kind || "",
    summary: data.summary || "",
    yearLabel: yearLabel(data.year_levels),
    curriculum: data.curriculum || [],
    vocab: data.vocab || [],
    resources: data.resources || [],
    body: content.trim(),
    usedIn: [],
  };
}

// ---- Reflections ---------------------------------------------------------
// "## 2026-11-11 · Lesson 2 · 6A" then the note.
function readReflections(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  return text
    .split(/^## /m)
    .slice(1)
    .map((chunk) => {
      const [heading, ...rest] = chunk.split("\n");
      const parts = heading.split("·").map((s) => s.trim());
      const lesson = /^Lesson (\d+)$/.exec(parts[1] || "");
      return {
        date: parts[0] || "",
        lesson: lesson ? Number(lesson[1]) : null,
        scope: parts[1] || "",
        class: parts[2] || "",
        note: rest.join("\n").trim(),
      };
    })
    .filter((r) => r.note)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---- Units and lessons ---------------------------------------------------
const units = [];
const lessons = [];
const unitsDir = path.join(CONTENT, "units");
for (const slug of fs.existsSync(unitsDir) ? fs.readdirSync(unitsDir).sort() : []) {
  const dir = path.join(unitsDir, slug);
  if (!fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, "unit.md"))) continue;
  const { data, content } = read(path.join(dir, "unit.md"));
  const unit = {
    slug,
    url: `/units/${slug}/`,
    title: data.title || slug,
    yearLevels: data.year_levels || [],
    yearLabel: yearLabel(data.year_levels),
    order: levelOrder(data.year_levels),
    year: data.year,
    term: data.term,
    termId: `${data.year}-t${data.term}`,
    startWeek: data.start_week || 1,
    lessonCount: data.lesson_count || 10,
    focus: data.focus || "",
    blurb: data.blurb || "",
    lisc: data.lisc || null,
    curriculum: data.curriculum || [],
    links: data.links || [],
    status: data.status || "planned",
    body: content.trim(),
    reflections: readReflections(path.join(dir, "reflections.md")),
    lessons: [],
  };
  if (!data.year_levels) warn(`${slug}: unit.md has no year_levels`);

  for (const file of list(path.join(dir, "lessons"))) {
    const base = file.replace(/\.md$/, "");
    const { data: l, content: body } = read(path.join(dir, "lessons", file));
    const number = l.number ?? Number(base.slice(0, 2));
    const parts = (l.minis || []).map((p) => {
      const mini = minis[p.mini];
      if (!mini) warn(`${slug}/${file}: unknown mini lesson "${p.mini}" (no content/minis/${p.mini}.md)`);
      return { ...p, minutes: minutes(p.time), info: mini || { slug: p.mini, title: p.mini, url: null, resources: [], curriculum: [], vocab: [] } };
    });
    const known = parts.map((p) => p.minutes).filter((m) => m != null);
    const total = known.reduce((a, b) => a + b, 0);
    if (total > LESSON_MINUTES) warn(`${slug}/${file}: mini lessons add up to ${total} minutes (more than ${LESSON_MINUTES})`);
    const lesson = {
      unit,
      number,
      base,
      url: `${unit.url}${base}/`,
      title: l.title || base,
      summary: l.summary || "",
      status: l.status || "planned",
      week: unit.startWeek + number - 1,
      lisc: l.lisc || null,
      parts,
      totalMinutes: known.length === parts.length && parts.length ? total : null,
      knownMinutes: total,
      resources: l.resources || [],
      curriculum: [...new Set([...(l.curriculum || []), ...parts.flatMap((p) => p.info.curriculum)])],
      vocab: [...new Set(parts.flatMap((p) => p.info.vocab))],
      body: body.trim(),
      reflections: unit.reflections.filter((r) => r.lesson === number),
    };
    for (const p of parts) if (minis[p.mini]) minis[p.mini].usedIn.push({ lesson, time: p.time, thisWeek: p.this_week });
    unit.lessons.push(lesson);
    lessons.push(lesson);
  }
  unit.lessons.sort((a, b) => a.number - b.number);

  // Lesson slots 1 to lessonCount: planned, draft or not yet written.
  const byNumber = Object.fromEntries(unit.lessons.map((l) => [l.number, l]));
  unit.slots = Array.from({ length: unit.lessonCount }, (_, i) => {
    const n = i + 1;
    const lesson = byNumber[n] || null;
    return { number: n, week: unit.startWeek + i, lesson, state: lesson ? (lesson.status === "draft" ? "draft" : "planned") : "empty" };
  });
  unit.plannedCount = unit.slots.filter((s) => s.state === "planned").length;
  const next = unit.slots.find((s) => s.state !== "planned");
  unit.nextToPlan = next ? next.number : null;
  for (const s of unit.slots) if (s.number === unit.nextToPlan) s.next = true;

  // Mini lessons by lesson, for the unit grid.
  const used = [];
  for (const l of unit.lessons) for (const p of l.parts) if (!used.find((u) => u.slug === p.info.slug)) used.push(p.info);
  unit.miniGrid = used.map((info) => ({
    info,
    cells: unit.slots.map((s) => {
      const part = s.lesson && s.lesson.parts.find((p) => p.info.slug === info.slug);
      return part ? { time: part.time, thisWeek: part.this_week } : null;
    }),
  }));
  units.push(unit);
}

units.sort((a, b) => (a.termId === b.termId ? a.order - b.order : a.termId < b.termId ? 1 : -1));
for (const m of Object.values(minis)) m.usedIn.sort((a, b) => (a.lesson.unit.termId + a.lesson.number < b.lesson.unit.termId + b.lesson.number ? 1 : -1));

const currentUnits = currentTerm
  ? units.filter((u) => u.termId === currentTerm.id && u.status !== "draft").sort((a, b) => a.order - b.order)
  : [];

// Year level groups with no unit this term still get a card.
const covered = new Set(currentUnits.flatMap((u) => u.yearLevels.map(String)));
const emptyGroups = classes.groups.filter((g) => !g.year_levels.some((l) => covered.has(String(l))));
// Overview cards in year order: a unit, or a group still waiting for one.
const overviewCards = [
  ...currentUnits.map((unit) => ({ unit, order: unit.order })),
  ...emptyGroups.map((group) => ({ group, order: levelOrder(group.year_levels) })),
].sort((a, b) => a.order - b.order);

for (const w of warnings) console.warn(`[music-hub] ${w}`);

export default {
  lessonMinutes: LESSON_MINUTES,
  classes,
  terms,
  currentTerm,
  currentUnits,
  emptyGroups,
  overviewCards,
  units,
  lessons,
  minis: Object.values(minis).sort((a, b) => a.title.localeCompare(b.title)),
  latestReflections: currentUnits
    .flatMap((u) => u.reflections.map((r) => ({ ...r, unit: u })))
    .filter((r) => !r.note.startsWith("["))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5),
  warnings,
};
