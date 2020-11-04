import {AlertSingleton} from '../node_modules/igv-ui/dist/igv-ui.js'

let columnDictionary = {};

class ContactMapDatasource {

    constructor(path) {

        this.path = path;

    }

    async tableColumns() {
        return Object.keys(columnDictionary);
    }

    async tableData() {
        return this.fetchData(this.path);
    }

    async fetchData(path){

        let response = undefined;
        try {
            response = await fetch(path);
        } catch (e) {
            AlertSingleton.present(e.message);
            return undefined;
        }

        if (response) {
            const obj = await response.json();
            return this.parseData(obj);
        } else {
            return undefined;
        }
    };

    parseData(obj){

        const [ path, template ] = Object.entries(obj)[ 0 ];

        const columns = Object.keys(template);
        columns.push('url');
        // add index to support sort
        columns.unshift('index');

        for (let string of columns) {
            columnDictionary[ string ] = string;
        }

        this.columnDefs =
            [
                {
                    targets: [ Object.keys(columnDictionary).indexOf('index') ], // hide index
                    visible: false,
                    searchable: false
                },
                {
                    targets: [ Object.keys(columnDictionary).indexOf('NVI') ], // hide NVI
                    visible: false,
                    searchable: false
                },
                {
                    targets: [ Object.keys(columnDictionary).indexOf('url') ], // hide url
                    visible: false,
                    searchable: false
                }

            ];

        return Object.entries(obj).map(([ path, record ], i) => {

            const cooked = {};
            Object.assign(cooked, record);

            for (let key of Object.keys(template)) {
                cooked[ key ] = cooked[ key ] || '-';
            }

            const output = {};
            Object.assign(output, cooked);

            output['url'] = '-' === cooked[ 'NVI' ] ? `${ path }` : `${ path }?nvi=${ cooked[ 'NVI' ] }`;

            output['index'] = i;

            return output;
        });

    };

    tableSelectionHandler(selectionList){
        return selectionList[ 0 ];
    };

}

export default ContactMapDatasource
