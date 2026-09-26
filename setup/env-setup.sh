#!/bin/sh
# /etc/caddy/env-setup.sh

BASE_DOMAIN="int.alfille.org"

# list of couchdb databases
APP_LIST="potholder otherapp thirdapp"

APP_NAMES=$(echo "$APP_LIST" | tr ' ' '|')

# name of subdomain associated with each database
APP_DOMAINS=$(for name in $APP_LIST; do echo -n "$name.$BASE_DOMAIN "; done)

echo "BASE_DOMAIN=$BASE_DOMAIN"
echo "APP_NAMES=$APP_NAMES"
echo "APP_DOMAINS=$APP_DOMAINS"
