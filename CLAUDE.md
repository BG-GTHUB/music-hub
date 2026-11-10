# FCPS Music Hub

A personal planning hub for Bill, the music teacher at Footscray City Primary School (Melbourne). Bill teaches music to every class from Year 1 to Year 6, one 50-minute lesson per class per week. Only Bill uses the site. There are no logins and no other users.

The model for structure and approach (not content) is James Jardine's STEAM hub: https://github.com/jamesjardine2/steam-hub (read its CLAUDE.md for background). Music lessons work differently from STEAM lessons, so the content model below is our own.

## What the hub does

1. **Overview** (`/`): one card per year level group for the current term: unit, focus, lessons planned.
2. **Unit, lesson and mini lesson pages** for Bill: Learning Intention and Success Criteria, curriculum codes, sequence, resources, reflections.
3. **Projector pages** (later): student-facing slides, listening tasks, vocabulary, following VTLM 2.0.
4. **Archive** (later): past units with search, since units come back in a cycle.

## Hard rules

- **Privacy.** The site is public. Never include student names, photos, videos, recordings, assessment data, or student-written work (for example parody lyrics). Naming a class (6A) is fine; naming a student is not.
- **Copyright.** Never copy the lyrics of published songs into the repo. Link to them (YouTube, publisher) instead. Lyrics written at the school (with Bill's OK) can go in.
- **Do not invent lesson content.** Unknown details are clearly marked placeholders in square brackets, for example `[YouTube link to add]`. Anything Claude drafts for Bill to check (such as a suggested LISC) is marked `[Draft: ...]` until Bill approves it.
- **VTLM 2.0** for anything students see: one idea per slide, few words, no clutter.
- Australian English (practise as a verb, program, colour).
- Ask Bill before big structural decisions.

## Classes and year level groups (2026)

| Group id | Label | Classes |
|---|---|---|
| `y1` | Year 1 | 1A, 1B |
| `y2` | Year 2 | 2A, 2B, 2C |
| `y34` | Year 3/4 | 34A to 34E [names to confirm] |
| `y5` | Year 5 | 5A, 5B, 5C |
| `y6` | Year 6 | 6A, 6B |

Stored in `content/classes.yml`. Classes are named alphabetically. Year 3/4 classes are composite and always share a unit.

## Decisions (agreed November 2026)

- **Stack (same as James):** Eleventy static site, content as Markdown files, GitHub Pages, deployed by GitHub Actions on every push. Bill edits files on the GitHub website, so nothing should need to run on his Mac.
- **Lessons are 50 minutes,** one per class per week. Terms are 10 weeks.
- **Units say which year levels they are for** with `year_levels`. Year 5 and Year 6 often share a unit (`year_levels: [5, 6]`) and sometimes do not. The Overview shows one card per unit in the current term, labelled with its year levels ("Year 6", "Years 5 and 6"), so a shared unit is one card and one set of lesson files.
- **Mini lessons are the building blocks.** A 50-minute lesson is made of 3 or 4 mini lessons (Years 1 and 2) or 2 or 3 (Years 3 to 6). Some mini lessons carry on week after week (rehearsing a song), others change. Each mini lesson is its own file in a shared library, `content/minis/`, so it can be reused in any lesson, unit or year. A lesson lists the mini lessons it uses, with the time and what happens this week.
- **One LISC per lesson, optional.** Bill has not written LISC in the past; a lesson without one simply leaves the section out.
- **Mini lessons that build vocabulary.** Bill wants a music terms or vocab game (or class expectations) tied to the unit's activity in place of a generic warm-up.
- **Curriculum codes** are Victorian Curriculum 2.0, The Arts: Music, written in full so they link to `https://f10.vcaa.vic.edu.au/learning-areas/the-arts/music/curriculum#CODE`. Checked on the VCAA site on 2026-11-11: each band has four codes, one per strand, ending E01 (Exploring), D01 (Developing practices), C01 (Creating), P01 (Presenting). Levels 1 and 2 use `VC2AMU2..`, 3 and 4 `VC2AMU4..`, 5 and 6 `VC2AMU6..`.

## Content model

```
content/
  classes.yml                       # year level groups and their classes
  terms/
    2026-t4.md                      # one file per term; newest is the current term
  minis/                            # shared library of mini lessons
    goodbye-footscray-city.md       # {short-name}.md
  units/
    2026-t4-y6-farewell/            # {year}-t{term}-{group}-{short-name}
      unit.md
      reflections.md
      lessons/
        01-choosing-our-songs.md    # {two-digit number}-{short-name}.md
```

### unit.md

```yaml
title: Farewell Songs
year_levels: [6]          # one or more of 1, 2, 34, 5, 6
year: 2026
term: 4
start_week: 5             # term week of Lesson 1
lesson_count: 6           # lessons planned for this unit
focus: Short phrase for the Overview card
blurb: One or two sentences for the Overview card.
lisc:                     # optional, unit level
  intention: To ...
  criteria: [ ... ]
curriculum: [VC2AMU6C01, VC2AMU6P01]
links:                    # optional
  - label: ...
    url: ...
```

Body: a short description for the unit page.

### Lesson files

```yaml
number: 2
title: Polishing our parodies
summary: One line for the unit's lesson list.
status: planned           # planned (default) or draft
lisc:                     # optional
  intention: To ...
  criteria: [ ... ]
minis:                    # the parts of this lesson, in order
  - mini: farewell-parody # file name in content/minis/ without .md
    time: 25 min
    this_week: What happens in this mini lesson this week.
resources: [ ... ]        # optional, on top of each mini lesson's own resources
```

Body: notes for the whole lesson (optional).

### Mini lesson files (`content/minis/`)

```yaml
title: Farewell parody
kind: create              # song, game, listening, create, perform, routine
year_levels: [6]
summary: One line.
curriculum: [VC2AMU6C01]
vocab: [parody, lyrics]   # music words this mini lesson teaches
resources:
  - label: ...
    url: ...              # YouTube, Google Drive, PDF in the repo
```

Body: how to run it (steps, tips). The site shows, for each mini lesson, every lesson that uses it.

### reflections.md

Each entry is a level-2 heading, then the note:

```
## 2026-11-11 · Lesson 2 · 6A
Note about the class or the lesson. Never name a student.
```

## How the site works

- **Generator:** Eleventy 3 with Nunjucks. Dependencies: `@11ty/eleventy`, `gray-matter`, `js-yaml`, `markdown-it`. All content is loaded and every derived value is computed in one place, `src/_data/site.js`; templates only render.
- **Hosting:** repo `BG-GTHUB/music-hub` (public), site at https://bg-gthub.github.io/music-hub/. Pages source is GitHub Actions (set up 2026-11-11). Commits use the GitHub noreply email (set in this repo's git config), never Bill's personal email.
- **Path prefix** is `/music-hub/` to match the repo name (`pathPrefix` in `eleventy.config.js`). The HTML base plugin rewrites links, so templates write links as `/units/...`.
- **Pages:** `/` Overview, `/units/` all units, `/units/<unit>/` unit, `/units/<unit>/<lesson file name>/` lesson, `/minis/` mini lesson library, `/minis/<slug>/` mini lesson.
- **Overview** shows one card per year level group in Year 1 to Year 6 order: the current term's unit if there is one (one card per unit, so a shared Years 5 and 6 unit is one card), otherwise a dashed "[Unit to add]" card listing the classes. Draft units stay off the Overview.
- **Current term** is the newest file in `content/terms/`. Its `starts` date (Monday of Week 1) lets the browser work out this week: the Overview shows "Week N" and the unit page highlights the lesson for this week. Add the term file when a new term starts.
- **Lesson week** is `start_week + number - 1`.
- **Dots:** planned is teal, next to plan (lowest lesson number not planned) is amber, not written is grey, this week has a ring.
- **Lesson times:** each mini lesson's `time` is added up and shown against 50 minutes. The build warns if a lesson goes over 50, or if a lesson names a mini lesson that has no file.
- **Placeholders:** any text that starts with `[` is shown highlighted in amber.
- **Light and dark mode:** `src/assets/tokens.css` holds every colour; the site follows the device and the top-bar button overrides it (saved in the browser). The current colours are a placeholder until Bill picks a design.
- **Privacy:** every page has `noindex` and `robots.txt` disallows everything, but treat everything as public anyway.

## Commands

Bill's Mac has no Node; Deno runs Eleventy instead. GitHub Actions uses Node 22 and `npm install`.

```bash
deno install                                                    # once
deno run -A node_modules/@11ty/eleventy/cmd.cjs --serve --port=8080  # preview at http://localhost:8080/music-hub/
deno run -A node_modules/@11ty/eleventy/cmd.cjs                 # build into _site/
```

## Layout of the repo

```
CLAUDE.md
eleventy.config.js         # Eleventy setup, path prefix, filters, copies unit files
lib/vc2.js                 # links curriculum codes to the VCAA site, labels strand and band
src/_data/site.js          # loads content/, computes everything
src/_includes/base.njk     # page layout and top bar
src/_includes/macros.njk   # LISC, curriculum chips, resources, dots, reflections
src/index.njk              # Overview
src/units.njk, unit.njk, lesson.njk, minis.njk, mini.njk
src/assets/                # tokens.css, site.css, theme.js, site.js
.github/workflows/deploy.yml  # builds and publishes to GitHub Pages on every push to main
content/                   # all teaching content
```

## Still to decide

- Design (colours, font, light or dark default) and the site's name and GitHub repo name.
- What projector pages need (vocab game, lyrics, notation, timer).
- Units cycle length (yearly or two-yearly) for the Archive.

## Phases

1. **Phase 1 (current):** content model and Year 6 Farewell unit (done, with placeholders), site skeleton (done, November 2026), then GitHub and GitHub Pages (next).
2. Fill out Term 4 2026 and plan Term 1 2027.
3. Projector pages.
4. Archive with search.
