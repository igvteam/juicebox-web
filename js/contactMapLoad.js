import { ModalTable, GenericMapDatasource } from '../node_modules/data-modal/js/index.js'
import {GooglePicker,FileUtils} from '../node_modules/igv-utils/src/index.js';
import { aidenLabContactMapDatasourceConfigurator } from './aidenLabContactMapDatasourceConfig.js'
import { encodeContactMapDatasourceConfigurator } from "./encodeContactMapDatasourceConfig.js"

let mapType = undefined;

class ContactMapLoad {

    constructor({ rootContainer, $dropdowns, $localFileInputs, urlLoadModalId, dataModalId, $encodeHostedModalPresentationButton, encodeHostedModalId, $dropboxButtons, $googleDriveButtons, googleEnabled, mapMenu, loadHandler }) {

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
                        const name = FileUtils.getFilename(path);
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

                GooglePicker.createDropdownButtonPicker(true, async responses => {

                    const paths = responses.map(({ name, url: google_url }) => {
                        return { filename: name, name, google_url };
                    });

                    let { name, google_url: path } = paths[ 0 ];
                    await loadHandler(path, name, mapType);

                });

            });
        }

        appendAndConfigureLoadURLModal(rootContainer, urlLoadModalId, path => {
            const name = FileUtils.getFilename(path);
            loadHandler( path, name, mapType );
        });

        if (mapMenu) {

            this.contactMapModal = new ModalTable({ id: dataModalId, title: 'Contact Map', selectionStyle: 'single', pageLength: 10 });

            const { items: path } = mapMenu;
            this.contactMapModal.setDatasource( new GenericMapDatasource( aidenLabContactMapDatasourceConfigurator()) );

            this.contactMapModal.selectHandler = async selection => {
                const { url, name } = selection;
                await loadHandler(url, name, mapType);
            };
        }

        this.$encodeHostedModalPresentationButton = $encodeHostedModalPresentationButton
        this.$encodeHostedModalPresentationButton.removeClass('disabled')

        this.encodeHostedContactMapModal = new ModalTable({ id: encodeHostedModalId, title: 'ENCODE Hosted Contact Map', selectionStyle: 'single', pageLength: 10 });
        this.encodeHostedContactMapModal.setDatasource(new GenericMapDatasource( encodeContactMapDatasourceConfigurator()));

        this.encodeHostedContactMapModal.selectHandler = async selection => {
            const { url, name } = selection;
            await loadHandler(url, name, mapType);
        };

    }

}

function appendAndConfigureLoadURLModal(root, id, input_handler) {

    const html =
        `<div id="${id}" class="modal fade">
            <div class="modal-dialog  modal-lg">
                <div class="modal-content">

                <div class="modal-header">
                    <div class="modal-title">Load URL</div>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>

                </div>

                <div class="modal-body">

                    <div class="form-group">
                        <input type="text" class="form-control" placeholder="Enter URL">
                    </div>

                </div>

                </div>
            </div>
        </div>`;

    $(root).append(html);

    const $modal = $(root).find(`#${id}`);
    $modal.find('input').on('change', function () {

        const path = $(this).val();
        $(this).val("");

        $(`#${id}`).modal('hide');

        input_handler(path);


    });

    return html;
}

export default ContactMapLoad
