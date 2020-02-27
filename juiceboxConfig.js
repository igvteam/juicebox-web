/*
 * @author Jim Robinson Nov-2019
 */

const juiceboxConfig = {
    mapMenu: {
        id: 'contact-map-datalist',
        items: 'https://aidenlab.org/juicebox/res/mapMenuData.txt'
    },
    trackMenu: {
        id: 'annotation-datalist',
        items: 'https://hicfiles.s3.amazonaws.com/internal/tracksMenu_$GENOME_ID.txt'
    },
    trackMenu2D: {
        id: 'annotation-2D-datalist',
        items: 'https://hicfiles.s3.amazonaws.com/internal/tracksMenu_2D.$GENOME_ID.txt'
    },

    // List of URL shorteners.  First in the list is the default and will be used for shortening URLs
    // Others potentiall used for expanding short URLs.  At least 1 shortener is required for the
    // "Share" button.
    // NOTE: you must provide an API key (Google) or access token (Bitly) to use these services on your site
    urlShortener: [
        {
            provider: 'tinyURL'
        },
        {
            provider: "bitly",
            apiKey: "9915aab09b02b0c1a277c9af47e4bbcf0ab3f60f",        // TODO -- replace with your Bitly access token
            hostname: 'bit.ly'
        },
        {
            provider: "google",
            apiKey: "AIzaSyDUUAUFpQEN4mumeMNIRWXSiTh5cPtUAD0",        // TODO -- replace with your Google API Key.  Supports old google shortened URLs
            hostname: "goo.gl"
        }
    ],

    // Supply a Google client id to enable loading of private Google files.  Supply an API key to
    // enable loading of public Google files without login.
    google: {
        clientId: "661332306814-8nt29308rppg325bkq372vli8nm3na14.apps.googleusercontent.com",  // TODO -- replace with your Google client ID (for oAuth)
        apiKey: "AIzaSyDUUAUFpQEN4mumeMNIRWXSiTh5cPtUAD0",   // TODO -- replace with your Google API Key
        scope:
            [
                'https://www.googleapis.com/auth/devstorage.read_only',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
    }
}
