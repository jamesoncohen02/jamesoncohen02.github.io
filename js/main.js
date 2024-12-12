/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables, switches, helper functions
let barChart,
    scatterplot,
    globeVis;

let slider;

function updateAllVisualizations(){
    barChart.wrangleData()
    globeVis.wrangleData()
    scatterplot.wrangleData()
}

//constructor name mapping for teams that have had name changes in the data
const constructorNameMapping = {
    'Manor Marussia': 'Marussia',
    'Marussia': 'Marussia',
    'Sauber': 'Alfa Romeo',
    'Alfa Romeo': 'Alfa Romeo',
    'Haas F1 Team': 'Haas',
    'Racing Point': 'Aston Martin',
    'Williams': 'Williams',
    'Toro Rosso': 'AlphaTauri',
    'AlphaTauri': 'AlphaTauri',
    'Aston Martin': 'Aston Martin',
    'McLaren': 'McLaren',
    'Force India': 'Racing Point',
    'Mercedes': 'Mercedes',
    'Alpine F1 Team': 'Alpine',
    'Ferrari': 'Ferrari',
    'Renault': 'Alpine',
    'Red Bull': 'Red Bull',
    'RB F1 Team': 'Red Bull',
    'Lotus F1': 'Lotus',
    'Caterham': 'Caterham'
};

// Normalize constructor names
function normalizeConstructorNames(data) {
    return data.map(d => {
        d.constructorName = constructorNameMapping[d.constructorName] || d.constructorName;
        return d;
    });
}

// load data using promises
let promises = [
    d3.csv("data/results_pitstops.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );



// initMainPage
function initMainPage(allDataArray) {

    allDataArray[0] = normalizeConstructorNames(allDataArray[0]);

    //color mapping for visuzliation (derived from https://www.kaggle.com/code/kevinkwan/formula-1-pit-stops-analysis)
    const constructorColorMap = {
        'Toro Rosso': '#0000FF',
        'Mercedes': '#6CD3BF',
        'Red Bull': '#1E5BC6',
        'Ferrari': '#ED1C24',
        'Williams': '#37BEDD',
        'Force India': '#FF80C7',
        'Virgin': '#c82e37',
        'Renault': '#FFD800',
        'McLaren': '#F58020',
        'Sauber': '#006EFF',
        'Lotus': '#FFB800',
        'HRT': '#b2945e',
        'Caterham': '#0b361f',
        'Lotus F1': '#FFB800',
        'Marussia': '#6E0000',
        'Manor Marussia': '#6E0000',
        'Haas F1 Team': '#B6BABD',
        'Racing Point': '#F596C8',
        'Aston Martin': '#2D826D',
        'Alfa Romeo': '#B12039',
        'AlphaTauri': '#4E7C9B',
        'Alpine F1 Team': '#2293D1'
    };

    barChart = new BarChart("barchart", allDataArray[0], constructorColorMap);

    scatterplot = new ScatterPlot("scatterplot", allDataArray[0], constructorColorMap);

    globeVis = new  GlobeVis("globeVis", allDataArray[0], allDataArray[1]);

    createSlider(allDataArray[0]);
}

function updateTracks(selectedTrack = null, selectedConstructor = null) {
    barChart.wrangleData(selectedTrack);
    scatterplot.wrangleData(selectedTrack, selectedConstructor);

    if (!selectedTrack && !selectedConstructor) {
        barChart.selectedTrack = null;
        barChart.selectedConstructor = null;
        barChart.wrangleData();

        scatterplot.selectedTrack = null;
        scatterplot.selectedConstructor = null;
        scatterplot.wrangleData();
    }
}

function createSlider(data) {
    // Determine the minimum and maximum years in the data
    let minYear = d3.min(data, d => +d.year);
    let maxYear = d3.max(data, d => +d.year);

    // Select the slider div
    slider = document.getElementById("time-period-slider");

    // Initialize noUiSlider
    noUiSlider.create(slider, {
        start: [minYear, maxYear],
        connect: true,
        step: 1,
        range: {
            'min': minYear,
            'max': maxYear
        },
        behaviour: 'drag',
        tooltips: false,
        format: {
            to: value => Math.round(value),
            from: value => Math.round(value)
        }
    });

    const startLabel = document.createElement('div');
    startLabel.className = 'slider-label start-label';
    slider.appendChild(startLabel);

    const endLabel = document.createElement('div');
    endLabel.className = 'slider-label end-label';
    slider.appendChild(endLabel);

    // Event listener to filter data when the slider is moved
    slider.noUiSlider.on('update', function(values) {
        const [startYear, endYear] = values.map(v => +v);

        startLabel.textContent = startYear;
        endLabel.textContent = endYear;
        // Filter data by year range
        const filteredData = data.filter(d => {
            const year = +d.year;
            return year >= startYear && year <= endYear;
        });

        // Update visualizations with filtered data
        barChart.data = filteredData;
        scatterplot.data = filteredData;
        globeVis.trackData = filteredData;

        barChart.wrangleData();
        scatterplot.wrangleData();
        globeVis.wrangleData();
    });
}
