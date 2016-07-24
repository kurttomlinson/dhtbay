var Aria2 = require('aria2');

var config = require ('./config/database');
var fs = require('fs');

var redis = require("redis");
    client = redis.createClient(config.redis.port, config.redis.host, config.redis.options);

var magnetToTorrent = require('magnet-to-torrent');

client.on("error", function(err) {
    if(err) {
        throw err;
    }
});

var dest = __dirname+"/torrent/";
var MAGNET_TEMPLATE = "magnet:?xt=urn:btih:{DHTHASH}"

var aria2 = new Aria2({
   host: '127.0.0.1',
   port: 6800,
   secure: false,
   secret: ''
});

console.logCopy = console.log.bind(console);

console.log = function(data) {
   if(arguments.length) {
      var timestamp = '[' + new Date().toUTCString() + ']';
      this.logCopy(timestamp, arguments);
   }
};


function run() {

  client.lpop("DHTS",function(err, hash){
    if(err) {console.log(err); return;}
    if(!hash) {return;}
    if(fs.existsSync(dest+hash.toString().toUpperCase()+'.torrent')) {console.log("File "+hash.toString().toUpperCase()+".torrent already exists");return;}
    var magnet = MAGNET_TEMPLATE.replace('{DHTHASH}',hash.toString().toUpperCase());

    magnetToTorrent.getLink(magnet)
    .then( function(torrentLink){
      console.log(torrentLink); // torrent url as string
      aria2.open(function() {
        aria2.send('getVersion', function(err,res){
          if(err) { console.log(err); return; }
          aria2.send('addUri',[torrentLink],function(err,res){
            if(err) { console.log(err); return;}
            console.log("Added : " + hash.toString());
            client.rpush("TORS", hash.toString());
            aria2.close();
          })
        });
      });
    })
    .fail(function(error){
        console.error(error); // couldn't get a valid link
    });
  })

}

setInterval(function(){
   run();
}, 5000);

