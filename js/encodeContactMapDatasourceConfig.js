
const encodeContactMapDatasourceConfigurator = genomeId => {

    const urlPrefix = 'https://www.encodeproject.org';

    return {
        isJSON: false,
        genomeId,
        dataSetPathPrefix: undefined,
        urlPrefix,
        dataSetPath: 'https://s3.amazonaws.com/igv.org.app/encode/hic/hic.txt',
        addIndexColumn: true,
        columns:
            [
                'index',
                'HREF',
                'Assembly',
                'Biosample',
                'Description',
                'BioRep',
                'TechRep',
                'Lab',
                'Accession',
                'Experiment'
            ],
        hiddenColumns:
            [
                'index',
                'HREF'
            ],
        parser,
        selectionHandler: selectionList => {
            const list =  selectionList.map(({ HREF, Description }) => { return { url: `${ urlPrefix }${ HREF }`, name: Description } })
            return list[ 0 ]
        }
    }

}

const parser = (str, columnDictionary, addIndexColumn) => {

    const lines = str.split('\n').filter(line => "" !== line);

    // Discard first line. Column name descriptions.
    lines.shift();

    const keys = Object.keys(columnDictionary);

    return lines.map((line, index) => {

        const values = line.split('\t');

        if (true === addIndexColumn) {
            values.unshift(index)
        }

        const obj = {};
        for (let key of keys) {
            obj[key] = values[ keys.indexOf(key) ]
        }

        return obj;
    });

};

export { encodeContactMapDatasourceConfigurator }
