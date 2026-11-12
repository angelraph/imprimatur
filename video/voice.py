"""Narration: one mp3 per scene plus word timings, using Microsoft neural voices through edge-tts."""
import asyncio, json, os, sys
import edge_tts

VOICE = os.environ.get("VOICE", "en-US-AndrewNeural")
RATE = os.environ.get("RATE", "-4%")
scenes_file, out_dir = sys.argv[1], sys.argv[2]
only = sys.argv[3] if len(sys.argv) > 3 else None
os.makedirs(out_dir, exist_ok=True)


async def one(scene):
    mp3 = os.path.join(out_dir, scene["id"] + ".mp3")
    words = []
    try:
        com = edge_tts.Communicate(scene["text"], VOICE, rate=RATE, boundary="WordBoundary")
    except TypeError:
        com = edge_tts.Communicate(scene["text"], VOICE, rate=RATE)
    with open(mp3, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({"t": chunk["offset"] / 1e7, "d": chunk["duration"] / 1e7, "w": chunk["text"]})
    with open(os.path.join(out_dir, scene["id"] + ".words.json"), "w", encoding="utf-8") as f:
        json.dump(words, f)
    print(scene["id"], os.path.getsize(mp3), "bytes", len(words), "words", "last word ends", round(words[-1]["t"] + words[-1]["d"], 2) if words else None)


async def main():
    scenes = json.load(open(scenes_file, encoding="utf-8"))
    for s in scenes:
        if only and s["id"] != only:
            continue
        done = os.path.join(out_dir, s["id"] + ".words.json")
        if not only and os.path.exists(done) and os.path.getsize(os.path.join(out_dir, s["id"] + ".mp3")) > 20000:
            print(s["id"], "kept")
            continue
        for attempt in range(6):
            try:
                await one(s)
                break
            except Exception as e:
                print(s["id"], "retry", attempt + 1, type(e).__name__)
                await asyncio.sleep(3 + attempt * 3)
        else:
            raise SystemExit("gave up on " + s["id"])

asyncio.run(main())
