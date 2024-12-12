/* * * * * * * * * * * * * *
*         BARCHART         *
* * * * * * * * * * * * * */

class BarChart {
    constructor(parentElement, data, colorMap) {
        this.parentElement = parentElement;
        this.data = data;
        this.colorMap = colorMap;
        this.selectedConstructor = null;
        this.selectedTrack = null;
        this.filteredData = data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Default options
        vis.margin = { top: 5, right: 30, bottom: 52, left: 70 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 275 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Create scales and axes
        vis.xScale = d3.scaleLinear();
        vis.yScale = d3.scaleBand().padding(0.1);

        vis.xAxisGroup = vis.svg.append("g")
            .attr("transform", `translate(0, ${vis.height})`); // Positioned at the bottom

        vis.yAxisGroup = vis.svg.append("g");

        // Add axis labels
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.margin.bottom - 20)
            .text("Average Pit Stop Time");

        // Add tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0); // Initially hidden

        // Wrangle data and render the visualization
        vis.wrangleData();
    }

    wrangleData(selectedTrack=null) {
        let vis = this;

        if (selectedTrack !== null) {
            vis.selectedTrack = selectedTrack; // Update selected track if passed
        }

        //Drop missing data
        vis.filteredData = vis.data.filter(d =>
            d.duration !== null && d.position !== null &&
            d.season !== null && d.track !== null &&
            d.year !== null && d.constructorName !== null &&
            !isNaN(+d.duration) && !isNaN(+d.position)
        );

        if (vis.selectedTrack) {
            vis.filteredData = vis.filteredData.filter(d => d.circuitName === vis.selectedTrack);
        }

        // Convert data into key-value pairs (e.g., circuit -> average duration)
        vis.processedData = Array.from(
            d3.rollup(vis.filteredData, v => d3.mean(v, d => +d.duration), d => d.constructorName),
            ([key, value]) => ({ key, value })
        );

        vis.processedData.sort((a, b) => b.value - a.value);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Update scales
        vis.xScale.domain([0, d3.max(vis.processedData, d => d.value)]).range([0, vis.width]);
        vis.yScale.domain(vis.processedData.map(d => d.key)).range([0, vis.height]);

        // Update axes
        vis.xAxisGroup.transition().duration(800).call(d3.axisBottom(vis.xScale).ticks(5).tickFormat(d => `${d.toFixed(1)}s`));
        vis.yAxisGroup.transition().duration(800).call(d3.axisLeft(vis.yScale));

        // Bind data to bars
        const bars = vis.svg.selectAll(".bar").data(vis.processedData, d => d.key);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .on("mouseover", function (event, d) {
                // Show tooltip on hover if the bar is not currently selected
                if (vis.selectedConstructor !== d.key) {
                    vis.tooltip
                        .style("opacity", 1)
                        .html(`<strong>Constructor:</strong> ${d.key}<br><strong>Avg Pit Stop:</strong> ${d.value.toFixed(2)}s <br> Click <strong>bar</strong> to filter!`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 15) + "px");
                }
            })
            .on("mouseout", function () {
                // Hide tooltip if no bar is selected
                if (vis.selectedConstructor === null) {
                    vis.tooltip.style("opacity", 0);
                }
            })
            .on("click", function (event, d) {
                // Toggle constructor selection
                vis.selectedConstructor = vis.selectedConstructor === d.key ? null : d.key;

                // Update scatterplot while preserving track filtering
                updateTracks(vis.selectedTrack, vis.selectedConstructor);

                // Keep tooltip visible for the selected constructor
                if (vis.selectedConstructor) {
                    vis.tooltip
                        .style("opacity", 1)
                        .html(`<strong>Constructor:</strong> ${d.key}<br><strong>Avg Pit Stop:</strong> ${d.value.toFixed(2)}s <br> <strong>Click to filter!</strong>`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 15) + "px");
                } else {
                    vis.tooltip.style("opacity", 0); // Hide tooltip if deselected
                }

                vis.updateVis();
            })
            .transition()
            .duration(800)
            .attr("x", 0)
            .attr("y", d => vis.yScale(d.key))
            .attr("width", d => vis.xScale(d.value))
            .attr("height", vis.yScale.bandwidth())
            .attr("fill", d =>
                vis.selectedConstructor === null || vis.selectedConstructor === d.key
                    ? vis.colorMap[d.key] || "gray"
                    : "#d3d3d3"
            );

        bars.exit()
            .transition()
            .duration(800)
            .attr("width", 0)
            .remove();
    }
}