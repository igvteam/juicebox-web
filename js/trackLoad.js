import hic from "../node_modules/juicebox.js/dist/js/juicebox.esm.js";
import * as app_google from './app-google.js';
import { appendAndConfigureLoadURLModal, createAnnotationDatalistModals } from "./initializationHelper.js";

const igv = hic.igv;

class TrackLoad {

    constructor({ rootContainer, $dropdowns, $localFileInput, urlLoadModalId, $dropboxButtons, $googleDriveButtons, googleEnabled, loadHandler }) {

        $localFileInput.on('change', () => {

            const file = ($localFileInput.get(0).files)[ 0 ];
            const { name } = file;

            $localFileInput.val("");

            const config =
                {
                    name,
                    filename: name,
                    format: igv.inferFileFormat(name),
                    url: file
                };

            loadHandler([ config ]);

        });

        appendAndConfigureLoadURLModal(rootContainer, urlLoadModalId, path => {

            const name = igv.getFilename(path);

            const config =
                {
                    name,
                    filename: name,
                    format: igv.inferFileFormat(name),
                    url: path
                };

            loadHandler([ config ]);

        });

        createAnnotationDatalistModals(rootContainer);

        $dropboxButtons.on('click', () => {

            const config =
                {
                    success: async dbFiles => {

                        const configurations = dbFiles.map(dbFile => {

                            const { link: path } = dbFile;
                            const name = igv.getFilename(path);

                            const config =
                                {
                                    name,
                                    filename: name,
                                    format: igv.inferFileFormat(name),
                                    url: path
                                };

                            return config;

                        });

                        await loadHandler(configurations);
                    },
                    cancel: () => {},
                    linkType: 'preview',
                    multiselect: true,
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


                    const configurations = responses.map(({ name, url }) => {

                        const config =
                            {
                                name,
                                filename: name,
                                format: igv.inferFileFormat(name),
                                url
                            };

                        return config;

                    });

                    await loadHandler(configurations);

                });

            });
        }

    }
}

export default TrackLoad
