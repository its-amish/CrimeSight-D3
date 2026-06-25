function preprocessData(data) {
  const parseDateTime = d3.timeParse("%d-%m-%Y %H:%M");

  const toNumber = (value) => {
    const n = Number(String(value ?? "").trim());
    return Number.isFinite(n) ? n : null;
  };

  const toText = (value) => String(value ?? "").trim();

  const parseMaybeDateTime = (value) => {
    const s = toText(value);
    if (!s) return null;
    const dt = parseDateTime(s);
    return dt || null;
  };

  const normalizeGender = (value) => {
    const g = toText(value).toLowerCase();
    if (g === "m" || g === "male") return "Male";
    if (g === "f" || g === "female") return "Female";
    return g ? g[0].toUpperCase() + g.slice(1) : "";
  };

  const normalizeDomain = (value) => {
    const s = toText(value);
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower.includes("violent")) return "Violent";
    if (lower.includes("property")) return "Property";
    if (lower.includes("cyber")) return "Cyber";
    return s;
  };

  const normalizeYesNo = (value) => {
    const s = toText(value).toLowerCase();
    return s === "yes" || s === "y" || s === "true" || s === "1";
  };

  data.forEach(d => {
    d.City = toText(d.City);
    d["Crime Description"] = toText(d["Crime Description"]);

    d.dateReported = parseMaybeDateTime(d["Date Reported"]);
    d.dateOccurred = parseMaybeDateTime(d["Date of Occurrence"]);
    d.timeOccurred = parseMaybeDateTime(d["Time of Occurrence"]);

    const refDate = d.dateOccurred || d.timeOccurred;
    d.year = refDate ? refDate.getFullYear() : null;
    d.hour = d.timeOccurred ? d.timeOccurred.getHours() : (refDate ? refDate.getHours() : null);
    d.weekday = refDate ? refDate.getDay() : null; // 0=Sun .. 6=Sat

    d.policeDeployed = toNumber(d["Police Deployed"]);
    d.victimAge = toNumber(d["Victim Age"]);

    d.victimGender = normalizeGender(d["Victim Gender"]);
    d.crimeDomain = normalizeDomain(d["Crime Domain"]);

    d.caseClosed = normalizeYesNo(d["Case Closed"]);

    const closedDate = d.caseClosed ? parseMaybeDateTime(d["Date Case Closed"]) : null;
    if (d.caseClosed && closedDate && d.dateReported) {
      const days = (closedDate - d.dateReported) / (1000 * 60 * 60 * 24);
      d.daysToClose = Number.isFinite(days) ? days : null;
    } else {
      d.daysToClose = null;
    }
  });

  return data;
}
