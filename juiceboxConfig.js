/*
 * @author Jim Robinson Nov-2019
 */

const juiceboxConfig = {
    mapMenu: {
        id: 'contact-map-datalist',
        // items: 'https://aidenlab.org/juicebox/res/mapMenuData.txt'
        items: 'https://aidenlab.org/juicebox/res/hicfiles.json'
        // items: 'hicfiles.json'
    },
    trackMenu: {
        id: 'annotation-datalist',
        items: 'https://hicfiles.s3.amazonaws.com/internal/tracksMenu_$GENOME_ID.txt'
    },
    trackMenu2D: {
        id: 'annotation-2D-datalist',
        items: 'https://hicfiles.s3.amazonaws.com/internal/tracksMenu_2D.$GENOME_ID.txt'
    },

    urlShortener:
        [
            {
                provider: 'tinyURL'
            }
        ],

    // Supply a Google client id to enable loading of private Google files.  Supply an API key to
    // enable loading of public Google files without login.
    google: {
        clientId: "GOOGLE_CLIENT_ID",  // TODO -- replace with your Google client ID (for oAuth)
        apiKey: "GOOGLE_KEY",   // TODO -- replace with your Google API Key
        scope:
            [
                'https://www.googleapis.com/auth/devstorage.read_only',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
    }
};

export { juiceboxConfig }
