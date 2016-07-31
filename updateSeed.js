var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var config = require('./config/database');
mongoose.connect(config.db.uri);

var fs = require('fs');
var Client = require('bittorrent-tracker');

var Torrent = require(__dirname+'/models/Torrent.js');

console.logCopy = console.log.bind(console);

console.log = function(data) {
  if(arguments.length) {
  	var timestamp = '[' + new Date().toUTCString() + ']';
  	this.logCopy(timestamp, arguments);
	}
};

var args = process.argv.slice(2);

var peerId = new Buffer('01234567890123456789');
var port = 6887;

var lastDay = new Date();
lastDay.setDate(lastDay.getDate() - 1);
var filter = {};

// 250 queries at a rate of 1 query every 2 seconds
// takes a little over 8 minutes to complete
var limit_count = 250;
var seconds_per_torrent = 2;

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

var stream = Torrent.find(filter).sort({'lastmod': 1}).limit(limit_count).stream();
stream.on('data', function(torrent) {
	var self = this;
	self.pause();
	setTimeout(function(){
		var seeders_max = Math.max.apply(null, seeders);
		var leechers_max = Math.max.apply(null, leechers);
		torrent.swarm.seeders = seeders_max;
		torrent.swarm.leechers = leechers_max;
		console.log("lastmod=" + torrent.lastmod);
		torrent.lastmod = new Date();

		client.destroy();

		torrent.save(function(err) {
			if(err) { console.log("Error while saving"+err); }
			console.log("Torrent saved: "+torrent._id + " Seeders: " + torrent.swarm.seeders + " Leechers: " + torrent.swarm.leechers);
		});

		self.resume();
	}, seconds_per_torrent * 1000);
	console.log("========================================================================================");
	console.log("Processing torrent : " + torrent._id);
	var parsedTorrent = { 'infoHash': torrent._id, 'length': torrent.size, 'announce': torrent.details };

	var client = Client(peerId, port, parsedTorrent);
	var seeders = new Array();
        var leechers = new Array();
	client.on('scrape', function(data) {
		console.log("got a response from tracker: "+data.announce);
		console.log("number of seeders : "+data.complete);
		console.log("number of leechers : "+data.incomplete);

		seeders.push(data.complete);
		leechers.push(data.incomplete);
	});
	client.on('error', function(err) {
		console.log("Torrent client error : "+err); //self.resume();
	});
	client.on('warning', function(err) {
		console.log("Torrent client warning : "+err); //self.resume();
	});
	client.scrape();

});

stream.on('error', function(err) {
	console.log("Error when streaming data : "+err); process.exit(1);
});

stream.on('close', function() {
	console.log("Stream closed"); process.exit(1);
});
