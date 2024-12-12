/* * * * * * * * * * * * * *
*        SCATTERPLOT       *
* * * * * * * * * * * * * */

class ScatterPlot {
    constructor(parentElement, data, colorMap) {
        this.parentElement = parentElement;
        this.data = data;
        this.colorMap = colorMap;
        this.filteredData = data;
        this.selectedTrack = null;
        this.selectedConstructor = null;


        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up dimensions and margins
        vis.margin = { top: 5, right: 30, bottom: 52, left: 70 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 275 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Create scales
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Axes groups
        vis.xAxisGroup = vis.svg.append("g")
            .attr("transform", `translate(0, ${vis.height})`);
        vis.yAxisGroup = vis.svg.append("g");

        // Add axis labels
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + vis.margin.bottom - 20)
            .text("Average Pit Stop Time");

        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-vis.margin.left + 40}, ${vis.height / 2}) rotate(-90)`)
            .text("Finishing Position");

        // Tooltip for displaying details
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Wrangle data and render visualization
        vis.wrangleData();
    }

    wrangleData(selectedTrack=null, selectedConstructor=null) {
        let vis = this;

        // Preserve the current selection if no new selection is provided
        if (selectedTrack === null) {
            selectedTrack = vis.selectedTrack;
        } else {
            vis.selectedTrack = selectedTrack; // Update selected track
        }

        if (selectedConstructor === null) {
            vis.selectedConstructor = null; // Clear constructor filter
        } else {
            vis.selectedConstructor = selectedConstructor; // Update selected constructor
        }

        //Drop missing data
        vis.filteredData = vis.data.filter(d =>
            d.duration !== null && d.position !== null &&
            d.season !== null && d.track !== null &&
            d.year !== null && d.constructorName !== null &&
            !isNaN(+d.duration) && !isNaN(+d.position)
        );

        vis.filteredData = vis.filteredData.filter(d =>
            (!selectedTrack || d.circuitName === selectedTrack) &&
            (!selectedConstructor || d.constructorName === selectedConstructor)
        );

        // Group and aggregate data: average pit stop time for each season/track/year/constructor
        vis.aggregatedData = Array.from(
            d3.group(
                vis.filteredData,
                d => `${d.year}_${d.circuitName}_${d.constructorName}` // Unique key for grouping
            ),
            ([key, values]) => {
                // Calculate the average pit stop time
                const avgPitStopTime = d3.mean(values, d => +d.duration);

                // Use the finishing position from the first entry (should be consistent per group)
                const finishingPosition = +values[0].positionOrder;

                if (avgPitStopTime != 0) {
                    return {
                        key,
                        avgPitStopTime,
                        finishingPosition,
                        constructor: values[0].constructorName, // Constructor name
                        track: values[0].circuitName, // Track name
                        year: values[0].year // Year
                    };
                } else{
                    return null;
                }
            }
        ).filter(d => d !== null);

        // Update scales based on aggregated data
        vis.xScale.domain([0, d3.max(vis.aggregatedData, d => d.avgPitStopTime) + 1]); // Add padding
        vis.yScale.domain([0, d3.max(vis.aggregatedData, d => d.finishingPosition) + 1]); // Add padding

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Bind data to circles
        const circles = vis.svg.selectAll(".dot")
            .data(vis.aggregatedData, d => d.key); // Use the unique group key

        // Enter phase
        circles.enter()
            .append("circle")
            .attr("class", "dot")
            .merge(circles)
            .on("mouseover", function(event, d) {
                vis.tooltip
                    .style("opacity", 1)
                    .html(`<strong>Constructor:</strong> ${d.constructor}<br>
               <strong>Track:</strong> ${d.track}<br>
               <strong>Year:</strong> ${d.year}<br>
               <strong>Avg Pit Stop:</strong> ${d.avgPitStopTime.toFixed(2)}s<br>
               <strong>Position:</strong> ${d.finishingPosition}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 70) + "px"); // Adjust this value as needed
            })
            .on("mouseout", function () {
                vis.tooltip.style("opacity", 0);
            })
            .transition()
            .duration(800)
            .attr("cx", d => vis.xScale(d.avgPitStopTime))
            .attr("cy", d => vis.yScale(d.finishingPosition))
            .attr("r", 3)
            .attr("fill", d => vis.colorMap[d.constructor] || "gray")
            .attr("stroke", "none");

        // Exit phase
        circles.exit()
            .transition()
            .duration(800)
            .attr("r", 0) // Shrink to zero radius
            .remove();

        // Update axes
        vis.xAxisGroup.transition().duration(800).call(d3.axisBottom(vis.xScale).ticks(5).tickFormat(d => `${d.toFixed(1)}s`)); // Format x-axis in seconds
        vis.yAxisGroup.transition().duration(800).call(d3.axisLeft(vis.yScale).ticks(5));
    }
}