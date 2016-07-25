var number_of_nodes = 10;

var config = require('./config/database');
var util = require('util');

var redis = require("redis");
    client = redis.createClient(config.redis.port, config.redis.host, config.redis.options);

console.logCopy = console.log.bind(console);

console.log = function(data) {
   if(arguments.length) {
      var timestamp = '[' + new Date().toUTCString() + ']';
      this.logCopy(timestamp, arguments);
   }
};

var DHT = require('bittorrent-dht');

function make_node(node_index){
  var port = 16881 + node_index
  var dht = new DHT();
  var build = function() {
    dht.listen(port, function(){
      console.log('now listening: ' + port);
    });

    dht.on('ready',function() {
      console.log("address " + port + ": " + JSON.stringify(dht.address()));
      console.log('now ready: ' + port);
    });

    dht.on('announce', function(peer, infoHash) {
      console.log("announce "+port+": "+peer.host + ':' + peer.port+' : '+infoHash.toString('hex'));
      dht.lookup(infoHash);
      client.rpush("DHTS", infoHash.toString('hex'));
    });

    dht.on('peer', function(peer, infoHash, from) {
      //console.log("peer : "+peer.host + ':' + peer.port+' : '+infoHash.toString('hex'));
    });

    dht.on('error',function(err) {
      dht.destroy();
    });
  }
  return build;
}



var nodes = new Array();
for (i=0; i<number_of_nodes; i++) {
  nodes[i] = make_node(i);
  nodes[i]();
}
