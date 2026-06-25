(() => {
  const tooltip = d3.select("#tooltip");

  const cssVar = (name, fallback = "") => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) ? v.trim() : fallback;
  };

  const palette = {
    Violent: cssVar("--cat-3", "#e15759"),
    Property: cssVar("--cat-1", "#4e79a7"),
    Cyber: cssVar("--cat-2", "#f28e2b"),
    Other: cssVar("--cat-4", "#76b7b2"),
    Male: cssVar("--male", "#4e79a7"),
    Female: cssVar("--female", "#e15759"),
  };

  const state = {
    city: "All",
    crime: "All",
    year: null,
    domain: "All", // interactive via legend clicks
    hour: null, // 0-23, interactive via heatmap
    weekday: null, // 0-6 (Sun..Sat), interactive via heatmap
  };

  const setSelectValue = (selector, value) => {
    const sel = d3.select(selector);
    if (!sel.empty()) sel.property("value", value);
  };

  const showTooltip = (html, event) => {
    tooltip
      .style("opacity", 1)
      .attr("aria-hidden", "false")
      .html(html);
    moveTooltip(event);
  };

  const moveTooltip = (event) => {
    if (!event) return;
    const padding = 14;
    const { clientX: x, clientY: y } = event;
    const node = tooltip.node();
    const rect = node.getBoundingClientRect();

    let left = x + padding;
    let top = y + padding;
    if (left + rect.width > window.innerWidth) left = x - rect.width - padding;
    if (top + rect.height > window.innerHeight) top = y - rect.height - padding;

    tooltip.style("left", `${Math.max(8, left)}px`).style("top", `${Math.max(8, top)}px`);
  };

  const hideTooltip = () => {
    tooltip.style("opacity", 0).attr("aria-hidden", "true");
  };

  const toggleDomain = (domain) => {
    if (!domain || domain === "All") {
      state.domain = "All";
    } else {
      state.domain = (state.domain === domain) ? "All" : domain;
    }
    render();
  };

  const toggleCity = (city) => {
    if (!city || city === "All") {
      state.city = "All";
    } else {
      state.city = (state.city === city) ? "All" : city;
    }
    setSelectValue("#cityFilter", state.city);
    render();
  };

  const toggleHour = (hour) => {
    if (hour == null || !Number.isFinite(hour)) {
      state.hour = null;
    } else {
      state.hour = (state.hour === hour) ? null : hour;
    }
    render();
  };

  const toggleWeekday = (weekday) => {
    if (weekday == null || !Number.isFinite(weekday)) {
      state.weekday = null;
    } else {
      state.weekday = (state.weekday === weekday) ? null : weekday;
    }
    render();
  };

  // expose a small API for the views
  window.app = {
    state,
    palette,
    showTooltip,
    moveTooltip,
    hideTooltip,
    toggleDomain,
    toggleCity,
    toggleHour,
    toggleWeekday,
  };

  let data = [];

  d3.csv("data/crime_dataset_india.csv").then(rawData => {
    data = preprocessData(rawData);

    const cities = [...new Set(data.map(d => d.City).filter(Boolean))].sort(d3.ascending);
    const crimes = [...new Set(data.map(d => d["Crime Description"]).filter(Boolean))].sort(d3.ascending);
    const years = [...new Set(data.map(d => d.year).filter(y => Number.isFinite(y)))].sort(d3.ascending);

    populateFilter("#cityFilter", cities);
    populateFilter("#crimeFilter", crimes);
    populateFilter("#yearFilter", years);

    d3.selectAll("select").on("change", () => {
      state.city = d3.select("#cityFilter").property("value");
      state.crime = d3.select("#crimeFilter").property("value");
      const yearValue = d3.select("#yearFilter").property("value");
      state.year = yearValue === "All" ? null : +yearValue;
      render();
    });

    render();
  });

  function render() {
    const filteredData = data.filter(d =>
      (state.city === "All" || d.City === state.city) &&
      (state.crime === "All" || d["Crime Description"] === state.crime) &&
      (state.year === null || d.year === state.year) &&
      (state.domain === "All" || d.crimeDomain === state.domain) &&
      (state.hour === null || d.hour === state.hour) &&
      (state.weekday === null || d.weekday === state.weekday)
    );

    drawMap(filteredData, state, palette);
    drawScatter(filteredData, state, palette);
    drawDemographics(filteredData, state, palette);
  }
})();

function populateFilter(id, values) {
  const select = d3.select(id);
  select.append("option").text("All").attr("value", "All");

  values.forEach(v => {
    select.append("option").text(v).attr("value", v);
  });
}
