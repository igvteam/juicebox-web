import hic from "../node_modules/juicebox.js/dist/juicebox.esm.js";
import { loadHicFile } from "./initializationHelper.js";
import * as app_google from './app-google.js';

const igv = hic.igv;

let mapType = undefined;

class ContactMapLoad {
    constructor({ $dropdowns, $localFileInputs, $dropboxButtons, $googleDriveButtons, googleEnabled }) {

        $dropdowns.on('show.bs.dropdown', function () {

            // Contact or Control dropdown button - from above pair - now active
            const $child = $(this).children('.dropdown-toggle');

            // button id
            const id = $child.attr('id');

            // Set currentDropdownButtonID to id
            mapType = 'hic-contact-map-dropdown' === id ? 'contact-map' : 'control-map';

            console.log(`Current contact map type: ${ mapType }`);
        });

        $localFileInputs.on('change', async function (e) {
            const file = ($(this).get(0).files)[ 0 ];
            $(this).val("");

            const { name } = file;
            await loadHicFile(file, name, mapType);
        });

        $dropboxButtons.on('click', () => {

            const config =
                {
                    success: async dbFiles => {
                        const paths = dbFiles.map(dbFile => dbFile.link);
                        const path = paths[ 0 ];
                        const name = igv.getFilename(path);
                        await loadHicFile(path, name, mapType);
                    },
                    cancel: () => {},
                    linkType: 'preview',
                    multiselect: false,
                    folderselect: false,
                };

            Dropbox.choose( config );

        });

        if (false === googleEnabled) {
            $googleDriveButtons.parent().hide();
        }

        if (true === googleEnabled) {

            $googleDriveButtons.on('click', () => {

                app_google.createDropdownButtonPicker(true, async responses => {

                    const paths = responses.map(({ name, url: google_url }) => {
                        return { filename: name, name, google_url };
                    });

                    let { name, google_url: path } = paths[ 0 ];
                    await loadHicFile(path, name, mapType);

                });

            });
        }

    }
}

export default ContactMapLoad
