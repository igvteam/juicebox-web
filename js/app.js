/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2019 The Regents of the University of California
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

import * as app_google from './app-google.js';
import initializationHelper from "./initializationHelper.js";
import hic from "../node_modules/juicebox.js/dist/juicebox.esm.js";

document.addEventListener("DOMContentLoaded", async (event) => {
    await init(document.getElementById('app-container'));
});

let googleEnabled = false;

async function init(container) {

    const versionElem = document.getElementById("hic-version-number");

    if (versionElem) {
        versionElem.innerText = `version ${hic.version}`;
    }
    const config = juiceboxConfig || {};   // From script include.  Optional.
    const google = config.google;
    const clientId = google ? google.clientId : undefined;

    if (clientId && 'GOOGLE_CLIENT_ID' !== clientId && (window.location.protocol !== "https:" && window.location.host !== "localhost")) {
        console.warn("To enable Google Drive use https://")
    }

    if (clientId && 'GOOGLE_CLIENT_ID' !== clientId && (window.location.protocol === "https:" || window.location.host === "localhost")) {
        const gapiConfig =
            {
                callback: async () => {
                    let ignore = await app_google.init(clientId);
                    await hic.initApp(container, config);
                    googleEnabled = true;
                    app_google.postInit();
                    await initializationHelper(container, config);

                },
                onerror: async error => {
                    console.log('gapi.client:auth2 - failed to load!');
                    console.error(error);
                    await initializationHelper(container, config);
                }
            };

        gapi.load('client:auth2', gapiConfig);
    } else {
        await hic.initApp(container, config);
        await initializationHelper(container, config);
    }
}

export {googleEnabled}



