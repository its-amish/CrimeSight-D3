let _indiaPromise = null;
let _renderToken = 0;

function drawMap(data, state, palette) {
  const mapSvg = d3.select("#mapChart");
  const heatSvg = d3.select("#heatmapChart");
  mapSvg.selectAll("*").remove();
  heatSvg.selectAll("*").remove();

  const thisToken = ++_renderToken;

  // 29-city lookup (lon, lat). Source: common city coordinates (approx.).
  const cityCoords = {
    Ahmedabad: [72.5714, 23.0225],
    Agra: [78.0081, 27.1767],
    Bangalore: [77.5946, 12.9716],
    Bhopal: [77.4126, 23.2599],
    Chennai: [80.2707, 13.0827],
    Delhi: [77.1025, 28.7041],
    Faridabad: [77.3070, 28.4089],
    Ghaziabad: [77.4538, 28.6692],
    Hyderabad: [78.4867, 17.3850],
    Indore: [75.8577, 22.7196],
    Jaipur: [75.7873, 26.9124],
    Kalyan: [73.1305, 19.2437],
    Kanpur: [80.3319, 26.4499],
    Kolkata: [88.3639, 22.5726],
    Lucknow: [80.9462, 26.8467],
    Ludhiana: [75.8573, 30.9010],
    Meerut: [77.7064, 28.9845],
    Mumbai: [72.8777, 19.0760],
    Nagpur: [79.0882, 21.1458],
    Nashik: [73.7898, 19.9975],
    Patna: [85.1376, 25.5941],
    Pune: [73.8567, 18.5204],
    Rajkot: [70.8022, 22.3039],
    Srinagar: [74.7973, 34.0837],
    Surat: [72.8311, 21.1702],
    Thane: [72.9781, 19.2183],
    Varanasi: [82.9739, 25.3176],
    Vasai: [72.8397, 19.3919],
    Visakhapatnam: [83.2185, 17.6868],
  };

  const cityCounts = d3.rollups(
    data,
    v => v.length,
    d => d.City
  ).map(([City, count]) => {
    const coord = cityCoords[City];
    return {
      City,
      count,
      lon: coord ? coord[0] : null,
      lat: coord ? coord[1] : null,
    };
  });

  // -------------------- INDIA SYMBOL MAP --------------------
  const mapWidth = mapSvg.node().clientWidth;
  const mapHeight = mapSvg.node().clientHeight;
  const mapMargin = { top: 10, right: 10, bottom: 10, left: 10 };

  const domainColor = state.domain !== "All" ? (palette[state.domain] || palette.Other) : palette.Property;

  const validCities = cityCounts.filter(d => Number.isFinite(d.lon) && Number.isFinite(d.lat));
  const missingCount = cityCounts.length - validCities.length;

  const r = d3.scaleSqrt()
    .domain([0, d3.max(validCities, d => d.count) || 1])
    .range([0, 22]);

  if (!_indiaPromise) {
    _indiaPromise = d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  }

  _indiaPromise.then(world => {
    if (thisToken !== _renderToken) return;

    const countries = topojson.feature(world, world.objects.countries);
    const india = countries.features.find(f => String(f.id) === "356"); // ISO numeric for India
    if (!india) {
      mapSvg.append("text")
        .attr("x", 12)
        .attr("y", 20)
        .attr("fill", "rgba(0,0,0,0.7)")
        .attr("font-size", 12)
        .text("India boundary not found in basemap.");
      return;
    }

    const projection = d3.geoMercator();
    projection.fitSize([mapWidth - mapMargin.left - mapMargin.right, mapHeight - mapMargin.top - mapMargin.bottom], india);

    const path = d3.geoPath(projection);

    mapSvg.append("path")
      .datum(india)
      .attr("d", path)
      .attr("fill", "rgba(0,0,0,0.04)")
      .attr("stroke", "rgba(0,0,0,0.18)")
      .attr("stroke-width", 1);

    const pts = validCities.map(d => {
      const [x, y] = projection([d.lon, d.lat]);
      return { ...d, x, y };
    });

    const g = mapSvg.append("g");

    g.selectAll("circle")
      .data(pts)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => r(d.count))
      .attr("fill", domainColor)
      .attr("fill-opacity", 0.55)
      .attr("stroke", d => (state.city !== "All" && state.city === d.City) ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.25)")
      .attr("stroke-width", d => (state.city !== "All" && state.city === d.City) ? 2 : 1)
      .style("cursor", "pointer")
      .on("mousemove", (event, d) => {
        window.app?.showTooltip(
          `<div class="title">${d.City}</div>` +
          `<div><b>Reports</b>: ${d.count}</div>` +
          `<div class="muted">Click to toggle city filter</div>`,
          event
        );
      })
      .on("mouseleave", () => window.app?.hideTooltip())
      .on("click", (event, d) => window.app?.toggleCity(d.City));

    // subtle note about missing coords
    if (missingCount > 0) {
      mapSvg.append("text")
        .attr("x", 10)
        .attr("y", mapHeight - 10)
        .attr("fill", "rgba(0,0,0,0.55)")
        .attr("font-size", 11)
        .text(`${missingCount} cities missing coordinates`);
    }
  });

  // -------------------- TIME HEATMAP (weekday × hour) --------------------
  const heatWidth = heatSvg.node().clientWidth;
  const heatHeight = heatSvg.node().clientHeight;
  const margin = { top: 10, right: 10, bottom: 35, left: 55 };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = d3.range(0, 24);

  const heatData = [];
  const counts = d3.rollup(
    data.filter(d => Number.isFinite(d.hour) && Number.isFinite(d.weekday)),
    v => v.length,
    d => d.weekday,
    d => d.hour
  );

  for (let wd = 0; wd < 7; wd++) {
    for (let h = 0; h < 24; h++) {
      heatData.push({
        weekday: wd,
        hour: h,
        count: counts.get(wd)?.get(h) || 0,
      });
    }
  }

  const x = d3.scaleBand()
    .domain(hours)
    .range([margin.left, heatWidth - margin.right])
    .padding(0.05);

  const y = d3.scaleBand()
    .domain(d3.range(0, 7))
    .range([margin.top, heatHeight - margin.bottom])
    .padding(0.05);

  const maxCount = d3.max(heatData, d => d.count) || 1;
  const color = d3.scaleSequential()
    .domain([0, maxCount])
    .interpolator(d3.interpolateYlOrRd);

  heatSvg.selectAll("rect")
    .data(heatData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.hour))
    .attr("y", d => y(d.weekday))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.count))
    .attr("stroke", d => (
      (state.hour === d.hour && state.weekday === d.weekday) ||
      (state.hour === d.hour && state.weekday === null) ||
      (state.hour === null && state.weekday === d.weekday)
    ) ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.08)")
    .attr("stroke-width", d => (
      (state.hour === d.hour && state.weekday === d.weekday) ||
      (state.hour === d.hour && state.weekday === null) ||
      (state.hour === null && state.weekday === d.weekday)
    ) ? 2 : 1)
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      const active = (state.hour === d.hour && state.weekday === d.weekday);
      window.app?.showTooltip(
        `<div class="title">${weekdays[d.weekday]} @ ${String(d.hour).padStart(2, "0")}:00</div>` +
        `<div><b>Reports</b>: ${d.count}</div>` +
        `<div class="muted">Click to toggle hour+weekday filter</div>` +
        `<div class="muted">Shift-click: toggle only hour</div>`,
        event
      );
    })
    .on("mouseleave", () => window.app?.hideTooltip())
    .on("click", (event, d) => {
      if (event.shiftKey) {
        window.app?.toggleHour(d.hour);
        return;
      }

      // toggle pair
      const isSame = (state.hour === d.hour && state.weekday === d.weekday);
      if (isSame) {
        window.app?.toggleHour(null);
        window.app?.toggleWeekday(null);
      } else {
        // set both (implemented as toggles, so clear first)
        if (state.hour !== null) window.app?.toggleHour(state.hour);
        if (state.weekday !== null) window.app?.toggleWeekday(state.weekday);
        window.app?.toggleHour(d.hour);
        window.app?.toggleWeekday(d.weekday);
      }
    });

  heatSvg.append("g")
    .attr("transform", `translate(0,${heatHeight - margin.bottom})`)
    .call(d3.axisBottom(x).tickValues([0, 4, 8, 12, 16, 20, 23]));

  heatSvg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickFormat(d => weekdays[d]));
}
