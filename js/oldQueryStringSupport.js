// Copied from juicebox.js -- won't work as is

import hic from "../node_modules/juicebox.js/dist/js/juicebox.esm.js";
import {StringUtils} from '../node_modules/igv-utils/src/index.js';

async function converyQuery(config) {

    // if (config.urlShortener) {
    //     setURLShortener(config.urlShortener);
    // }
    //
    // if (config.apiKey) {
    //     igv.xhr.setApiKey(config.apiKey);
    // }
    //
    // if (config.oauthToken) {
    //     igv.oauth.setToken(config.oauthToken);
    // }
    //

    let query = {};

    if (false === config.queryParametersSupported) {
        // ignore window.location.href params
    } else {
        query = hic.extractQuery(window.location.href);
        query = await expandJuiceboxUrl(query)
    }

    if (query.hasOwnProperty("session")) {
        if (query.session.startsWith("blob:")) {
            const json = JSON.parse(StringUtils.uncompressString(query.session.substr(5)));
            json.initFromUrl = false;
            console.log(JSON.stringify(json));
            await hic.restoreSession(container, json);
        } else {
            // TODO - handle session url
        }
    } else {
        await createBrowsers(container, query);
    }
    hic.syncBrowsers();
}


