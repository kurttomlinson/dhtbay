var seconds_per_batch = 1*60;
var torrents_per_batch = 100;

var config = require ('./config/database');
var fs = require('fs');

/*
var mongoose = require('mongoose');
var config = require('./config/database');
mongoose.connect(config.db.uri);
var Torrent = require(__dirname+'/models/Torrent.js');
*/
var redis = require("redis");
    client = redis.createClient(config.redis.port, config.redis.host, config.redis.options);

client.on("error", function(err) {
    if(err) {
        throw err;
    }
});

var dest = __dirname+"/torrent/";
var MAGNET_TEMPLATE = "magnet:?xt=urn:btih:{DHTHASH}"

var WebTorrent = require('webtorrent')
var web_torrent_client = new WebTorrent({ path: "/dev/null" }) //don't download files
web_torrent_client.on('torrent', function (torrent) {
  var torrent_file_path = dest+torrent.infoHash.toUpperCase()+'.torrent';
  var wstream = fs.createWriteStream(torrent_file_path);
  // Node.js 0.10+ emits finish when complete
  wstream.on('finish', function () {
    console.log("================================================================================");
    console.log("GOT A TORRENT: " + torrent.infoHash);
    console.log('File has been written: ' + torrent_file_path);
    console.log("================================================================================");
    web_torrent_client.remove(torrent.magnetURI, function(err){
      if(err) {console.log("web_torrent_client.remove error");console.log(err); return;}
      console.log("web_torrent_client.torrents.length: " + web_torrent_client.torrents.length);
    });
  });
  wstream.write(torrent.torrentFile);
  wstream.end();
});

console.logCopy = console.log.bind(console);

console.log = function(data) {
   if(arguments.length) {
      var timestamp = '[' + new Date().toUTCString() + ']';
      this.logCopy(timestamp, arguments);
   }
};

function timeout_torrents(marked_torrent) {
  marked_torrent--;
  setTimeout(function() {
    //kill trorrent
    if (web_torrent_client.torrents[marked_torrent]) {
      console.log("Killing torrent: " + web_torrent_client.torrents[marked_torrent].infoHash);
      web_torrent_client.remove(web_torrent_client.torrents[marked_torrent].infoHash, function(err){
        if(err) {console.log(err); return;}
      });
    }
    //loop
    if (marked_torrent > 0) {
      timeout_torrents(marked_torrent)
    }
  });
}



function run() {
  client.lpop("DHTS",function(err, hash){
    if(err) {console.log(err); return;}
    if(!hash) {console.log("no hash"); return;}
//    Torrent.findById(hash, function(err, torrent){
torrent = false
      if (err) {console.log(err);}
      if (!torrent) {
        // Torrent not in DB. Has it been downloaded though?
        var upper_case_hash = hash.toString().toUpperCase();
        var torrent_file_path = dest + upper_case_hash + '.torrent';
        if(fs.existsSync(torrent_file_path)) {
          // Torrent file already downloaded
        } else {
          // Torrent not in DB and hasn't been downloaded yet. Downlaod it.
          var magnet = MAGNET_TEMPLATE.replace('{DHTHASH}', hash.toString().toUpperCase());
          console.log("Downloading magnet: " + magnet);
          var this_torrent = web_torrent_client.add(magnet);
          this_torrent.on('error', function(err) {
            if(err) {console.log(err); return;}
          });
        }
      } else {
        // Torrent already present in DB
      }
//    });
  });
}

function start_batch(){
  for (i=0; i<web_torrent_client.torrents.length; i++) {
    timeout_torrents(web_torrent_client.torrents.length);
  }
  setTimeout(function(){
    for (i=0; i<torrents_per_batch; i++) {
      run();
    }
  }, 3 * 1000);
}

start_batch();
setInterval(start_batch, 1000 * seconds_per_batch);
