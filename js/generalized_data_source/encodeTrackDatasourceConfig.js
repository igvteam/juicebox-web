const discard = 'ID Assembly Biosample AssayType Target BioRep TechRep OutputType Format Lab HREF Accession Experiment'

const encodeHostedTrackDatasourceConfigurator = genomeId => {

    const config =
        {
            isJSON: false,
            genomeId,
            dataSetPathPrefix: 'https://www.encodeproject.org',
            urlPrefix: 'https://s3.amazonaws.com/igv.org.app/encode/',
            addIndexColumn: false,
            columns:
                [
                    'ID',           // hide
                    'Assembly',     // hide
                    'Biosample',
                    'AssayType',
                    'Target',
                    'BioRep',
                    'TechRep',
                    'OutputType',
                    'Format',
                    'Lab',
                    'HREF',         // hide
                    'Accession',
                    'Experiment'
                ],
            hiddenColumns:
                [
                    'ID',
                    'Assembly',
                    'HREF'
                ],
                selectionHandler: selectionList => {
                        return selectionList.map(({ name, HREF }) => {
                                return { name, url: HREF }
                        })
                }

        }

        return config
}

export { encodeHostedTrackDatasourceConfigurator }
