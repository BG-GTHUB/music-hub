# Chord Classroom Player

Puts chords and lyrics on the classroom screen and plays along with a backing track. Bill started it in ChatGPT and carried on with Claude in a Chat tab conversation ("Lyrics-to-audio sync tool"). These notes come from that chat's handover.

- `chord-converter.html`: the whole player in one file (HTML, CSS, JavaScript, no libraries, no network requests). The site publishes it at https://bg-gthub.github.io/music-hub/tools/chord-classroom/. It also works by double-clicking the file.
- `ios/ContentView.swift`: a SwiftUI wrapper that shows the same HTML in a `WKWebView`, so it runs as an iPad or iPhone app built in Xcode.

## Privacy and copyright

Songs, audio and lyric sync are saved only in the browser (or the app) on the device that saved them. Nothing is uploaded, so pasting a published song's chords is fine. Never commit a published song's lyrics or a commercial recording to this repo.

## Test status

- Chord detection, transposing and line grouping were tested in Node with sample songs. The script passes a syntax check.
- Not yet tried on a real device: audio, scrolling, saving (IndexedDB), tap-to-sync and the iOS build. The Swift has never been compiled.

## What it does

- **Convert:** paste an Ultimate Guitar style chord sheet (chord lines above lyric lines). Each chord is coloured by its root note. `[Verse]` style headings are grey.
- **Audio:** load a local audio file. Play/Pause, Restart, -10s, seek bar, time, tempo 60 to 100%.
- **Auto-scroll:** speed 40 to 160%, Start/Stop, optional "with audio" link.
- **Transpose:** +/- a semitone, Reset. Colours follow the new chord.
- **Font size** slider, **Fullscreen** (hidden where the device can't do it).
- **Saved songs:** saves the text, audio, lyric sync, key, tempo, scroll speed and font size.
- **Tap-to-sync:** play the song once and tap Space as each line starts. After that the current line is highlighted and scrolled into place, and clicking a line jumps the audio there.
- **Keys:** Space play/pause (or scroll if no audio), S scroll, Left/Right 5 seconds, F fullscreen. While syncing: Space/Enter tap, Backspace undo, Esc finish.

## Decisions

- **Colours:** C red, D orange, E yellow, F green, G teal, A purple, B magenta, from the original version. A was lightened from `#6600ff` to `#8a4dff` so it reads on black; change it back in the `.a` CSS rule if wanted.
- **Storage:** `localStorage` key `song_<name>` holds the pasted text (the original format, so old saved songs still load). `songmeta_<name>` holds `{transpose, tempo, scroll, fontSize, sync}`. Audio is in IndexedDB (database `chordClassroom`, store `audio`, key = song name) because it is too big for `localStorage`.
- **Transpose** uses flats if the original song has more flat roots than sharp ones. Chords keep their column where they fit.
- **Scroll** uses `requestAnimationFrame`; 100% is 33 pixels a second.
- **Lyric sync:** tap-to-sync was chosen over automatic alignment (unreliable with a band, can't run in one file) and `.lrc` import (lines rarely match the chord sheet). A cue is a lyric line plus the chord line above it, or a chord-only line. Times are in audio time, so they hold at any tempo. The highlight runs 0.3 seconds early (`FOLLOW_LEAD`). A synced song doesn't start the speed scroll on Play.
- **iOS app:** loads the HTML with `loadHTMLString` and base URL `https://chord-classroom.invalid/` so saved songs persist; nothing is fetched. If saved songs or audio don't persist on the device, look here first (other route: `WKURLSchemeHandler`). A `WKUIDelegate` handles `confirm()`, otherwise Delete and Clear Sync silently do nothing. Audio plays with the silent switch on, and the screen stays awake.

## Building the iPad or iPhone app

1. In Xcode, make a new iOS App: name `ChordClassroom`, interface SwiftUI, language Swift.
2. Replace the template's `ContentView.swift` with `ios/ContentView.swift`. Leave the `...App.swift` file alone.
3. Drag `chord-converter.html` into the project with the app target ticked. The file name must stay `chord-converter.html`.
4. Run on the iPad or iPhone.

Builds with a free Apple ID stop working after 7 days. Audio must be an MP3 or M4A in the Files app (not Apple Music or Spotify). Songs saved in the browser don't carry into the app, and deleting the app deletes its songs.

## Code map (`chord-converter.html`)

- **Chord logic** (pure, above `// ---- UI ----`, testable in Node): `CHORD_RE`, `FILLER_RE`, `parseChord`, `isChordLine`, `shiftNote`, `renderChordLine`, `songPrefersFlats`, `buildSong`.
- **Display:** `convert`, `convertAndHide`, `changeTranspose`, `changeFontSize`, `toggleFullscreen`.
- **Scrolling:** `setScrollSpeed`, `scrollFrame`, `startScroll`, `stopScroll`, `toggleScroll`.
- **Lyric sync:** `hasSync`, `updateSyncInfo`, `scrollToLine`, `highlight`, `cueAt`, `updateFollow`, `followFrame`, `startSync`, `tapSync`, `rewindSyncTo`, `undoSync`, `finishSync`, `clearSync`, click handler on `#output`.
- **Audio:** `setAudio`, `clearAudio`, `setPlaybackSpeed`, `togglePlay`, `restartAudio`, `seekBy`.
- **Storage:** `openDatabase`, `audioStore`, `persistMeta`, `saveSong`, `openSong`, `deleteSong`, `loadSongs`.

## Still to do

- Try it in a browser and on an iPad; fix what the first real test shows.
- Pasting a new song over a synced one keeps the old sync times until Clear Sync or another song is loaded.
- No backup or export of saved songs between devices.
- No section looping, count-in or capo display.
- No app icon or Xcode project file.
