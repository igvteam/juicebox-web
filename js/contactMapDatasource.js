import { Alert } from '../node_modules/igv-ui/src/index.js'

const columns =
    [
        '-0-',
        '-1-',
        '-2-'
    ];

class ContactMapDatasource {

    constructor(path) {
        this.path = path;
    }

    async tableColumns() {
        return columns;
    }

    async tableData() {
        return fetchData(this.path);
    }
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
    const lines = data.split('\n').filter(line => "" !== line);
    return '';
};

export default ContactMapDatasource
