import { describe, it, expect } from 'vitest'
import { loadMenuTracks as loadTracks } from '../js/trackLoad.js'

/**
 * A stand-in for a juicebox.js BrowserRegistry, implementing only the declared surface this module
 * uses: `targetedBrowsers` (the resolved aim, current browser included) and `loadTracksIntoTargets`
 * (the fan-out, resolving to `{loaded, failed, skipped}`).
 */
function fakeRegistry({ browserCount = 3 } = {}) {

    const skip = []
    const fail = []

    const browsers = Array.from({ length: browserCount }, (_, i) => ({
        name: `browser-${ i }`,
        received: [],
        async loadTracks(configs) { this.received.push(...configs) },
        async loadTracksOrThrow(configs) { this.received.push(...configs) }
    }))

    const registry = {
        browsers,
        skip,
        fail,
        currentBrowser: browsers[ 0 ],
        get targetedBrowsers() { return browsers },
        async loadTracksIntoTargets(configs) {
            const summary = { loaded: [], failed: [], skipped: [] }
            for (const browser of this.targetedBrowsers) {
                if (skip.includes(browser)) { summary.skipped.push({ browser, reason: 'genome-mismatch' }); continue }
                if (fail.includes(browser)) { summary.failed.push({ browser, error: new Error('nope') }); continue }
                await browser.loadTracksOrThrow(configs.map(c => ({ ...c })))
                summary.loaded.push(browser)
            }
            return summary
        }
    }

    browsers.forEach(browser => browser.registry = registry)

    return registry
}

describe('track load', () => {

    it('loads a 1D track into every targeted browser, not only the current one', async () => {

        const registry = fakeRegistry()
        const alerts = []

        await loadTracks([ { url: 'https://example.org/signal.bigwig', name: 'signal' } ], {
            getCurrentBrowser: () => registry.currentBrowser,
            presentAlert: message => alerts.push(message)
        })

        for (const browser of registry.browsers) {
            expect(browser.received.map(({ name }) => name), `${ browser.name } received the track`).toEqual([ 'signal' ])
        }

        expect(alerts).toEqual([])
    })

    it('loads a 2D annotation into every targeted browser by the same route', async () => {

        const registry = fakeRegistry()

        await loadTracks([ { url: 'https://example.org/loops.bedpe', name: 'loops' } ], {
            getCurrentBrowser: () => registry.currentBrowser,
            presentAlert: () => {}
        })

        for (const browser of registry.browsers) {
            expect(browser.received.map(({ name }) => name), `${ browser.name } received the annotation`).toEqual([ 'loops' ])
        }
    })

    it('gives each target its own config, because the loader mutates what it is handed', async () => {

        const registry = fakeRegistry()

        await loadTracks([ { url: 'https://example.org/signal.bigwig', name: 'signal' } ], {
            getCurrentBrowser: () => registry.currentBrowser,
            presentAlert: () => {}
        })

        const [ first ] = registry.browsers[ 0 ].received
        const [ second ] = registry.browsers[ 1 ].received

        expect(first).not.toBe(second)
        expect(first.autoscale).toBe(true)
        expect(first.displayMode).toBe('COLLAPSED')
    })

    it('reports skips and failures once per gesture, not once per browser', async () => {

        const registry = fakeRegistry()
        const alerts = []

        registry.skip.push(registry.browsers[ 1 ])
        registry.fail.push(registry.browsers[ 2 ])

        const summary = await loadTracks([ { url: 'https://example.org/signal.bigwig', name: 'signal' } ], {
            getCurrentBrowser: () => registry.currentBrowser,
            presentAlert: message => alerts.push(message)
        })

        expect(summary.loaded).toHaveLength(1)
        expect(alerts).toHaveLength(1)
        expect(alerts[ 0 ]).toMatch(/different genome/)
        expect(alerts[ 0 ]).toMatch(/failed/)
    })

    it('alerts rather than throwing when there is no browser to load into', async () => {

        const alerts = []

        await loadTracks([ { url: 'https://example.org/signal.bigwig', name: 'signal' } ], {
            getCurrentBrowser: () => undefined,
            presentAlert: message => alerts.push(message)
        })

        expect(alerts).toEqual([ 'Contact map must be loaded and selected before loading tracks' ])
    })
})
