// Function to generate equally separated points
function generatePoints(start, end, n) {
  let arr = [];
  for (let i = 0; i <= n; i++) {
    let x = start[0] + ((end[0] - start[0]) * i) / n;
    let y = start[1] + ((end[1] - start[1]) * i) / n;
    arr.push([x, y]);
  }
  return arr;
}

// Function to generate points with a fixed step size
function generatePointsWithStep(start, end, step) {
  let arr = [];
  let dist = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
  );
  let n = Math.floor(dist / step);
  for (let i = 1; i <= n; i++) {
    let x = start[0] + ((end[0] - start[0]) * i) / n;
    let y = start[1] + ((end[1] - start[1]) * i) / n;
    arr.push([x, y]);
  }
  return arr;
}

function generateFullArrayPoints(POI, STEPS) {
  const allPoints = [];
  allPoints.push(POI[0]);
  let lastUsedPoint = POI[0];
  for (let i = 1; i < POI.length; i++) {
    if (
      Math.sqrt(
        Math.pow(POI[i][0] - lastUsedPoint[0], 2) +
          Math.pow(POI[i][1] - lastUsedPoint[1], 2)
      ) < STEPS
    ) {
      continue;
    }
    const points = generatePointsWithStep(lastUsedPoint, POI[i], STEPS); // Generate n points
    lastUsedPoint = points[points.length - 1];
    for (let j = 0; j < points.length; j++) {
      allPoints.push(points[j]);
    }
  }
  return allPoints;
}

function createGeoJsonLineFromPoints(points) {
  const geoJsonLine = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points,
    },
  };
  return geoJsonLine;
}

// in this function dots and commans in numbers should be replaced for underscores
function slugify(s) {
  s = s + "";
  return s.replace(/\.|,/g, "_");
}

function createFrontConfigFile(configObject, fs) {
  let config = JSON.stringify(configObject);
  fs.writeFileSync("./frontend/dist/config.json", config);
}

function copyDatafileToFrontend(path, output, fs) {
  fs.copyFileSync(path, "./frontend/dist/" + output);
}
function writeDatafileToFrontend(data, output, fs) {
  fs.writeFileSync("./frontend/dist/"+output,  JSON.stringify(data));
}

export {
  generatePoints,
  generatePointsWithStep,
  slugify,
  createFrontConfigFile,
  copyDatafileToFrontend,
  generateFullArrayPoints,
  writeDatafileToFrontend,
  createGeoJsonLineFromPoints,
};
