/**
 * Which browsers currently hold the track a page-wide checkbox stands for.
 *
 * The sequence and RefSeq-genes checkboxes are not menus: each one both loads a track and takes it
 * away again, and the taking away is what makes them different from every other load surface in the
 * shell. Removal goes through `layoutController.removeTrackXYPair(pair)` — one panel, one pair — so
 * a checkbox that fans its load out over four panels has to remember four pairs to fan the removal
 * back out. It used to remember exactly one, in a module-level variable, which was right when a
 * load could only ever reach one browser and becomes a one-way door the moment it can reach four:
 * the last panel loaded would win the variable, and the other three would be left holding a
 * `removable: false` track with no gesture that removes it.
 *
 * So the index is keyed by browser. Everything here is a pure function over browsers and track
 * pairs — no DOM, no juicebox namespace — so the fan-out is unit-testable, as `trackLoad.js` is.
 *
 * It keys off `trackXYPair.browser`, which the payload of `TrackXYPairLoad` carries. juicebox.js
 * declares that payload's shape in `js/publicApi.js` as `track`, `track.name` and
 * `track.config.format`; `browser` is genuinely there on the `TrackPair` but is not yet named in
 * that list, so it should be added there — an undeclared member a host reads is exactly what
 * ADR-0003 and that file exist to prevent.
 */

class BrowserTrackIndex {

    /**
     * A WeakMap rather than a Map: a panel the user deletes is disposed by the library and must not
     * be kept alive by this index, and nothing here ever needs to enumerate the keys — every
     * question is asked *about* a browser the caller already holds.
     */
    #pairs = new WeakMap()

    /**
     * Note that `trackXYPair.browser` now holds this track.
     *
     * A second load into the same browser replaces the entry rather than accumulating: the checkbox
     * asks a yes/no question per panel, and the pair it remembers is whichever one is there now.
     */
    record(trackXYPair) {
        this.#pairs.set(trackXYPair.browser, trackXYPair)
    }

    /**
     * Note that the track is gone from `trackXYPair.browser` — because the viewer removed it by
     * some other route, a gear popup or a reset, not because this index took it away.
     */
    forget(trackXYPair) {
        this.#pairs.delete(trackXYPair.browser)
    }

    has(browser) {
        return this.#pairs.has(browser)
    }

    /**
     * Take the track out of each of `browsers` that has one.
     *
     * A browser with no entry is skipped rather than erroring, mirroring the skip-don't-throw rule
     * the library's own fan-out follows: an aim spanning a panel that never got the track is an
     * ordinary thing for a user to have, not a mistake.
     *
     * Entries are collected before any removal runs, because `removeTrackXYPair` posts
     * `TrackXYPairRemoval` synchronously and the listener on the far side calls `forget`.
     */
    /**
     * Forget every entry, because the tracks are gone by a route that announces nothing.
     *
     * `layoutController.removeAllTrackXYPairs` — what a genome change and a browser reset go
     * through — disposes the pairs without posting `TrackXYPairRemoval`, unlike the single-pair
     * removal next to it. Nothing tells this index, so the caller that knows has to say so, or a
     * checkbox would keep reading checked over a panel whose track no longer exists.
     */
    clear() {
        this.#pairs = new WeakMap()
    }

    removeFrom(browsers) {

        const removals = browsers
            .filter(browser => this.#pairs.has(browser))
            .map(browser => ({ browser, trackXYPair: this.#pairs.get(browser) }))

        for (const { browser, trackXYPair } of removals) {
            browser.layoutController.removeTrackXYPair(trackXYPair)
            this.#pairs.delete(browser)
        }

        return removals.map(({ browser }) => browser)
    }
}

export { BrowserTrackIndex }
