# dht-bay
A DHT crawler, torrent indexer and search portal all in nodeJS

IMPROVEMENTS FROM FLYERSWEB BRANCH
---------------------------

This is a fork with several improvements over the original repo.

1. Slightly better documentation.
2. When crawling the DHT, multiple nodes are created. (Default is 10 nodes.) This speeds up indexing.
3. The torrents are downloaded directly from the swarm instead of from torrent caching websites.
4. Updating the number of Seeders and Leechers works much better now.

INSTALL
-------

#### Install necessary tools

```
apt-get install redis-server redis-tools mongodb aria2 nodejs nodejs-legacy npm -y
```

Install forever tool

```
sudo npm install forever -g
```

#### Install BitCannon

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
cd /home/dht/dhtbay
sudo npm install
```

Replace /home/dht/ with the path to where you cloned this repository.

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

#### Cron to install

Some tasks can be added in a cron treatment. For example this is my CRON configuration:

```
### DHT TASKS ###

# Start a DHT crawler - retrieves infohashes from the DHT
@reboot /usr/local/bin/forever -c /usr/local/bin/node -o /home/dht/dhtbay/logs/crawldht.txt -e /dev/null -a -l /dev/null start /home/dht/dhtbay/crawlDHT.js

# Start trying to get *.torrent files from the DHT based on the infohashes collected by the crawler. The line below is listed 3 times so 3 cores on a 4-core CPU will be used.
@reboot /usr/local/bin/forever -c /usr/local/bin/node -o /home/dht/dhtbay/logs/loaddht_0.txt -e /dev/null -a -l /dev/null start /home/dht/dhtbay/loadDHT.js
@reboot /usr/local/bin/forever -c /usr/local/bin/node -o /home/dht/dhtbay/logs/loaddht_1.txt -e /dev/null -a -l /dev/null start /home/dht/dhtbay/loadDHT.js
@reboot /usr/local/bin/forever -c /usr/local/bin/node -o /home/dht/dhtbay/logs/loaddht_2.txt -e /dev/null -a -l /dev/null start /home/dht/dhtbay/loadDHT.js

# Restart forever scripts every hour - prevents memory leaks
0 * * * * forever restartall

### ADMINISTRATIVE TASKS ##

# Trim log files every ten minutes so they don't get huge
*/10 * * * * truncate /home/dht/dhtbay/logs/*.txt --size 0

# Count torrents every 10 minutes for tuning/research purposes
*/10 * * * * /home/dht/dhtbay/shell_scripts/count_torrents.sh

### --- ### --- ### --- ### --- ### --- ### --- ### --- ### --- ### --- ###

### BITCANNON TASKS ###

# Start BitCannon at boot
@reboot sleep 10 && ~/bitcannon/bitcannon_linux_amd64 > ~/bitcannon/log.txt 2>&1

# Transfer torrents from DHT Crawler every minute
* * * * * /home/bc/dhtbay/shell_scripts/rsync_torrents.sh

### DB TASKS ###

# Load torrent files into MongoDB every minutes
* * * * * nodejs /home/dht/loadFileTorrent.js > /home/dht/logs/load.log 2>&1

# Update Seeder and Leeecher counts every ten minutes
*/10 * * * * nodejs /home/dht/updateSeed.js > /home/dht/log/update.log 2>&1


### TORRENT CATEGORIZATION TASKS (OPTIONAL) ###

# Bayesian categorization once an hour
0 * * * * nodejs /home/dht/classifier.js> /home/dht/log/classifier.log 2>&1

# Categorize once an hour
30 * * * * nodejs /home/dht/categorize.js > /home/dht/log/categorize.log 2>&1
```

Replace /home/dht/ with the path to where you cloned this repository.

If cron doesn't support the `@reboot` syntax on your system, you'll have to find some other way to make sure those commands get run each time your system boots.

Replace `/home/dht/` with the path to where you cloned this repository.

You'll have your DHT Crawler up and running. Crawling may take some time so be patient.

OPEN/FORWARD PORTS
------------------
The script `scrawlDHT.js` uses ports 16881 and above (one for each DHT node you decide to run). Make sure that these ports are open for UDP traffic in your firewall and forwarded from your router.

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
