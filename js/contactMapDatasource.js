import { Alert } from '../node_modules/igv-ui/src/index.js'

const columns =
    [
        '-0-',
        '-1-',
        '-2-',
        'url'
    ];

class ContactMapDatasource {

    constructor(path) {

        this.path = path;

        this.columnDefs =
            [
                {
                    targets: [ 3 ], // hide url column
                    visible: false,
                    searchable: false
                }
            ];

    }

    async tableColumns() {
        return columns;
    }

    async tableData() {
        return fetchData(this.path);
    }

    tableSelectionHandler(selectionList){

        const obj = selectionList.shift();
        const url   = obj[ columns[ 3 ] ];
        const name  = obj[ columns[ 0 ] ];
        return { url, name }
    };

}

const fetchData = async path => {

    let response = undefined;
    try {
        response = await fetch(path);
    } catch (e) {
        Alert.presentAlert(e.message);
        return undefined;
    }

    if (response) {
        const data = await response.text();
        return parseData(data);
    } else {
        return undefined;
    }
};

const parseData = data => {

    const regex = /[ \t]+/;

    let lines = data.split('\n').filter(line => "" !== line);
    // lines.unshift('../node_modules/igv-ui/src/index.js A || B', '../node_modules/igv-ui/src/index.js A | B | C | D | E');

    return lines.map(line => {

        const list = line.split(regex);
        const path = list.shift();

        const string = list.join(' ');
        let parts = string.split('|').map(part => part.trim());

        const obj = {};
        switch (parts.length) {

            case 1:
            {
                obj[ columns[ 0 ] ] = parts[ 0 ];
                obj[ columns[ 1 ] ] = '-';
                obj[ columns[ 2 ] ] = '-';
                obj[ columns[ 3 ] ] = path;
                return obj;
            }

            case 2:
            {
                obj[ columns[ 0 ] ] = parts[ 0 ];
                obj[ columns[ 1 ] ] = parts[ 1 ];
                obj[ columns[ 2 ] ] = '-';
                obj[ columns[ 3 ] ] = path;
                return obj;
            }

            case 3:
            {
                obj[ columns[ 0 ] ] = parts[ 0 ];
                obj[ columns[ 1 ] ] = parts[ 1 ];
                obj[ columns[ 2 ] ] = parts[ 2 ];
                obj[ columns[ 3 ] ] = path;
                return obj;
            }

            default:
                if (parts.length > 3) {
                    obj[ columns[ 0 ] ] = parts[ 0 ];
                    obj[ columns[ 1 ] ] = parts[ 1 ];

                    parts.shift(); // discard
                    parts.shift(); // discard
                    obj[ columns[ 2 ] ] = parts.join('|');

                    obj[ columns[ 3 ] ] = path;

                }

        } // switch()

    });

};

export default ContactMapDatasource
