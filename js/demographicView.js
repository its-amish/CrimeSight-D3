// function drawDemographics(data, state, palette) {
//   const svg = d3.select("#demographicChart");
//   svg.selectAll("*").remove();

//   const width = svg.node().clientWidth;
//   const height = svg.node().clientHeight;
//   const margin = { top: 20, right: 20, bottom: 55, left: 60 };

//   const bins = d3.bin()
//     .domain([0, 100])
//     .thresholds([0,10,20,30,40,50,60,70,80,90,100]);

//   const maleBins = bins(data
//     .filter(d => d.victimGender === "Male" && Number.isFinite(d.victimAge))
//     .map(d => d.victimAge));

//   const femaleBins = bins(data
//     .filter(d => d.victimGender === "Female" && Number.isFinite(d.victimAge))
//     .map(d => d.victimAge));

//   const x = d3.scaleBand()
//     .domain(maleBins.map(d => d.x0))
//     .range([margin.left, width - margin.right])
//     .padding(0.2);

//   const y = d3.scaleLinear()
//     .domain([0, d3.max([...maleBins, ...femaleBins], d => d.length) || 1])
//     .nice()
//     .range([height - margin.bottom, margin.top]);

//   // gridlines
//   svg.append("g")
//     .attr("transform", `translate(${margin.left},0)`)
//     .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""))
//     .selectAll("line")
//     .attr("stroke", "rgba(0,0,0,0.08)");

//   svg.selectAll(".male")
//     .data(maleBins)
//     .enter()
//     .append("rect")
//     .attr("x", d => x(d.x0))
//     .attr("y", d => y(d.length))
//     .attr("width", x.bandwidth() / 2)
//     .attr("height", d => height - margin.bottom - y(d.length))
//     .attr("fill", palette.Male)
//     .on("mousemove", (event, d) => {
//       const label = `${d.x0}–${d.x1}`;
//       window.app?.showTooltip(
//         `<div class="title">Age ${label}</div>` +
//         `<div><b>Male</b>: ${d.length}</div>`,
//         event
//       );
//     })
//     .on("mouseleave", () => window.app?.hideTooltip());

//   svg.selectAll(".female")
//     .data(femaleBins)
//     .enter()
//     .append("rect")
//     .attr("x", d => x(d.x0) + x.bandwidth() / 2)
//     .attr("y", d => y(d.length))
//     .attr("width", x.bandwidth() / 2)
//     .attr("height", d => height - margin.bottom - y(d.length))
//     .attr("fill", palette.Female)
//     .on("mousemove", (event, d) => {
//       const label = `${d.x0}–${d.x1}`;
//       window.app?.showTooltip(
//         `<div class="title">Age ${label}</div>` +
//         `<div><b>Female</b>: ${d.length}</div>`,
//         event
//       );
//     })
//     .on("mouseleave", () => window.app?.hideTooltip());

//   svg.append("g")
//     .attr("transform", `translate(0,${height - margin.bottom})`)
//     .call(d3.axisBottom(x).tickFormat(d => `${d}–${d + 10}`));

//   svg.append("g")
//     .attr("transform", `translate(${margin.left},0)`)
//     .call(d3.axisLeft(y));

//   // axis labels
//   svg.append("text")
//     .attr("x", width / 2)
//     .attr("y", height - 12)
//     .attr("text-anchor", "middle")
//     .attr("fill", "rgba(0,0,0,0.65)")
//     .attr("font-size", 12)
//     .text("Victim age (binned)");

//   svg.append("text")
//     .attr("x", margin.left)
//     .attr("y", margin.top - 6)
//     .attr("fill", "rgba(0,0,0,0.65)")
//     .attr("font-size", 12)
//     .text("Reports");

//   // legend
//   const legend = svg.append("g")
//     .attr("class", "legend")
//     .attr("transform", `translate(${width - margin.right - 140},${margin.top})`);

//   const items = [
//     { key: "Male", color: palette.Male },
//     { key: "Female", color: palette.Female },
//   ];

//   const legendItems = legend.selectAll("g")
//     .data(items)
//     .enter()
//     .append("g")
//     .attr("class", "item")
//     .attr("transform", (d, i) => `translate(0,${i * 18})`);

//   legendItems.append("rect")
//     .attr("x", 0)
//     .attr("y", -10)
//     .attr("width", 12)
//     .attr("height", 12)
//     .attr("fill", d => d.color);

//   legendItems.append("text")
//     .attr("x", 18)
//     .attr("y", 0)
//     .attr("dominant-baseline", "middle")
//     .attr("fill", "rgba(0,0,0,0.75)")
//     .text(d => d.key);
// }


function drawDemographics(data, state, palette) {
  const svg = d3.select("#demographicChart");
  svg.selectAll("*").remove();

  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const margin = { top: 20, right: 50, bottom: 50, left: 50 }; // Increased right margin for secondary axis

  // -------------------------------------------------------
  // PART 1: POPULATION PYRAMID (Existing Logic)
  // -------------------------------------------------------
  const bins = d3.bin()
    .domain([0, 100])
    .thresholds([0,10,20,30,40,50,60,70,80,90,100]);

  const maleBins = bins(data
    .filter(d => d.victimGender === "Male" && Number.isFinite(d.victimAge))
    .map(d => d.victimAge));

  const femaleBins = bins(data
    .filter(d => d.victimGender === "Female" && Number.isFinite(d.victimAge))
    .map(d => d.victimAge));

  // Y-axis for Age Groups
  const y = d3.scaleBand()
    .domain(maleBins.map(d => `${d.x0}-${d.x1}`))
    .range([height - margin.bottom, margin.top])
    .padding(0.1);

  // X-axis for Counts (Diverging)
  const maxCount = d3.max([...maleBins, ...femaleBins], d => d.length) || 1;
  const xLeft = d3.scaleLinear().domain([0, maxCount]).range([width/2, margin.left]); // Male goes Left
  const xRight = d3.scaleLinear().domain([0, maxCount]).range([width/2, width - margin.right]); // Female goes Right

  // Draw Male Bars
  svg.selectAll(".male")
    .data(maleBins)
    .enter().append("rect")
    .attr("x", d => xLeft(d.length))
    .attr("y", d => y(`${d.x0}-${d.x1}`))
    .attr("width", d => width/2 - xLeft(d.length))
    .attr("height", y.bandwidth())
    .attr("fill", palette.Male)
    .attr("opacity", 0.8);

  // Draw Female Bars
  svg.selectAll(".female")
    .data(femaleBins)
    .enter().append("rect")
    .attr("x", width/2)
    .attr("y", d => y(`${d.x0}-${d.x1}`))
    .attr("width", d => xRight(d.length) - width/2)
    .attr("height", y.bandwidth())
    .attr("fill", palette.Female)
    .attr("opacity", 0.8);

  // -------------------------------------------------------
  // PART 2: TREND LINE OVERLAY (Merged from your snippet)
  // -------------------------------------------------------
  // Rollup data by Year for the trend line
  const yearly = d3.rollups(data, v => v.length, d => d.year)
    .filter(([yr]) => yr !== null)
    .sort((a, b) => a[0] - b[0]);

  if (yearly.length > 1) {
    // Secondary X-axis for Years (at the bottom)
    const xTime = d3.scaleLinear()
      .domain(d3.extent(yearly, d => d[0]))
      .range([margin.left, width - margin.right]);

    // Secondary Y-axis for Total Counts (Overlay)
    const yCount = d3.scaleLinear()
      .domain([0, d3.max(yearly, d => d[1]) * 1.2]) // Add headroom
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => xTime(d[0]))
      .y(d => yCount(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw Trend Line
    svg.append("path")
      .datum(yearly)
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5") // Dashed line to distinguish from bars
      .attr("d", line);

    // Add dots for years
    svg.selectAll(".trend-dot")
      .data(yearly)
      .enter().append("circle")
      .attr("cx", d => xTime(d[0]))
      .attr("cy", d => yCount(d[1]))
      .attr("r", 4)
      .attr("fill", "#333");
  }

  // -------------------------------------------------------
  // AXES & LABELS
  // -------------------------------------------------------
  // Middle Axis line
  svg.append("line")
    .attr("x1", width/2).attr("x2", width/2)
    .attr("y1", margin.top).attr("y2", height - margin.bottom)
    .attr("stroke", "#999");

  // Age Labels (Center)
  svg.append("g")
    .selectAll("text")
    .data(maleBins)
    .enter().append("text")
    .attr("x", width/2)
    .attr("y", d => y(`${d.x0}-${d.x1}`) + y.bandwidth()/2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .attr("font-size", "10px")
    .style("pointer-events", "none") // Let clicks pass through
    .text(d => `${d.x0}-${d.x1}`);

  // Labels
  svg.append("text").attr("x", width/4).attr("y", margin.top - 5).text("MALE").attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", "bold").attr("fill", palette.Male);
  svg.append("text").attr("x", 3*width/4).attr("y", margin.top - 5).text("FEMALE").attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", "bold").attr("fill", palette.Female);
  svg.append("text").attr("x", width/2).attr("y", height - 10).text("Dashed Line: Yearly Trend (All Genders)").attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "#333");
}