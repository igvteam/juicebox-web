/*
 * @author Jim Robinson Nov-2019
 */
/*
 * @author Jim Robinson Nov-2019
 */

var juiceboxConfig = {
    mapMenu: {
        id: 'contact-map-datalist',
        items: 'https://aidenlab.org/juicebox/res/hicfiles.json'
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
    urlShortener: [
        {
            provider: 'tinyURL'
        },
        // {
        //     provider: "bitly",
        //     apiKey: "BITLY ACCESS TOKEN HERE",
        //     hostname: 'bit.ly'
        // }
    ],

    // Supply a Google client id to enable loading of private Google files.  Supply an API key to
    // enable loading of public Google files without login.
    // google: {
    //     clientId: "GOOGLE CLIENT ID",
    //     apiKey: "GOOGLE API KEY",
    //     scope:
    //         [
    //             'https://www.googleapis.com/auth/devstorage.read_only',
    //             'https://www.googleapis.com/auth/userinfo.profile',
    //             'https://www.googleapis.com/auth/drive.readonly'
    //         ]
    // }
}
