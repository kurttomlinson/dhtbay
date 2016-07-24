# dht-bay
A DHT crawler, torrent indexer and search portal all in nodeJS

IMPROVEMENTS FROM FLYERSWEB
---------------------------

This is a fork with several improvements over the original repo.

1. Slightly better documentation.
2. When crawling the DHT multiple nodes are created. (Default is 100 nodes.) This speeds up indexing.
3. The npm package "magnet-to-torrent" is used to find places to download .torrent files from a variety of sources instead of relying on torcache.net on staying up.

INSTALL
-------

#### Install necessary tools

```
apt-get install redis-server redis-tools mongodb aria2 nodejs npm -y
```

#### Install bitcannon

1. Download newest release from https://github.com/Stephen304/bitcannon/wiki/Installing-BitCannon and extract it.
2. (Optional) Remove trackers and archives from the `bitcannon/config.json` file so it looks like this:

```
{
  "mongo": "127.0.0.1",
  "bitcannonPort": "1337",
  "scrapeEnabled": true,
  "scrapeDelay": 0,
  "trackers": [],
  "archives": []
}
```

BitCannon is a web app that lets you search the torrents that dhtbay downloads from the DHT.

If cron on your operating system supports `@reboot` syntax, then you can add the following to your cron table:

```
@reboot ~/bitcannon/bitcannon_linux_arm ~/bitcannon/log.txt 2>&1
```

Replace `~/bitcannon/` with the path to where you extracted bitcannon. Replace `bitcannon_linux_arm` with the correct executable for your system.

#### Install dependencies

```
cd ~/dhtbay/
npm install
```

Replace ~/dhtbay/ with the path to where you cloned this repository.

#### Update database information

```
cp ./config/database.default.js ./config/database.js
vim ./config/database.js
```

If you're using mongodb without a username/password (default) on the same computer, change the uri line to 

```
uri : 'mongodb://localhost:27017/bitcannon'
```

The rest of the configuration should be fine.

#### Launch aria2

```
aria2c -q -j 10 --log-level=notice --http-accept-gzip=true --check-certificate=false --follow-torrent=false --enable-rpc --dir=/home/dht/dhtbay/torrent -l /home/dht/dhtbay/logs/aria2c.log &
```

Replace /home/dht/dhtbay/ with the path to where you cloned this repository.

#### Cron to install

Some tasks can be added in a cron treatment. For example this is my CRON configuration:

```
# Update swarm once an hour
40 * * * * nodejs ~/dhtbay/updateSeed.js forceAll > ~/dhtbay/log/update.log 2>&1
# Bayesian categorization once an hour
20 * * * * nodejs ~/dhtbay/classifier.js> ~/dhtbay/log/classifier.log 2>&1
# Categorize once an hour
30 * * * * nodejs ~/dhtbay/categorize.js > ~/dhtbay/log/categorize.log 2>&1
# Load torrent files every ten minutes
*/10 * * * * nodejs ~/dhtbay/loadFileTorrent.js > ~/dhtbay/logs/load.log 2>&1
```

Replace ~/dhtbay/ with the path to where you cloned this repository.

If cron on your operating system supports `@reboot` syntax, then you can add the following to your cron table:

```
@reboot nodejs ~/dhtbay/crawlDHT.js > ~/dhtbay/logs/crawldht.txt 2>&1
@reboot nodejs ~/dhtbay/loadDHT.js > ~/dhtbay/logs/loaddht.txt 2>&1
@reboot aria2c -q -j 10 --log-level=notice --http-accept-gzip=true --check-certificate=false --follow-torrent=false --enable-rpc --dir=~/dhtbay/torrent -l ~/dhtbay/logs/aria2c.log
```

If cron doesn't support the `@reboot` syntax on your system, you'll have to find some other way to make sure those commands get run each time your system boots.

Replace ~/dhtbay/ with the path to where you cloned this repository.

You'll have your DHT Crawler up and running. Crawling may take some time so be patient.


CONTENT
-------

The project is composed of ~8 modules. Each module is ?possibly? independant and can ?maybe? be used separately without problem.

+  **crawlDHT.js** is responsible for crawling hashs from the DHT network. It will push hashes on a redis list called *DHTS*. It also provides a routing table backup system saving it each 10 minutes in a mongo collection called table.
+  **loadDHT.js** is responsible for loading hashes from the redis list *DHTS* and downloading .torrent files to the /torrent subdirectory. It depends on *aria2* and tries to download .torrent files from several different sources.
+  **loadFileTorrent.js** is responsible for importing .torrent files from the /torrent subdirectory into the mongo database.
+  **updateSeed.js** tries to update swarm so you're able to know whose torrent are already active before launching download. You can force full refresh by passing forceAll argument.
+  **categorize.js** will try to categorize crawled torrent depending on file extensions. Because module only takes a limited number of extensions in account you can use classifier too.
+  **classifier.js** a bayesian classifier that will classify torrent that couldn't be classed by previous one. In order to work you need to train the classifier.
+  **trainer.js** the bayesian classifier trainer, based on categorize script classification it helps unknown torrent classification.

Please fork it, and use it everywhere you can.

IMPROVEMENTS
------------

+ <s>Add a seed/leech crawler to know which torrent is dead or not.</s>
+ Improve categorization to support more extensions. Use an API extension/categorization.
+ <s>Use bayesian categorization optimization.</s>

Have fun.

@flyersweb
