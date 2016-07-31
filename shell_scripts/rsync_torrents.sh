#!/bin/bash
rsync -avz -e "ssh -i /home/bc/keys/dht_private_key" dht@raspi.kurttomlinson.com:/home/dht/dhtbay/torrent/ /home/bc/dhtbay/torrent
