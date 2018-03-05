var fs = require('fs')
var data = require('./data/stations.json');
var table = {};

data.forEach( (item) => {
  table[item['Station ID']] = {
    name: item['Station Name'],
    id: item['Station ID']
  }
});

writeData('./data/stationTable.json', JSON.stringify(table));

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
