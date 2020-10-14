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

import {GoogleAuth} from '../node_modules/igv-utils/src/index.js'
import { AlertSingleton } from '../node_modules/igv-widgets/dist/igv-widgets.js'
import initializationHelper from "./initializationHelper.js"
import hic from "../node_modules/juicebox.js/dist/js/juicebox.esm.js"

document.addEventListener("DOMContentLoaded", async (event) => {
    await init(document.getElementById('app-container'));
});

let googleEnabled = false;

async function init(container) {

    AlertSingleton.init(container)

    const config = juiceboxConfig || {};   // From script include.  Optional.

    const enableGoogle = config.clientId && 'CLIENT_ID' !== config.clientId && (window.location.protocol === "https:" || window.location.host === "localhost")

    if (enableGoogle) {
        try {
            await GoogleAuth.init({
                client_id: config.clientId,
                apiKey: config.apiKey,
                scope: 'https://www.googleapis.com/auth/userinfo.profile'
            })
            googleEnabled = true
        } catch (e) {
            console.error(e)
            AlertSingleton.present(e.message)
        }
    }

    await hic.initApp(container, config)

    await initializationHelper(container, config)

}

export {googleEnabled}



