// Song helper for the Chord Classroom Player.
//
// Runs on Bill's Mac only. The player asks it for a song (a YouTube link or
// just the song title); it runs yt-dlp, keeps a copy of the .m4a in iCloud Drive
// ("Chord Player Songs", so it also shows on the iPad) and sends the audio
// back to the player, which loads it straight away.
//
// It only listens on this Mac (127.0.0.1) and only answers the player's pages.
// Start it with "Start song helper.command", or let it start at login
// (see README.md).

const PORT = 8765;
const VERSION = 1;

const HOME = Deno.env.get("HOME");
const SAVE_DIR = HOME + "/Library/Mobile Documents/com~apple~CloudDocs/Chord Player Songs";

// Pages allowed to use the helper: the live site, the file opened by
// double-clicking (its origin is "null") and local previews.
const ALLOWED_ORIGINS = [
    "https://bg-gthub.github.io",
    "null",
    "http://localhost:8080",
];

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"];

function corsHeaders(origin) {
    if (!ALLOWED_ORIGINS.includes(origin)) return {};

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Private-Network": "true",
        "Access-Control-Expose-Headers": "X-File-Name",
        "Vary": "Origin",
    };
}

function reply(origin, status, body, extra = {}) {
    return new Response(body, { status, headers: { ...corsHeaders(origin), ...extra } });
}

// A YouTube link is used as it is; anything else is searched on YouTube
// and the top result is used.
function target(query) {
    query = query.trim();

    if (/^https?:\/\//i.test(query)) {
        let url;

        try {
            url = new URL(query);
        } catch {
            return null;
        }

        return YOUTUBE_HOSTS.includes(url.hostname) ? url.href : null;
    }

    return query ? "ytsearch1:" + query : null;
}

async function download(what) {
    await Deno.mkdir(SAVE_DIR, { recursive: true });

    const command = new Deno.Command("yt-dlp", {
        args: [
            "--no-playlist",
            "--remote-components", "ejs:github",
            "-f", "bestaudio",
            "-x", "--audio-format", "m4a",
            "-o", SAVE_DIR + "/%(title)s.%(ext)s",
            "--print", "after_move:filepath",
            "--no-simulate",
            "--quiet", "--no-warnings",
            "--", what,
        ],
        stdout: "piped",
        stderr: "piped",
    });

    const result = await command.output();
    const out = new TextDecoder().decode(result.stdout).trim().split("\n").pop();
    const err = new TextDecoder().decode(result.stderr).trim();

    if (!result.success || !out) throw new Error(err.split("\n").pop() || "yt-dlp failed");

    return out;
}

Deno.serve({ hostname: "127.0.0.1", port: PORT }, async (request) => {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    if (request.method === "OPTIONS") return reply(origin, 204, null);

    if (url.pathname === "/ping") {
        return reply(origin, 200, JSON.stringify({ ok: true, version: VERSION }),
            { "Content-Type": "application/json" });
    }

    if (url.pathname === "/audio") {
        const what = target(url.searchParams.get("q") || "");

        if (!what) return reply(origin, 400, "Type a YouTube link or a song title.");

        try {
            const path = await download(what);
            const file = await Deno.readFile(path);
            const name = path.split("/").pop();

            console.log("Sent " + name);

            return reply(origin, 200, file, {
                "Content-Type": "audio/mp4",
                "X-File-Name": encodeURIComponent(name),
            });
        } catch (error) {
            console.error(error.message);
            return reply(origin, 502, "Could not get that song: " + error.message);
        }
    }

    return reply(origin, 404, "Not found");
});

console.log("Song helper is running. Leave this window open while you use the Chord Player.");
