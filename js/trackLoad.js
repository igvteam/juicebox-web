/**
 * Where a track load lands.
 *
 * juicebox.js ships two answers and the host picks one. `browser.loadTracks` loads into that one
 * browser; `registry.loadTracksIntoTargets` fans the same configs out over the target set the user
 * aimed at with shift-click, skipping panels that cannot take them. The library is deliberately
 * silent about which a host wants — juicebox.js ADR-0015 decision 8: nothing existing became
 * plural, and a host opts in by calling the new method. Until it did, every menu in this shell
 * loaded into the current browser alone, so aiming at several panels looked broken from the shell
 * even though the library was doing exactly what it was asked.
 *
 * Decision 7 of that ADR is the other half: the fan-out raises no alert, it returns
 * `{loaded, failed, skipped}` and the host reports — one report per gesture, not one modal per
 * browser, on the shell's own alert surface.
 *
 * This module is those two decisions, in one place, so every load surface answers them the same
 * way. `getCurrentBrowser` and `presentAlert` are passed in rather than imported, as in
 * `trackMenu.js`: it keeps the fan-out testable without a viewer or a dialog, and importing
 * juicebox.js here would drag a DOM-dependent bundle into a plain node test.
 */

/**
 * The juicebox-specific defaults the shell has always set on a track config.
 *
 * Applied here, before the fan-out copies each config per target, so every panel gets them.
 */
function applyDefaults(configs) {
    for (const config of configs) {
        config.autoscale = true
        config.displayMode = 'COLLAPSED'
    }
    return configs
}

/**
 * The one message a gesture produces, or `undefined` when there is nothing worth saying.
 *
 * Silence is the common case: an unaimed load lands in the current browser and reports nothing,
 * exactly as it did before there was a target set.
 *
 * The two skip reasons are contract (juicebox.js ADR-0015, decision 5) and mean different things to
 * a user: `no-dataset` is a panel with no map in it yet, `genome-mismatch` is a panel on another
 * genome — the skip that quietly prevents a track being drawn at meaningless coordinates. Saying
 * which is why the panel was passed over is the whole point of reporting.
 */
function summaryMessage({ loaded, failed, skipped }) {

    const notes = []

    for (const { error } of failed) {
        notes.push(`failed in one panel: ${ error.message }`)
    }

    const noDataset = skipped.filter(({ reason }) => 'no-dataset' === reason).length
    const mismatched = skipped.filter(({ reason }) => 'genome-mismatch' === reason).length

    if (noDataset > 0) {
        notes.push(`skipped ${ noDataset } panel(s) with no contact map loaded`)
    }

    if (mismatched > 0) {
        notes.push(`skipped ${ mismatched } panel(s) on a different genome`)
    }

    if (0 === notes.length) {
        return undefined
    }

    return `Track load: ${ loaded.length } panel(s) loaded, ${ notes.join(', ') }.`
}

/**
 * Load `configs` into every browser the user has aimed at.
 *
 * With no aim in progress the target set resolves to `[currentBrowser]`, so this is the previous
 * single-browser behaviour — the feature is opt-in at the *gesture*, not at this call site.
 *
 * Takes the configs as given. The menu defaults are a separate wrapper because not every load
 * surface wants them: the sequence and RefSeq-genes checkboxes load a fixed, genome-derived config
 * that has never carried them, and quietly acquiring `autoscale` on a sequence track by routing it
 * through here would be a behaviour change smuggled in with a bug fix.
 */
async function loadIntoTargets(configs, { getCurrentBrowser, presentAlert }) {

    const browser = getCurrentBrowser()

    if (undefined === browser) {
        presentAlert('Contact map must be loaded and selected before loading tracks')
        return
    }

    const summary = await browser.registry.loadTracksIntoTargets(configs)

    const message = summaryMessage(summary)

    if (undefined !== message) {
        presentAlert(message)
    }

    return summary
}

/**
 * The same fan-out, with the defaults the shell's track menus have always set.
 */
async function loadMenuTracks(configs, options) {
    return loadIntoTargets(applyDefaults(configs), options)
}

/**
 * The browsers a load issued now would reach, for a gesture that has to *undo* one.
 *
 * Removal is not a load and does not go through the registry — `layoutController` removes a pair
 * from one browser — but it has to reach the same set, or checking a box and unchecking it would
 * not be inverses.
 */
function targetsOf(browser) {
    return undefined === browser ? [] : browser.registry.targetedBrowsers
}

export { loadIntoTargets, loadMenuTracks, targetsOf, applyDefaults, summaryMessage }
