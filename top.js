var fs = require('fs');
var stationMeta = require('./data/stationTable.json');
var muralBikes = require('./data/muralBikes.json');

var stats = {
  id: '2679',
  trips: 0,
  stations: {},
  longestDistance: 0,
  longestDistanceMeta: {},
  longestDuration: 0,
  longestDurationMeta: {},
  totalDistance: 0,
  totalDuration: 0
};

var files = [
  'q2-15.json',
  'q3-15.json',
  'q4-15.json',
  'q1-16.json',
  'q2-16.json',
  'q3-16.json',
  'q4-16.json',
  'q1-17.json',
  'q2-17.json',
  'q3-17.json',
  'q4-17.json'
];

var quarters = [];

files.forEach( (file) => {
  quarters.push(require(`./data/${file}`));
});

var bikes = {};
var list = [];

console.log("Processing...");
quarters.forEach( (quarter, i) => {
  quarter.forEach( (r) => {
    bikes[r.bike_id] = typeof(bikes[r.bike_id]) === 'undefined' ? initBike(r) : bikes[r.bike_id];
    bikes[r.bike_id] = addRide(bikes[r.bike_id], r);
    stats = checkStats(r, stats);
  });
});

stats.avgDuration = stats.totalDuration / stats.trips;
stats.avgDistance = stats.totalDistance / stats.trips;
console.log("Table built...");

Object.keys(bikes).forEach( (key) => {
  list.push(bikes[key]);
});

console.log("Total Bikes:" + list.length);

list.forEach( (bike, index) => {
  bike.isMural = isMuralBike(bike.id, muralBikes);
  bike.timeInService = bike.last - bike.first;
  bike.tripsPerDay = (bike.trips.length/2) / (bike.timeInService / 1000 / 60 / 60 / 24)
});

list = list.sort(sortBikes);
var topBike = list[0];
topBike.stats = stats;
console.log(stats);
stats.topStations = getTopStations(topBike, stationMeta);

var normalTrips = 0;
var muralArtsTrips = 0;
var totalNormalBikes = 0;
var totalMuralArtsBikes = 0;
var muralArtsTotalTripsPerDay = 0;
var normalTotalTripsPerDay = 0;
var normalTimeInService = 0;
var muralArtsTimeInService = 0;

list.forEach( (bike, index) => {
  if (bike.isMural) {
    totalMuralArtsBikes += 1;
    muralArtsTotalTripsPerDay += bike.tripsPerDay;
    muralArtsTrips += bike.trips.length/2;
    muralArtsTimeInService += bike.timeInService;
  }
  else {
    totalNormalBikes += 1;
    normalTotalTripsPerDay += bike.tripsPerDay;
    normalTrips += bike.trips.length/2;
    normalTimeInService += bike.timeInService;
  }
});

stats.overall = {
  avgTrips: {
    normal: normalTrips / totalNormalBikes,
    muralArts: muralArtsTrips / totalMuralArtsBikes
  },
  avgTripsPerDay: {
    normal: normalTotalTripsPerDay / totalNormalBikes,
    muralArts: muralArtsTotalTripsPerDay / totalMuralArtsBikes
  },
  avgTimeInService: {
    normal: normalTimeInService / totalNormalBikes,
    muralArts: muralArtsTimeInService / totalMuralArtsBikes
  }
  ,
  bikes: {
    normal: totalNormalBikes,
    muralArts: totalMuralArtsBikes
  }
}

writeData('data/popular-bike.json',JSON.stringify(list[0]));

function getTopStations(bike, stations) {
  topList = [];
  stationList = Object.keys(bike.stats.stations);
  stationList.forEach( (station) => {
    topList.push(
      {id: station, trips: bike.stats.stations[station], name: stations[station].name}
    );
  });
  topList.sort( (a,b) => { return b.trips - a.trips } );
  return topList;
}

function checkStats(ride, stats) {
  var start = [ride.start_lon, ride.start_lat]
  var end = [ride.end_lon, ride.end_lat];
  if (validateTrip(start) && validateTrip(end) && ride.bike_id == stats.id) {
    stats = recordStats(ride, stats);
  }
  return stats;
}

function recordStats(ride, stats) {
  stats.trips += 1;
  stats.totalDuration += parseInt(ride.duration);
  stats.stations[ride.start_station_id] = init(stats.stations[ride.start_station_id], stats.stations[ride.start_station_id]) + 1;
  stats.stations[ride.end_station_id] = init(stats.stations[ride.end_station_id], stats.stations[ride.end_station_id]) + 1;
  var distance = getMiles(ride.start_lat, ride.start_lon, ride.end_lat, ride.end_lon);
  ride.distance = distance;

  if (stats.longestDuration < parseInt(ride.duration)) {
    stats.longestDuration = parseInt(ride.duration);
    stats.longestDurationMeta = ride;
  }

  stats.totalDistance += distance;

  if (stats.longestDistance < distance) {
    stats.longestDistance = distance;
    stats.longestDistanceMeta = ride;
  }

  return stats;
}

function init(item, value) {
  return typeof(item) === 'undefined' ? 0 : value;
}

function initBike(ride) {
  return {
    trips: [],
    first: null,
    last: null,
    id: ride.bike_id
  }
}

function addRide(bike, ride) {
  var start = [ride.start_lon, ride.start_lat]
  var end = [ride.end_lon, ride.end_lat];
  if (validateTrip(start) && validateTrip(end)) {
    bike.trips.push(start);
    bike.trips.push(end);
  }
  bike = addDate(bike, ride);
  return bike;
}

function addDate(bike, ride) {
  if (bike.first == null || bike.first > new Date(ride.start_time)) {
    bike.first = new Date(ride.start_time);
  }
  if (bike.last == null || bike.last < new Date(ride.end_time)) {
    bike.last = new Date(ride.end_time);
  }
  return bike;
}

function validateTrip(trip) {
  return trip.indexOf("") == -1 && trip.indexOf("0") == -1 && trip.indexOf("\\N") == -1;
}

function sortBikes(a, b) {
  return b.trips.length - a.trips.length;
}

function sortBikesTripsPerDay(a, b) {
  return b.tripsPerDay - a.tripsPerDay;
}
function writeData(file, data) {
  fs.writeFile(file, data, (err) => {
    if (err) {
      return console.log(err);
    }
    else {
      console.log("Done");
    }
  });
}

function toRadians(num) {
    return num * Math.PI / 180;
}

// https://www.movable-type.co.uk/scripts/latlong.html
function getMiles(lat1, lon1, lat2, lon2) {
  var R = 6371e3; // metres
  var φ1 = parseFloat(toRadians(lat1));
  var φ2 = parseFloat(toRadians(lat2));
  var Δφ = toRadians(parseFloat(lat2)-parseFloat(lat1));
  var Δλ = toRadians(parseFloat(lon2)-parseFloat(lon1));

  var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  var d = R * c;
  return d*0.000621371192;
}

function isMuralBike(id, list) {
  return list.indexOf(id) > -1;
}
