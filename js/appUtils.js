/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
import {StringUtils} from '../node_modules/igv-utils/src/index.js'
import {InputDialog} from '../node_modules/igv-ui/dist/igv-ui.js'
import igv from "../node_modules/igv/dist/igv.esm.js"
import $ from '../vendor/jquery-3.3.1.slim.js'
import EventBus from './eventBus.js'
import HICBrowser from './hicBrowser.js'
import ColorScale from './colorScale.js'
import State from './hicState.js'
import HICEvent from './hicEvent.js'
import {decodeQuery, extractQuery} from "./urlUtils.js";
import ContactMatrixView from "./contactMatrixView.js";


/**
 * The global event bus.  For events outside the scope of a single browser.
 *
 * @type {EventBus}
 */
const eventBus = new EventBus()

let allBrowsers = []

async function updateAllBrowsers() {

    for (let b of allBrowsers) {
        await b.update()
    }
}

function deleteAllBrowsers() {
    for (let b of allBrowsers) {
        b.$root.remove();
    }
    allBrowsers = [];
}

async function createBrowser(hic_container, config, callback) {

    const $hic_container = $(hic_container);

    setDefaults(config);

    let queryString = config.queryString || config.href;   // href for backward compatibility
    if (queryString === undefined && config.initFromUrl !== false) {
        queryString = window.location.href;
    }

    if (queryString) {
        const query = extractQuery(queryString);
        const uriDecode = queryString.includes("%2C");
        decodeQuery(query, config, uriDecode);
    }

    if (StringUtils.isString(config.state)) {
        config.state = State.parse(config.state);
    }
    if (StringUtils.isString(config.colorScale)) {
        config.colorScale = ColorScale.parse(config.colorScale);
    }
    if (StringUtils.isString(config.backgroundColor)) {
        config.backgroundColor = ContactMatrixView.parseBackgroundColor(config.backgroundColor);
    }

    const browser = new HICBrowser($hic_container, config);

    browser.eventBus.hold()

    allBrowsers.push(browser);

    HICBrowser.setCurrentBrowser(browser);

    if (allBrowsers.length > 1) {
        allBrowsers.forEach(function (b) {
            b.$browser_panel_delete_button.show();
        });
    }

    if (undefined === igv.browser) {
        createIGV($hic_container, browser);
    }

    browser.inputDialog = new InputDialog($hic_container.get(0), browser);

    // browser.trackRemovalDialog = new igv.TrackRemovalDialog($hic_container, browser);

    browser.dataRangeDialog = new igv.DataRangeDialog($hic_container, browser);

    ///////////////////////////////////
    try {
        browser.contactMatrixView.startSpinner();
        browser.$user_interaction_shield.show();

        const hasControl = config.controlUrl !== undefined

        // if (!config.name) config.name = await extractName(config)
        // const prefix = hasControl ? "A: " : "";
        // browser.$contactMaplabel.text(prefix + config.name);
        // browser.$contactMaplabel.attr('title', config.name);

        await browser.loadHicFile(config, true)
        await loadControlFile(config)

        if (config.cycle) {
            config.displayMode = "A"
        }

        if (config.displayMode) {
            browser.contactMatrixView.displayMode = config.displayMode;
            browser.eventBus.post({type: "DisplayMode", data: config.displayMode});
        }
        if (config.colorScale) {
            // This must be done after dataset load
            browser.contactMatrixView.setColorScale(config.colorScale);
            browser.eventBus.post({type: "ColorScale", data: browser.contactMatrixView.getColorScale()});
        }

        var promises = [];
        if (config.tracks) {
            promises.push(browser.loadTracks(config.tracks))
        }

        if (config.normVectorFiles) {
            config.normVectorFiles.forEach(function (nv) {
                promises.push(browser.loadNormalizationFile(nv));
            })
        }
        await Promise.all(promises);

        const tmp = browser.contactMatrixView.colorScaleThresholdCache;
        browser.eventBus.release()
        browser.contactMatrixView.colorScaleThresholdCache = tmp

        if (config.cycle) {
            browser.controlMapWidget.toggleDisplayModeCycle();
        } else {
            await browser.update()
        }

        if (typeof callback === "function") callback();
    } finally {
        browser.contactMatrixView.stopSpinner();
        browser.$user_interaction_shield.hide();
    }


    return browser;


    // Explicit set dataset, do not need to load.  Used by "interactive figures"
    async function setInitialDataset(browser, config) {

        if (config.dataset) {
            config.dataset.name = config.name;
            browser.$contactMaplabel.text(config.name);
            browser.$contactMaplabel.attr('title', config.name);
            browser.dataset = config.dataset;
            browser.genome = new Genome(browser.dataset.genomeId, browser.dataset.chromosomes);
            igv.browser.genome = browser.genome;
            EventBus.globalBus.post(HICEvent("GenomeChange", browser.genome.id));
            browser.eventBus.post(HICEvent("MapLoad", browser.dataset));
            return config.dataset;
        } else {
            return undefined;
        }
    }

    // Load the control file, if any
    async function loadControlFile(config) {
        if (config.controlUrl) {
            return browser.loadHicControlFile({
                url: config.controlUrl,
                name: config.controlName,
                nvi: config.controlNvi,
                isControl: true
            }, true);
        } else {
            return undefined;
        }
    }
}

function deleteBrowserPanel(browser) {

    if (browser === HICBrowser.getCurrentBrowser()) {
        HICBrowser.setCurrentBrowser(undefined);
    }

    allBrowsers.splice(allBrowsers.indexOf(browser), 1);
    browser.$root.remove();
    browser = undefined;

    if (1 === allBrowsers.length) {
        HICBrowser.setCurrentBrowser(allBrowsers[0]);
        HICBrowser.getCurrentBrowser().$browser_panel_delete_button.hide();
    }

}

HICBrowser.setCurrentBrowser = function (browser) {// unselect current browser
    if (undefined === browser) {
        if (HICBrowser.currentBrowser) {
            HICBrowser.currentBrowser.$root.removeClass('hic-root-selected');
        }
        HICBrowser.currentBrowser = browser;
        return;
    }
    if (browser !== HICBrowser.currentBrowser) {
        if (HICBrowser.currentBrowser) {
            HICBrowser.currentBrowser.$root.removeClass('hic-root-selected');
        }
        browser.$root.addClass('hic-root-selected');
        HICBrowser.currentBrowser = browser;
        EventBus.globalBus.post(HICEvent("BrowserSelect", browser))
    }
}

export {
    eventBus, allBrowsers, createBrowser, deleteAllBrowsers, deleteBrowserPanel,
    updateAllBrowsers, HICBrowser
}
