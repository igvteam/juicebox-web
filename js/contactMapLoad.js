import {GenericDataSource, ModalTable} from '../node_modules/data-modal/dist/data-modal.js'
import {FileUtils, GooglePicker} from '../node_modules/igv-utils/src/index.js';
import {aidenLabContactMapDatasourceConfigurator} from './aidenLabContactMapDatasourceConfig.js'
import {encodeContactMapDatasourceConfiguration} from "./encodeContactMapDatasourceConfig.js"

let mapType = undefined;
let encodeHostedContactMapModal;
let contactMapModal;

function configureContactMapLoaders({
                                        rootContainer,
                                        $dropdowns,
                                        $localFileInputs,
                                        urlLoadModalId,
                                        dataModalId,
                                        encodeHostedModalId,
                                        $dropboxButtons,
                                        $googleDriveButtons,
                                        googleEnabled,
                                        mapMenu,
                                        loadHandler
                                    }) {

    $dropdowns.on('show.bs.dropdown', function () {

        // Contact or Control dropdown button
        // NOTE:  this in the callback is a DOM element, jquery weirdness
        const $child = $(this).children('.dropdown-toggle');

        // button id
        const id = $child.attr('id');

        // Set map type based on dropdown selected, this is a transient variable, set every time this callback
        // is invoked.
        mapType = 'hic-contact-map-dropdown' === id ? 'contact-map' : 'control-map';

    });

    $localFileInputs.on('change', async function (e) {
        const file = ($(this).get(0).files)[0];

        // NOTE:  this in the callback is a DOM element, jquery weirdness
        $(this).val("");

        const {name} = file;
        await loadHandler(file, name, mapType);
    });

    $dropboxButtons.on('click', function () {

        const config =
            {
                success: async dbFiles => {
                    const paths = dbFiles.map(dbFile => dbFile.link);
                    const path = paths[0];
                    const name = FileUtils.getFilename(path);
                    await loadHandler(path, name, mapType);
                },
                cancel: () => {
                },
                linkType: 'preview',
                multiselect: false,
                folderselect: false,
            };

        Dropbox.choose(config);

    });

    if (googleEnabled) {
        $googleDriveButtons.on('click', () => {

            GooglePicker.createDropdownButtonPicker(true, async responses => {

                const paths = responses.map(({name, url: google_url}) => {
                    return {filename: name, name, google_url};
                });

                let {name, google_url: path} = paths[0];
                await loadHandler(path, name, mapType);

            })
        })
    } else {
        $googleDriveButtons.parent().hide();
    }

    appendAndConfigureLoadURLModal(rootContainer, urlLoadModalId, path => {
        const name = FileUtils.getFilename(path);
        loadHandler(path, name, mapType);
    });

    if (mapMenu) {

        const modalTableConfig =
            {
                id: dataModalId,
                title: 'Contact Map',
                selectionStyle: 'single',
                pageLength: 10,
                okHandler: async ([selection]) => {
                    const {url, name} = selection
                    await loadHandler(url, name, mapType)
                }
            }
        contactMapModal = new ModalTable(modalTableConfig)

        const {items: path} = mapMenu
        const config = aidenLabContactMapDatasourceConfigurator(path)
        const datasource = new GenericDataSource(config)
        contactMapModal.setDatasource(datasource)
    }


    const encodeModalTableConfig =
        {
            id: encodeHostedModalId,
            title: 'ENCODE Hosted Contact Map',
            selectionStyle: 'single',
            pageLength: 10,
            okHandler: async ([{HREF, Description}]) => {
                const urlPrefix = 'https://www.encodeproject.org'
                const path = `${urlPrefix}${HREF}`
                await loadHandler(path, Description, mapType)
            }
        }

    encodeHostedContactMapModal = new ModalTable(encodeModalTableConfig)

    const datasource = new GenericDataSource(encodeContactMapDatasourceConfiguration)
    encodeHostedContactMapModal.setDatasource(datasource)

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

export default configureContactMapLoaders
