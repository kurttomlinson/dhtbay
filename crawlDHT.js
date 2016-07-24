var number_of_nodes = 100;

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
  var build = function() {
    dht = new DHT();
    dht.listen(16881 + node_index, function(){
      console.log('now listening: '+node_index);
      //console.log(dht_array[i].address());
    });

    dht.on('ready',function() {
      console.log('now ready: '+node_index);
    });

    dht.on('announce', function(peer, infoHash) {
      console.log("announce "+node_index+": "+peer.host + ':' + peer.port+' : '+infoHash.toString('hex'));
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
