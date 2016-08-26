const readline = require('line-reader')
const r = require('ramda')

const actions = require('./actions.js');
const cityIbge = require('../data/ibge.js');

const crawler = function(callback) {
  let cnt = 0

  readline.eachLine('./data/cnes.csv', (line, last, cb) => {
    let json = actions.lineToJSON(line)
    json.municipioIbge = cityIbge[json.municipio.trim()]

    actions.getClinicsData(json)
      .then(() => {
        console.log(cnt++)
        cb()
      })
      .catch(err => console.log(err))
  })

}

module.exports = crawler;
