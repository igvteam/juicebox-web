// Copied from juicebox.js -- won't work as is

// The igv xhr object. TODO eliminate this dependency
const igvxhr = hic.igvxhr;


async function initApp(container, config) {

    appContainer = container;

    Alert.init(container);

    if (config.urlShortener) {
        setURLShortener(config.urlShortener);
    }

    if (config.apiKey) {
        igv.xhr.setApiKey(config.apiKey);
    }

    if (config.oauthToken) {
        igv.oauth.setToken(config.oauthToken);
    }

    if (config.clientId && (!GoogleAuth.isInitialized())) {
        await GoogleAuth.init({
            clientId: config.clientId,
            apiKey: config.apiKey,
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        })
    }

    let query = {};

    config.queryParametersSupported =  config.queryParametersSupported !== false;

    if (false === config.queryParametersSupported) {
        // ignore window.location.href params
    } else {
        query = extractQuery(window.location.href);
        query = await expandJuiceboxUrl(query)
    }

    if (query.hasOwnProperty("session")) {
        if (query.session.startsWith("blob:")) {
            const json = JSON.parse(decompressQueryParameter(query.session.substr(5)));
            json.initFromUrl = false;
            console.log(JSON.stringify(json));
            await restoreSession(container, json);
        } else {
            // TODO - handle session url
            await createBrowsers(container, query)
        }
    } else {
        await createBrowsers(container, query);
    }
    syncBrowsers(allBrowsers);
}

export {initApp}