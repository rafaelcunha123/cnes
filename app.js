require('./data/dbconnection.js').open(function() {
	dbconn = require('./data/dbconnection.js');
	db = dbconn.get();
	collection = db.collection('clinics');

	var crawler = require('./code/crawler.js');

	crawler(function(){
		db.close();
	})

})