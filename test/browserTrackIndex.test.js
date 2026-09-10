import { describe, it, expect } from 'vitest'
import { BrowserTrackIndex } from '../js/browserTrackIndex.js'

function fakeBrowser(name) {
    const browser = {
        name,
        removed: [],
        layoutController: { removeTrackXYPair(pair) { browser.removed.push(pair) } }
    }
    return browser
}

const fakePair = (browser, format) => ({ browser, track: { name: format, config: { format } } })

describe('browser track index', () => {

    it('remembers a pair per browser, not one pair for the page', () => {

        const [ a, b ] = [ fakeBrowser('a'), fakeBrowser('b') ]
        const index = new BrowserTrackIndex()

        index.record(fakePair(a, 'sequence'))
        index.record(fakePair(b, 'sequence'))

        expect(index.has(a)).toBe(true)
        expect(index.has(b)).toBe(true)
    })

    it('removes the track from every targeted browser that has one', () => {

        const [ a, b, c ] = [ fakeBrowser('a'), fakeBrowser('b'), fakeBrowser('c') ]
        const index = new BrowserTrackIndex()

        index.record(fakePair(a, 'sequence'))
        index.record(fakePair(b, 'sequence'))

        index.removeFrom([ a, b, c ])

        expect(a.removed).toHaveLength(1)
        expect(b.removed).toHaveLength(1)
        expect(c.removed, 'a browser without the track is skipped, not errored').toHaveLength(0)
        expect(index.has(a)).toBe(false)
        expect(index.has(b)).toBe(false)
    })

    it('leaves untargeted browsers alone', () => {

        const [ a, b ] = [ fakeBrowser('a'), fakeBrowser('b') ]
        const index = new BrowserTrackIndex()

        index.record(fakePair(a, 'sequence'))
        index.record(fakePair(b, 'sequence'))

        index.removeFrom([ a ])

        expect(b.removed).toHaveLength(0)
        expect(index.has(b), 'b still has its track, so the checkbox must still read checked there').toBe(true)
    })

    it('clears wholesale, for the removals the viewer never announces', () => {

        const [ a, b ] = [ fakeBrowser('a'), fakeBrowser('b') ]
        const index = new BrowserTrackIndex()

        index.record(fakePair(a, 'sequence'))
        index.record(fakePair(b, 'sequence'))

        index.clear()

        expect(index.has(a)).toBe(false)
        expect(index.has(b)).toBe(false)

        index.removeFrom([ a, b ])
        expect(a.removed, 'nothing left to remove after a clear').toHaveLength(0)
    })

    it('forgets a pair the viewer removed on its own', () => {

        const a = fakeBrowser('a')
        const index = new BrowserTrackIndex()
        const pair = fakePair(a, 'sequence')

        index.record(pair)
        index.forget(pair)

        expect(index.has(a)).toBe(false)
    })
})
