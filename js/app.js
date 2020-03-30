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

/**
 * Created by Jim Robinson on 3/4/17.
 *
 * Page (site specific) code for the example pages.
 *
 */


// This file depends on bootstrap modifications to jQuery => jquery & bootstrap are required.  Do not import jquery here, need the jquery from the page.

import * as app_google from './app-google.js';
import initializationHelper from "./initializationHelper.js";

// The "hic" object.  By default get from the juicebox bundle, but for efficient debugging get from the source (index.js)
import hic from "../node_modules/juicebox.js/dist/juicebox.esm.js";
//import hic from "../node_modules/juicebox.js/js/index.js";

// import { juiceboxConfig } from "../juiceboxConfig.js";
import { juiceboxConfig } from "../juiceboxConfig-private.js";

document.addEventListener("DOMContentLoaded", async (event) => {
    await init(document.getElementById('app-container'), juiceboxConfig);
});

let googleEnabled = false;

const init = async (container, config) => {

    const versionElem = document.getElementById("hic-version-number");
    if(versionElem) {
        versionElem.innerText = `version ${hic.version}`;
    }

    config = config || {};
    const { google } = config;
    const { clientId } = google;
    if (clientId && 'CLIENT_ID' !== clientId) {

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


};



