import hic from "../node_modules/juicebox.js/dist/juicebox.esm.js";
import * as app_google from './app-google.js';
import ModalTable from '../node_modules/data-modal/js/modalTable.js';
import ContactMapDatasource from "./contactMapDatasource.js";
import EncodeContactMapDatasource from "./encodeContactMapDatasource.js";
import { currentGenomeId, appendAndConfigureLoadURLModal } from "./initializationHelper.js";

const igv = hic.igv;

let mapType = undefined;
let contactMapDatasource = undefined;
let encodeContactMapDatasource = undefined;

class ContactMapLoad {

    constructor({ rootContainer, $dropdowns, $localFileInputs, urlLoadModalId, dataModalId, encodeHostedModalId, $dropboxButtons, $googleDriveButtons, googleEnabled, mapMenu, loadHandler }) {

        $dropdowns.on('show.bs.dropdown', function () {

            // Contact or Control dropdown button
            const $child = $(this).children('.dropdown-toggle');

            // button id
            const id = $child.attr('id');

            // Set map type based on dropdown selected
            mapType = 'hic-contact-map-dropdown' === id ? 'contact-map' : 'control-map';

        });

        $localFileInputs.on('change', async function (e) {
            const file = ($(this).get(0).files)[ 0 ];
            $(this).val("");

            const { name } = file;
            await loadHandler(file, name, mapType);
        });

        $dropboxButtons.on('click', () => {

            const config =
                {
                    success: async dbFiles => {
                        const paths = dbFiles.map(dbFile => dbFile.link);
                        const path = paths[ 0 ];
                        const name = igv.getFilename(path);
                        await loadHandler(path, name, mapType);
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
                    await loadHandler(path, name, mapType);

                });

            });
        }

        appendAndConfigureLoadURLModal(rootContainer, urlLoadModalId, path => {
            const name = igv.getFilename(path);
            loadHandler( path, name, mapType );
        });

        if (mapMenu) {

            this.contactMapModal = new ModalTable({ id: dataModalId, title: 'Contact Map', selectionStyle: 'single', pageLength: 10 });

            const { items: path } = mapMenu;
            contactMapDatasource = new ContactMapDatasource(path);

            this.contactMapModal.setDatasource(contactMapDatasource);

            this.contactMapModal.selectHandler = async selectionList => {
                const { url, name } = contactMapDatasource.tableSelectionHandler(selectionList);
                await loadHandler(url, name, mapType);
            };
        }

        this.encodeHostedContactMapModal = new ModalTable({ id: encodeHostedModalId, title: 'ENCODE Hosted Contact Map', selectionStyle: 'single', pageLength: 10 });

        this.encodeHostedContactMapModal.selectHandler = async selectionList => {
            const { url, name } = this.encodeHostedContactMapModal.datasource.tableSelectionHandler(selectionList);
            await loadHandler(url, name, mapType);
        };

        hic.EventBus.globalBus.subscribe("GenomeChange", this);

    }

    async receiveEvent(event) {

        const { data: genomeId } = event;

        if (currentGenomeId !== genomeId) {
            this.encodeHostedContactMapModal.setDatasource(new EncodeContactMapDatasource(genomeId));
        }

    }
}

export default ContactMapLoad
