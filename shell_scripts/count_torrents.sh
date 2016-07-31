#!/bin/bash
echo `date "+%Y-%M-%d   %H:%M:%S"`      `ls -l /home/dht/dhtbay/torrent/ | wc -l` >> /home/dht/dhtbay/logs/count.txt
