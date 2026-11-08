# The Cipher Ritual

A cinematic, Gravity Falls–inspired random number generator, built with Three.js and Vite. Eight candles, Journal **4**, a forbidden invitation, and one very unreasonable deal.

## Run locally

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To generate and serve the production bundle:

```sh
npm test
npm run build
npm run preview
```

`dist/` is a portable static website. Fonts and illustrated journal artwork are bundled; 3D geometry, environmental textures, and audio are generated in the browser. No backend, API keys, tracking, or external runtime assets are needed. The decline action intentionally navigates to the requested YouTube Rickroll.

## Interaction

1. Pick up the brass lighter, then move its flame across all eight candle wicks. On touch screens, drag or tap the candles after picking it up. Keyboard users can focus the lighter and candles and press Enter. Escape puts the lighter down.
2. The journal rises, opens, and turns through eight distinct, richly illustrated spreads: gnomes, flying eyes, the Gremblob, unicorns, the shapeshifter, the Hide-Behind, dreamscapes, and Bill Cipher. Seven turning leaves have separate front and back illustrations, and paper thickness moves continuously from the right stack to the left. The final spread describes Bill Cipher.
3. Touch the journal to summon an eye through a blue portal, followed by Bill.
4. Accept his offer to see a first-person handshake. Both hands keep their natural colors until contact ignites blue fire. Declining leaves the site for the YouTube video. Browsers do not allow a normal website to close a tab it did not open, so the current page is replaced instead.
5. The ceiling falls, the camera rises, and the sky splits. The same Bill model crosses his arms, grows, gains depth, and turns red. After a blackout, a random integer from **0 through 100**, inclusive, appears.
6. Reroll, copy the result, or replay the ritual.

The sound button controls the procedural soundscape. Audio begins only after a user gesture. The motion control and the system’s reduced-motion preference reduce camera motion and shorten the sequence. The experience pauses while the tab is hidden. If WebGL cannot start, a simple accessible generator remains available.

## Randomness and verification

Random numbers use `crypto.getRandomValues` with rejection sampling to remove modulo bias. All 101 results, including 0 and 100, are reachable. Automated tests cover state ordering, candle uniqueness, random boundaries, rejection sampling, fast pointer intersections, conservation of paper thickness, contact-only fire, and the continuous transformation timeline.

## Deployment

The live site is published by GitHub Pages from the committed `docs/` production bundle on `main`. After changing source:

```sh
npm ci
npm test
npm run build
rm -rf docs
cp -R dist docs
touch docs/.nojekyll
git add src public index.html package.json package-lock.json tests docs
git commit -m "Update the ritual"
git push
```

The Vite build uses a relative asset base, so it works under a GitHub Pages repository path.

## Credits

This is an unofficial fan project. Bill Cipher and Gravity Falls belong to their respective rights holders. The character models, environmental textures, and audio are procedural assets. The original English journal illustrations were created with the built-in image-generation tool using the prompts preserved in `artwork/prompts.json`, inspired by the user's journal references; the references themselves are not redistributed. No episode footage or recordings are included. Typography: Cormorant Garamond and Manrope, distributed under the SIL Open Font License; copies are in `public/fonts/`.
