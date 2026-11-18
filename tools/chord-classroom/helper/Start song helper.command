#!/bin/zsh
# Double-click to start the song helper for the Chord Classroom Player.
# Leave the window open while you use the player; close it to stop the helper.

cd "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

SONGS="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Chord Player Songs"
mkdir -p "$SONGS"

exec deno run \
  --allow-net=127.0.0.1:8765 \
  --allow-run=yt-dlp \
  --allow-env=HOME \
  --allow-read="$SONGS" \
  --allow-write="$SONGS" \
  song-helper.js
