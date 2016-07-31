var number_of_nodes = 10;
var starting_port = 16881
var maximum_queue_length = 1e6;

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

function make_node(node_index) {
  var port = starting_port + node_index
  var ed = require('ed25519-supercop')
  var dht = new DHT({ verify: ed.verify })
  var build = function() {
    dht.listen(port, function(){
      console.log('now listening: ' + node_index);
    });

    dht.on('ready',function() {
      console.log("address " + port + ": " + JSON.stringify(dht.address()));
      console.log('now ready: ' + node_index);
    });

    dht.on('announce', function(peer, infoHash) {
      console.log("announce "+node_index+": "+peer.host + ':' + peer.port+' : '+infoHash.toString('hex'));
      //dht.lookup(infoHash);
      client.llen("DHTS", function(err,result){
        console.log("queue length: " + result);
        if (result < maximum_queue_length) {
          console.log("added to queue");
          client.rpush("DHTS", infoHash.toString('hex'));
        } else {
          console.log("not added to queue");
        }
      });
      // console.log("values stored by node #" + node_index)
      console.log(dht.toJSON().values);
    });

    dht.on('error',function(err) {
      dht.destroy();
    });

    return dht;
  }
  return build;
}

var dhts = new Array();
var make_nodes = new Array();
for (i=0; i<number_of_nodes; i++) {
  make_nodes[i] = make_node(i);
  dhts[i] = make_nodes[i]();
}
