#!/bin/sh
# /etc/caddy/env-setup.sh

ENV_FILE="/run/caddy/caddy.env"

BASE_DOMAIN="int.alfille.org"

# list of couchdb databases
APP_LIST="potholder otherapp thirdapp"

APP_NAMES=$(echo "$APP_LIST" | tr ' ' '|')

# name of subdomain associated with each database
APP_DOMAINS=$(for name in $APP_LIST; do echo -n "$name.$BASE_DOMAIN "; done)

# Redirect output directly to the environment file
cat <<EOF > "$ENV_FILE"
BASE_DOMAIN=$BASE_DOMAIN
APP_NAMES=$APP_NAMES
APP_DOMAINS=$APP_DOMAINS
EOF
