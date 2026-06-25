function drawScatter(data, state, palette) {
  const svg = d3.select("#scatterChart");
  svg.selectAll("*").remove();

  const filtered = data.filter(d =>
    d.daysToClose !== null &&
    Number.isFinite(d.daysToClose) &&
    Number.isFinite(d.policeDeployed)
  );

  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  const margin = { top: 20, right: 20, bottom: 55, left: 60 };

  const domainKeys = ["Violent", "Property", "Cyber", "Other"];
  const domainKey = (d) => domainKeys.includes(d.crimeDomain) ? d.crimeDomain : "Other";

  const color = d3.scaleOrdinal()
    .domain(domainKeys)
    .range(domainKeys.map(k => palette[k] || palette.Other));

  const xExtent = d3.extent(filtered, d => d.policeDeployed);
  const x = d3.scaleLinear()
    .domain((xExtent[0] == null || xExtent[1] == null) ? [0, 1] : xExtent)
    .nice()
    .range([margin.left, width - margin.right]);

  const yExtent = d3.extent(filtered, d => d.daysToClose);
  const y = d3.scaleLinear()
    .domain((yExtent[0] == null || yExtent[1] == null) ? [0, 1] : yExtent)
    .nice()
    .range([height - margin.bottom, margin.top]);

  // gridlines
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""))
    .selectAll("line")
    .attr("stroke", "rgba(0,0,0,0.08)");

  svg.selectAll("circle")
    .data(filtered)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.policeDeployed))
    .attr("cy", d => y(d.daysToClose))
    .attr("r", 5)
    .attr("opacity", d => (state.domain !== "All" && domainKey(d) !== state.domain) ? 0.18 : 0.75)
    .attr("fill", d => color(domainKey(d)))
    .style("cursor", "default")
    .on("mousemove", (event, d) => {
      const title = d["Crime Description"] || "Report";
      const city = d.City || "";
      const dom = domainKey(d);
      window.app?.showTooltip(
        `<div class="title">${title}</div>` +
        `<div class="muted">${city}${city ? " • " : ""}${dom}</div>` +
        `<div><b>Police deployed</b>: ${d.policeDeployed}</div>` +
        `<div><b>Days to close</b>: ${d.daysToClose.toFixed(1)}</div>`,
        event
      );
    })
    .on("mouseleave", () => window.app?.hideTooltip());

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(0,0,0,0.65)")
    .attr("font-size", 12)
    .text("Police deployed");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(0,0,0,0.65)")
    .attr("font-size", 12)
    .text("Days to close (closed cases)");

  // legend (click toggles shared domain filter)
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right - 140},${margin.top})`);

  const legendItems = legend.selectAll("g")
    .data(domainKeys)
    .enter()
    .append("g")
    .attr("class", d => `item${(state.domain !== "All" && state.domain !== d) ? " inactive" : ""}`)
    .attr("transform", (d, i) => `translate(0,${i * 18})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => window.app?.toggleDomain(d));

  legendItems.append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", d => color(d));

  legendItems.append("text")
    .attr("x", 18)
    .attr("y", 0)
    .attr("dominant-baseline", "middle")
    .attr("fill", "rgba(0,0,0,0.75)")
    .text(d => d);
}
