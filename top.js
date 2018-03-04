var fs = require('fs');

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
    //bikes[r.bike_id] = typeof(bikes[r.bike_id]) === 'undefined' ? initBike(r) : bikes[r.bike_id];
    if (typeof(bikes[r.bike_id]) === 'undefined') {
      bikes[r.bike_id] = initBike(r);
    }
    bikes[r.bike_id] = addRide(bikes[r.bike_id], r);
  });
});

console.log("Hashtable built...");

Object.keys(bikes).forEach( (key) => {
  list.push(bikes[key]);
});

list.sort(sortBikes);
var topBike = list[0];
console.log(`Top Bike: ${topBike.id}`);
console.log(`Trips: ${topBike.trips.length/2}`);
writeData('data/popular-bike.json',JSON.stringify(list[0]));

function initBike(ride) {
  return {
    trips: [],
    id: ride.bike_id
  }
}

function addRide(bike, ride) {
  var start = [ride.start_lon, ride.start_lat]
  var end = [ride.end_lon, ride.end_lat];
  bike.trips.push(start);
  bike.trips.push(end);
  return bike;
}

function sortBikes(a, b) {
  return b.trips.length - a.trips.length;
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
