var MongoClient = require('mongodb').MongoClient;
var dburl = 'mongodb://localhost:27017/cnes';
var _connection = null;

var open = function(callback){
	MongoClient.connect(dburl, function(err, db){
		if (err) {
			console.log('DB connection has failed');
			callback()
			return;
		}
		_connection = db;
		console.log('DB connection open');
		callback()
	});
};

var get = function(){
	return _connection;
};

module.exports ={
	open: open,
	get: get
}