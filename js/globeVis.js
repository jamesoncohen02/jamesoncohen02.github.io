/* * * * * * * * * * * * * *
*         GLOBEVIS         *
* * * * * * * * * * * * * */

class GlobeVis {
    constructor(parentElement, trackData, geoData, selectedTrack){
        this.parentElement = parentElement;
        this.trackData = trackData;
        this.geoData = geoData;
        this.selectedTrack = null;

        this.initVis();
    }

    initVis(){
        let vis = this;

        console.log(vis.trackData);

        // Set up dimensions and margins
        vis.margin = { top: 40, right: 75, bottom: 40, left: 75 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

        // Create the SVG container
        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // Create the globe projection
        vis.projection = d3.geoMercator()
            .scale((vis.width - vis.margin.left - vis.margin.right) / (2 * 1.3 * Math.PI)) // Scale for Mercator
            .translate([vis.width / 2, vis.height / 2]); // Center the map

        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Add country features from GeoJSON
        vis.countriesGroup = vis.svg.append("g")
            .attr("class", "countries");

        vis.tracksGroup = vis.svg.append("g")
            .attr("class", "tracks");

        // Color scale for pit stop duration (Shades of blue)
        vis.colorScale = d3.scaleSequential(d3.interpolateBlues);

        // Size scale for pit stop duration
        vis.sizeScale = d3.scaleLinear().range([2, 11]);

        // Legend group
        vis.legendGroup = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.margin.left}, ${vis.height - 60})`);

        // Size legend group
        vis.sizeLegendGroup = vis.svg.append("g")
            .attr("class", "size-legend")
            .attr("transform", `translate(${vis.margin.left}, ${vis.height - 100})`);

        vis.svg.append("text")
            .attr("class", "legend-label")
            .attr("x", vis.margin.left + 75) // Center the label below both legends
            .attr("y", vis.height - 10) // Position it below the legends
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#333")
            .text("Average Pit Stop Time");

        // Tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        //Drop missing data
        vis.filteredData = vis.trackData.filter(d =>
            d.duration !== null && d.position !== null &&
            d.season !== null && d.track !== null &&
            d.year !== null && d.constructorName !== null &&
            !isNaN(+d.duration) && !isNaN(+d.position)
        );

        // Aggregate data: calculate average pit stop duration for each track
        vis.aggregatedData = Array.from(d3.group(vis.filteredData, d => d.circuitName), ([track, entries]) => {
            // Calculate average duration
            const avgDuration = d3.mean(entries, d => +d.duration);

            // Use lat/lng from the first entry in the group
            const { lat_race, lng_race } = entries[0];

            return {
                track: track,
                avgDuration: avgDuration,
                lat: +lat_race,
                lng: +lng_race
            };
        });

        console.log(vis.aggregatedData);

        // Update scales based on aggregated data
        const minDuration = d3.min(vis.aggregatedData, d => d.avgDuration);
        const maxDuration = d3.max(vis.aggregatedData, d => d.avgDuration);

        vis.colorScale.domain([minDuration, maxDuration]);
        vis.sizeScale.domain([minDuration, maxDuration]);

        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        // Sort the aggregated data by duration, ascending order
        vis.aggregatedData.sort((a, b) => b.avgDuration - a.avgDuration);

        // Draw countries
        const countries = vis.countriesGroup.selectAll(".country")
            .data(topojson.feature(vis.geoData, vis.geoData.objects.countries).features);

        countries.enter()
            .append("path")
            .attr("class", "country")
            .merge(countries)
            .attr("d", vis.path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#333");

        countries.exit().remove();

        // Draw tracks
        const tracks = vis.tracksGroup.selectAll(".track")
            .data(vis.aggregatedData);

        tracks.enter()
            .append("circle")
            .attr("class", "track")
            .merge(tracks)
            .attr("cx", d => vis.projection([d.lng, d.lat])[0])
            .attr("cy", d => vis.projection([d.lng, d.lat])[1])
            .attr("r", d =>
                vis.selectedTrack === d.track
                    ? vis.sizeScale(d.avgDuration) * 1.25 // Increase size for selected track
                    : vis.sizeScale(d.avgDuration) // Regular size based on average duration
            )
            .attr("fill", d =>
                vis.selectedTrack === null || vis.selectedTrack === d.track
                    ? vis.colorScale(d.avgDuration)
                    : "#d3d3d3" // Gray out other tracks
            )
            .attr("stroke", d => (vis.selectedTrack === d.track ? "orange" : "black")) // Highlight selected track
            .on("mouseover", function (event, d) {
                if (vis.selectedTrack !== d.track) {
                    vis.tooltip
                        .style("opacity", 1)
                        .html(`<strong>Track:</strong> ${d.track}<br><strong>Avg Pit Stop:</strong> ${d.avgDuration.toFixed(2)}s <br> Click <strong>track circle</strong> to filter!`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 15) + "px");
                }
            })
            .on("mouseout", function () {
                if (vis.selectedTrack === null) {
                    vis.tooltip.style("opacity", 0);
                }
            })
            .on("click", function (event, d) {
                // Toggle selection
                if (vis.selectedTrack === d.track) {
                    vis.selectedTrack = null; // Deselect
                    vis.tooltip.style("opacity", 0); // Hide tooltip
                } else {
                    vis.selectedTrack = d.track; // Select track
                    vis.tooltip
                        .style("opacity", 1)
                        .html(`<strong>Track:</strong> ${d.track}<br><strong>Avg Pit Stop:</strong> ${d.avgDuration.toFixed(2)}s  <br> <strong>Click to filter!</strong>`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 15) + "px");
                }

                // Update other visualizations
                updateTracks(vis.selectedTrack);
                vis.updateVis(); // Re-render to update highlight and size
            });

        tracks.exit().transition().duration(800).remove();

        // Add legend directly here
        const legendWidth = 150;
        const legendHeight = 10;

        // Clear existing legend
        vis.legendGroup.selectAll("*").remove();

        // Create a gradient for the legend
        const gradient = vis.legendGroup.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", vis.colorScale(d3.min(vis.aggregatedData, d => d.avgDuration)));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", vis.colorScale(d3.max(vis.aggregatedData, d => d.avgDuration)));

        // Draw the legend bar
        vis.legendGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        // Add legend axis
        const legendScale = d3.scaleLinear()
            .domain([d3.min(vis.aggregatedData, d => d.avgDuration), d3.max(vis.aggregatedData, d => d.avgDuration)])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(4)
            .tickSize(legendHeight);

        vis.legendGroup.append("g")
            .attr("class", "legend-axis")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis)
            .select(".domain").remove(); // Remove the axis line

        // SIZE LEGEND
        const sizeScaleDomain = vis.sizeScale.domain();
        const sizeLegendData = [
            Math.round(sizeScaleDomain[0]),
            Math.round((sizeScaleDomain[0] + sizeScaleDomain[1]) / 2),
            Math.round(sizeScaleDomain[1])
        ];

        // Clear existing size legend elements
        vis.sizeLegendGroup.selectAll(".size-legend-circle").remove();
        vis.sizeLegendGroup.selectAll(".size-legend-label").remove();

        // Add circles for size legend
        vis.sizeLegendGroup.selectAll(".size-legend-circle")
            .data(sizeLegendData)
            .enter()
            .append("circle")
            .attr("class", "size-legend-circle")
            .attr("cx", (d, i) => i * 75)
            .attr("cy", 0)
            .attr("r", d => vis.sizeScale(d))
            .attr("fill", d => vis.colorScale(d))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);

        // Add labels for size legend
        vis.sizeLegendGroup.selectAll(".size-legend-label")
            .data(sizeLegendData)
            .enter()
            .append("text")
            .attr("class", "size-legend-label")
            .attr("x", (d, i) => i * 75)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .text(d => `${d.toFixed(0)}s`)
            .style("font-size", "10px")
            .style("fill", "#333");
    }
}