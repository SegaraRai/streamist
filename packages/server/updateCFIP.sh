#!/bin/sh

FILENAME=./docker/compose/cfip.txt

rm -f $FILENAME
echo '# Cloudflare IPs\n' >> $FILENAME
curl https://www.cloudflare.com/ips-v4 >> $FILENAME
echo '\n' >> $FILENAME
curl https://www.cloudflare.com/ips-v6 >> $FILENAME
echo >> $FILENAME
