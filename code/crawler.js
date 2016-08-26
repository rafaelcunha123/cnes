var crawler = function(callback) {
	var actions = require('./actions.js');


	actions.getCnesData().then(function(clinics) {
		return actions.getCityCode(clinics);
	}).then(function(clinics){
			return actions.getClinicsData(clinics);
	}).then(function(clinics){
		console.log('finished');
		callback();
	}).catch(function(e) {
		console.log(e);
	});
}

module.exports = crawler;