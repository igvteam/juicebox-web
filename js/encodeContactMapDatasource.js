import { Alert } from '../node_modules/igv-ui/src/index.js'

let columns = undefined;

const urlPrefix = 'https://www.encodeproject.org';

class EncodeContactMapDatasource {

    constructor($encodeHostedModalPresentationButton, genomeId) {

        this.$encodeHostedModalPresentationButton = $encodeHostedModalPresentationButton;

        this.$encodeHostedModalPresentationButton.removeClass('disabled');

        this.genomeId = genomeId;
        // this.path = `https://s3.amazonaws.com/igv.org.app/encode/hic/${ genomeId }.txt`;
        this.path = 'https://s3.amazonaws.com/igv.org.app/encode/hic/hic.txt';

        this.columnDefs =
            [
                {
                    targets: [ 0 ], // Hide index
                    visible: false,
                    searchable: false
                },
                {
                    targets: [ 5 ], // Hide HREF (URL)
                    visible: false,
                    searchable: false
                }

            ];

    }
    async tableColumns() {
        return columns;
    }

    async tableData() {

        let response = undefined;

        try {
            response = await fetch(this.path);
        } catch (e) {
            this.$encodeHostedModalPresentationButton.addClass('disabled');
            Alert.presentAlert(`Unsupported assembly: ${ this.genomeId }`);
            return undefined;
        }

        if (response) {
            const str = await response.text();
            const parsed = parseData(str);
            return parsed;
        }
    }

    tableSelectionHandler(selectionList){

        const obj = selectionList[ 0 ];

        // url
        let url = obj[ columns[ 6 ] ];
        url = `${ urlPrefix }${ url }`;

        // name
        const name  = obj[ columns[ 4 ] ];

        return { url, name }
    };

}

const parseData = str => {

    const lines = str.split('\n').filter(line => "" !== line);

    columns = lines.shift().split('\t');
    columns.unshift('index');

    return lines.map((line, index) => {

        const values = line.split('\t');
        values.unshift(index)

        const obj = {};
        for (let key of columns) {
            obj[ key ] = values[ columns.indexOf(key) ]
            // obj[ key ] = '#%#'
        }

        return obj;
    });

};

export default EncodeContactMapDatasource
