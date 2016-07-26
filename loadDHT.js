var maximum_torrents = 10;
var torrents_per_second = 0.2;
var torrent_timeout = maximum_torrents / torrents_per_second;
console.log("torrent_timeout: " + torrent_timeout);

var config = require ('./config/database');
var fs = require('fs');

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

function timeout_torrents() {
  if (web_torrent_client.torrents.length > maximum_torrents) {
    console.log("torrent timed out: " + web_torrent_client.torrents[0].infoHash);
    web_torrent_client.remove(web_torrent_client.torrents[0].infoHash, function(err){
      if(err) {console.log("web_torrent_client.remove error");console.log(err); return;}
      console.log("web_torrent_client.torrents.length: " + web_torrent_client.torrents.length);
    });
  }
}

function run() {

  client.lpop("DHTS",function(err, hash){
    if(err) {console.log(err); return;}
    if(!hash) {return;}
    if(fs.existsSync(dest+hash.toString().toUpperCase()+'.torrent')) {console.log("File "+hash.toString().toUpperCase()+".torrent already exists");return;}
    var magnet = MAGNET_TEMPLATE.replace('{DHTHASH}',hash.toString().toUpperCase());

    console.log("Downloading magnet: " + magnet);
    var this_torrent = web_torrent_client.add(magnet);
    this_torrent.on('error', function(err) {
      if(err) {console.log("this_torrent error"); console.log(err); return;}
    });


  //   magnetToTorrent.getLink(magnet)
  //   .then( function(torrentLink){
  //     console.log("================================================================================");
  //     console.log("Torrent link = " + torrentLink); // torrent url as string
  //     console.log("Magnet link = " + magnet); // magnet as string
  //     aria2.open(function() {
  //       aria2.send('getVersion', function(err,res){
  //         if(err) { console.log(err); return; }
  //         aria2.send('addUri',[torrentLink, magnet],function(err,res){
  //           if(err) { console.log(err); return;}
  //           console.log("Added : " + hash.toString());
  //           aria2.close();
  //         })
  //       });
  //     });
  //   })
  //   .fail(function(error){
  //     console.log("================================================================================");
  //     console.error(error); // couldn't get a valid link
  //     console.log("Magnet link = " + magnet); // magnet as string
  //     aria2.open(function() {
  //       aria2.send('getVersion', function(err,res){
  //         if(err) { console.log(err); return; }
  //         aria2.send('addUri',[magnet],function(err,res){
  //           if(err) { console.log(err); return;}
  //           console.log("Added : " + hash.toString());
  //           aria2.close();
  //         })
  //       });
  //     });
  //   });
  })

}

setInterval(function(){
  timeout_torrents();
  run();
}, 1000 / torrents_per_second);

