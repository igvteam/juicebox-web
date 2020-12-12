
const urlPrefix = 'https://www.encodeproject.org'

const encodeContactMapDatasourceConfiguration =
    {
        url: 'https://s3.amazonaws.com/igv.org.app/encode/hic/hic.txt',
        columns:
            [
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
        parser: { parse: encodeParser}
    }

function encodeParser(str) {

    const lines = str.split('\n').filter(line => "" !== line);

    // Discard first line. Column name descriptions.
    lines.shift()

    return lines.map((line, index) => {

        const values = line.split('\t')

        const obj = {}
        const { columns } = encodeContactMapDatasourceConfiguration
        for (let column of columns) {
            obj[ column ] = values[ columns.indexOf(column) ]
        }

        obj[ 'HREF' ] = `${ urlPrefix }${ obj[ 'HREF' ] }`

        return obj
    });

}

export { encodeContactMapDatasourceConfiguration }
