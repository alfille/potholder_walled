#!/bin/env bash

# Setup for secure environment for potholder
# Paul H Alfille 2026
# https://github.com/alfille/github_walled

# Basically sets up caddy, authelia, lldap and couchdb

## ------- Test ROOT ----------
# Check if the effective user ID is 0 using the 'id -u' command
if [ "$(id -u)" -ne 0 ]; then
  echo "Error: This script must be run as root or with sudo." >&2
  # Try to suggest how to run it if sudo is available and the user isn't already root
  if command -v sudo >/dev/null 2>&1 && [ "$(id -u)" -ne 0 ]; then
    echo "Please run: sudo $0 $@" >&2
  fi
  exit 1
fi

## WHIPTAIL
# get friendly TUI interface
apt install --yes whiptail git 

## ---------- Functions -------------------

# repository
repository() {
    if [ -d "/srv/potholder_walled" ]; then
        # Pull as www-data to preserve file ownership
        sudo -u www-data git -C "/srv/potholder_walled" pull
    else
        git -C "/srv" clone https://github.com/alfille/potholder_walled
        chown -R www-data:www-data /srv/potholder_walled
    fi
}

# configuration file update
save_conf() {
    cat > "$conf_file" << EOFCONF
FQDN="$FQDN"
DATABASES="$DATABASES"
COUCHDB_PASS="$COUCHDB_PASS"
LLDAP_PASS="$LLDAP_PASS"
EOFCONF
}

# parse fully qualified domain name)
fqdn_to_dc() {
  local domain="${1%.}"          # Strip trailing dot if present
  local dc="dc=${domain//./,dc=}" # Replace all '.' with ',dc='
  # echo "$dc"
}

# Create a random alphanumeric string
random_string() {
  head -c 512 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 32
  echo ""
}

# Create a group if needed
maybe_make_group() {
    local group="$1"

    # Check if group argument was provided
    if [ -z "$group" ]; then
        echo "Error: No group name provided to maybe_make_group." >&2
        return 1
    fi

    # Check if group exists, otherwise create it
    if getent group "$group" >/dev/null 2>&1; then
        echo "$group"
    else
        if groupadd "$group"; then
            echo "Group '$group' created successfully."
        else
            echo "Error creating group '$group'. Aborting." >&2
            return 1
        fi
    fi
}

# create user [group] if needed:
maybe_make_user() {
    local user="$1"
    local group="${2:-}"  # Optional second argument for primary group

    # Check if user argument was provided
    if [ -n "$group" ]; then
        maybe_make_group "$group"
    fi

    # Check if user argument was provided
    if [ -z "$user" ]; then
        echo "Error: No username provided to maybe_make_user." >&2
        return 1
    fi

    # Check if user exists, otherwise create
    if id "$user" >/dev/null 2>&1; then
        :
    else
        # Build useradd command arguments
        local useradd_cmd=(useradd --system --no-create-home)

        # If a group was specified as the 2nd argument, attach it
        if [ -n "$group" ]; then
            useradd_cmd+=(-g "$group")
        fi

        useradd_cmd+=("$user")

        # Execute user creation
        if "${useradd_cmd[@]}"; then
            echo "User '$user' created successfully."
        else
            echo "Error creating user '$user'. Aborting." >&2
            return 1
        fi
    fi
}

overwrite_text() {
    local target="$1"
    cat <<EOFOVER
The file 
.   $target 
.   .     already exists.

Do you want to replace it?
EOFOVER
}
    
# Helper: Prompt for confirmation if file exists
confirm_overwrite() {
    local target_file="$1"

    if [ -f "$target_file" ]; then
        if whiptail --title "Confirm Overwrite" --yesno "$(overwrite_text "$target_file")" 15 70 3>&1 1>&2 2>&3
        then
            return 0
        else
            return 1
        fi
    fi
    return 0 # File doesn't exist, proceed
}

# Wrapper: Read stdin and write to target file if confirmed
safe_write() {
    echo "safe write"
    local target_file="$1"
    local mode="${2:-600}" # Default permissions: 600

    if [ -z "$target_file" ]; then
        echo "Error: Target file path required for safe_write." >&2
        return 1
    fi

    if confirm_overwrite "$target_file"; then
        mkdir -p "$(dirname "$target_file")"
        cat > "$target_file"
        chmod "$mode" "$target_file"
        echo "Wrote $target_file successfully."
    fi
}

maybe_copy() {
    local src="$1"
    local dest="$2"
    if [ -f "$dest" ]; then
        whiptail --title "Confirm Overwrite"  --yesno "$(overwrite_text "$dest")" 15 70 3>&1 1>&2 2>&3 || return 1
    fi
    cp "$src" "$dest"
}

get_password() {
    local title="$1"
    local prompt="$2"
    if [[ -n "$3" ]]; then
        if ! whiptail --title "${title}" --yesno "Do you want to reset password?" 10 60 3>&1 1>&2 2>&3; then
            printf "%s\n" "$3"
            return 0
        fi
    fi
    local pw1 pw2
    while :; do
        pw1=$(whiptail --title "${title}" --passwordbox "${prompt}:" 10 60 3>&1 1>&2 2>&3) || exit 1
        if [ "${#pw1}" -lt 8 ]; then
            whiptail --title "${title}" --msgbox "Password must be at least 8 characters" 10 60  > /dev/tty
            continue
        fi

        pw2=$(whiptail --title "${title}" --passwordbox "Repeat Admin password:" 10 60 3>&1 1>&2 2>&3) || exit 1

        if [ "$pw1" != "$pw2" ]; then
            whiptail --title "${title}" --msgbox "Passwords do not match" 10 60  > /dev/tty
            continue
        fi

        printf '%s\n' "$pw1"
        return 0
    done
}

systemd_restart() {
    local service="$1"
    systemctl daemon-reload
    systemctl enable "$service"
    systemctl restart "$service"
}      

## ------- End of functions --------

## GIT repository
repository

## SAVED CONFIGURATION
# saved under "/etc/potholder/conf.env"
conf_file="/etc/potholder/conf.env"
if [ ! -f "/etc/potholder/conf.env" ]; then
    mkdir -p "$(dirname "$conf_file")"
    chown root:root "$conf_file"
    chmod 600 "$conf_file"
    FQDN="$(hostname -f)"
    DATABASES=""
    COUCHDB_PASS=""
    LLDAP=""
    save_conf
fi
source "$conf_file"
if  [ -z "$FQDN" ]; then
    FQDN="$(hostname -f)"
fi
if  [ -z "$DATABASES" ]; then
    DATABASES="potholder"
fi

## FQDN for server
FQDN=$(whiptail --title "Get the Server's External Address" --inputbox "Enter your FQDN:" 8 60 "$FQDN" 3>&1 1>&2 2>&3) || exit 1
save_conf
DC=$(fqdn_to_dc $FQDN)

## Databases
DATABASES=$(whiptail --title "List the databases available" --inputbox "List of databases separated by space:" 8 60 "$DATABASES" 3>&1 1>&2 2>&3) || exit 1
save_conf

## USERS
maybe_make_user "auth-shared" "auth-shared"

maybe_make_user "caddy" "caddy"
usermod -aG auth-shared caddy

maybe_make_user "authelia" "authelia"
usermod -aG auth-shared authelia

maybe_make_user "lldap" "lldap"
usermod -aG auth-shared lldap

maybe_make_user "couchdb" "couchdb"
usermod -aG auth-shared couchdb

# AUTH-SHARED
# shared auth between caddy and couchdb
# new secret generated each time and services restarted to pick it up
mkdir -p /etc/auth-shared
chmod 750 /etc/auth-shared

# Shared between couchdb and caddy:
cat > /etc/auth-shared/auth-shared.env << EOFAUTH
# Token shared by caddy and couchdb
# owned bty group auth-shared
# both authelia and couchdb must be members of auth-shared
#
# groupadd auth-shared
# Add both service users to the group
# usermod -aG auth-shared caddy
# usermod -aG auth-shared couchdb
#
# Set ownership and permissions (readable only by owner & group)
# chown -R auth-shared:auth-shared /etc/auth-shared
# chmod 750 /etc/auth-shared
# chmod 640 /etc/auth-shared/shared.env

# Generated on $(date)
COUCHDB_SECRET= $(random_string)
EOFAUTH

chown -R auth-shared:auth-shared /etc/auth-shared
chmod 640 /etc/auth-shared/auth-shared.env

# Shared between lldap and authelia:
auth2=$(random_string)
LLDAP_PASS=$(get_password "User Manager (LLDAP)" "Set Admin password" "$LLDAP_PASS") || exit 1
save_conf
cat > /etc/auth-shared/auth-shared2.env << EOFAUTH2
# Token shared by authelia and lldap
# these two must match
LLDAP_JWT_SECRET="$auth2"
AUTHELIA_IDENTITY_VALIDATION_RESET_PASSWORD_JWT_SECRET="$auth2"
# just for session
AUTHELIA_SESSION_SECRET="$(random_string)"
# these two must match
AUTHELIA_AUTHENTICATION_BACKEND_LDAP_PASSWORD="$LLDAP_PASS"
LLDAP_LDAP_USER_PASS="$LLDAP_PASS"
EOFAUTH2
echo "EOFAUTH2"

chmod 640 /etc/auth-shared/auth-shared2.env

## COUCHDB
# install
apt install -y curl gnupg apt-transport-https
curl -fsSL https://couchdb.apache.org/repo/keys.asc | gpg --dearmor --yes -o /usr/share/keyrings/couchdb-archive-keyring.gpg
source /etc/os-release
echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ ${VERSION_CODENAME} main" | tee /etc/apt/sources.list.d/couchdb.list
# 1. Pre-seed debconf to "none" mode so apt stays silent
debconf-set-selections <<EOFDEB
couchdb couchdb/mode select none
couchdb couchdb/mode seen true
EOFDEB

# 2. Install CouchDB non-interactively
apt update
DEBIAN_FRONTEND=noninteractive apt install -y couchdb

# 3. Write configuration directly to /opt/couchdb/etc/local.d/10-admin.ini
COUCHDB_PASS=$(get_password "CouchDB Administrator" "Select an admin password" "$COUCHDB_PASS")
save_conf
cat > /opt/couchdb/etc/local.d/10-admin.ini 640 <<EOFCOUCHDB
[admins]
admin = ${COUCHDB_PASS}

[chttpd_auth]
secret = \${COUCHDB_SECRET}
authentication_handlers = {chttpd_auth, cookie_authentication_handler}, {couch_httpd_auth, proxy_authentication_handler}, {chttpd_auth, default_authentication_handler}
x_auth_username = X-Auth-CouchDB-UserName
x_auth_roles = X-Auth-CouchDB-Roles
x_auth_token = X-Auth-CouchDB-Token
proxy_use_secret = false

[couch_httpd_auth]
secret = \${COUCHDB_SECRET}

[cors]
headers = accept, authorization, content-type, origin, referer
methods = GET, PUT, POST, HEAD, DELETE
origins = *
credentials = true

[chttpd]
enable_cors = false
port = 5984
bind_address = 127.0.0.1
authentication_handlers = {chttpd_auth, cookie_authentication_handler}, {chttpd_auth, proxy_authentication_handler}, {chttpd_auth, default_authentication_handler}
EOFCOUCHDB
chown couchdb:couchdb /opt/couchdb/etc/local.d/10-admin.ini

# Modify systemd service file to use environment variables
mkdir -p /etc/systemd/system/couchdb.service.d
cat << 'EOFCOUCH' | tee /etc/systemd/system/caddy.service.d/override.conf  
[Service]
EnvironmentFile=-/etc/auth-shared/auth-shared.env
EOFCOUCH

# Restart CouchDB to apply settings and trigger automatic password hashing
systemd_restart "couchdb"

## LLDAP
# Download and install from the repository
echo 'deb http://download.opensuse.org/repositories/home:/Masgalor:/LLDAP/Debian_13/ /' | tee /etc/apt/sources.list.d/home:Masgalor:LLDAP.list
curl -fsSL https://download.opensuse.org/repositories/home:Masgalor:LLDAP/Debian_13/Release.key | gpg --dearmor --yes | tee /etc/apt/trusted.gpg.d/home_Masgalor_LLDAP.gpg > /dev/null
apt update
apt install lldap

# Set up the environment
cat > /etc/lldap/lldap.env << EOFLLDAPENV
# Don't change this key seed unless you want to reset the user password database
LLDAP_KEY_SEED="wrekjthwe,krjths,d"
LLDAP_DATABASE_URL="sqlite:///var/lib/lldap/lldap.db?mode=rwc"
LLDAP_LDAP_USER_PASS="${LLDAP_PASS}"
LLDAP_HTTP_URL=lldap."${FQDN}""
EOFLLDAPENV
chown -R kkdap:lldap /etc/lldap
chmod 644 /etc/lldap/*

# Modify systemd service file to use environment variables
mkdir -p /etc/systemd/system/lldap.service.d
cat << 'EOFLLDAP' | tee /etc/systemd/system/caddy.service.d/override.conf  
[Service]
EnvironmentFile=-/etc/lldap/lldap.env
EnvironmentFile=-/etc/auth-shared/auth-shared2.env
EOFLLDAP

## restart lldap
systemd_restart "lldap"

## AUTHELIA
#Install
apt install ca-certificates curl gnupg
curl -fsSL https://www.authelia.com/keys/authelia-security.gpg -o /usr/share/keyrings/authelia-security.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/authelia-security.gpg] https://apt.authelia.com stable main" | tee /etc/apt/sources.list.d/authelia.list
apt update
apt install -y authelia

mkdir -p /etc/authelia
cp configuration.yml /etc/authelia/configuration.yml
cp authelia.env /etc/authelia/authelia.env
chown -R authelia:authelia /etc/authelia
chmod 644 /etc/authelia/*

# database directory
sudo install -d -m 0750 -o authelia -g authelia /var/lib/authelia

# Modify systemd service file to use environment variables
mkdir -p /etc/systemd/system/authelia.service.d
cat << 'EOFAUTHELIA' | sudo tee /etc/systemd/system/authelia.service.d/override.conf  
[Service]
EnvironmentFile=-/etc/auth-shared/auth-shared2.env
EnvironmentFile=-/etc/authelia/authelia.env
EOFAUTHELIA

# start service
systemd_restart "authelia"

# CADDY
# install caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
apt install caddy -y
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy -y

# Create Caddyfile
mkdir -p /etc/caddy

cat > /etc/caddy/Caddyfile << 'EOFCADDYFILE'
# Caddyfile

# Reverse proxy to Authelia
auth.{$BASE_DOMAIN} {
    handle {
        reverse_proxy 127.0.0.1:9091
    }
}

# Reusable Authelia Forward-Auth Snippet
(authelia_auth) {
    forward_auth 127.0.0.1:9091 {
        uri /api/authz/forward-auth
        copy_headers Remote-User Remote-Groups Remote-Name Remote-Email
    }
}

# lldap web admin -- security there
lldap.{$BASE_DOMAIN} {
    # Reverse proxy to the LLDAP Web UI port
    reverse_proxy localhost:17170
    # Recommended security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
    }
}

# Couchdb Fauxton (admin console) access
couchdb.{$BASE_DOMAIN} {
    log {
        output stdout
        format console
    }
    import authelia_auth
    @to_util {
        path /
        vars_regexp {query} ^$
    }

    redir @to_util /_utils/ 302

    handle_path /* {
        reverse_proxy localhost:5984 {
            header_up X-Auth-CouchDB-UserName "admin"
            header_up X-Auth-CouchDB-Roles "_admin"
            header_up X-Auth-CouchDB-Token "{$COUCHDB_SECRET}"
        }
    }
}

couchdb-replication.{$BASE_DOMAIN} {
    log {
        output stdout
        format console
    }
    @allowed_replicators remote_ip 147.185.239.227
    handle @allowed_replicators {
        reverse_proxy localhost:5984
    }
    handle {
        respond 403
    }
}

# Database applications:
(couchdb_db) {
    # Match the first host segment before the first dot on incoming requests
    @first_part header_regexp sub Host ^([a-zA-Z0-9-]+)\.

    # 1. Match requests that REQUIRE authentication (exclude static assets)
    @protected {
        path /couchdb/* /api/me
    }

    # 2. Forward ONLY @protected requests to Authelia
    forward_auth @protected 127.0.0.1:9091 {
        uri /api/authz/forward-auth
        copy_headers Remote-User Remote-Groups Remote-Name Remote-Email
    }

    # 3. Lightweight session-check endpoint for client-side JS
    handle /auth-status {
        rewrite * /api/authz/forward-auth
        reverse_proxy 127.0.0.1:9091 {
            header_up X-Forwarded-Method GET
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
            header_up X-Forwarded-Uri /
        }
    }

    # 4. Proxy requests to CouchDB backend
    handle_path /couchdb/* {
        rewrite @first_part /{re.sub.1}{uri}
        reverse_proxy localhost:5984 {
            header_up Host {upstream_hostport}
            header_up X-Real-IP {remote_host}
            header_up X-Auth-CouchDB-UserName {header.Remote-User}
            header_up X-Auth-CouchDB-Roles "member"
            header_up X-Auth-CouchDB-Token "{$COUCHDB_SECRET}"
        }
    }

    # 5. User Identity endpoint (fixed double slash typo)
    handle /api/me {
        header Content-Type application/json

        @unauthorized expression {header.Remote-User} == ""
        respond @unauthorized `{"error": "Unauthorized"}` 401

        respond `{"username": "{header.Remote-User}", "name": "{header.Remote-Name}", "email": "{header.Remote-Email}", "groups": "{header.Remote-Groups}"}` 200
    }

    # 6. Static File Server (Bypassed static assets land here directly)
    handle {
        root * /srv/potholder_walled
        encode gzip zstd
        file_server
    }
}

# Domain for each database
{$APP_DOMAINS} {
    import couchdb_db
}

{$BASE_DOMAIN} {
    redir / /index.html 302

    @dbname {
        path_regexp db ^/({$APP_NAMES})(?:/(.*))?$
    }
    redir @dbname https://{re.db.1}.{$BASE_DOMAIN}/{re.db.2} 302

    root * /srv/potholder_walled
    file_server
}
EOFCADDYFILE

cat > /etc/caddy/caddy.env << EOFCADDYENV
BASE_DOMAIN="${FQDN}"
# list of couchdb databases
APP_NAMES="$(echo "$DATABASES" | tr ' ' '|' )"

# name of subdomain associated with each database
APP_DOMAINS=$(for name in $DATABASES; do echo -n "$name.${FQDN} "; done)
EOFCADDYENV

# Set standard secure file and directory permissions
chmod 755 /etc/caddy
chmod 644 /etc/caddy/*
chown -R caddy:caddy /etc/caddy
sudo mkdir -p /var/lib/caddy
sudo chown -R caddy:caddy /var/lib/caddy

# Modify systemd service file to use environment variables
mkdir -p /etc/systemd/system/caddy.service.d
cat << 'EOFCADDY' | sudo tee /etc/systemd/system/caddy.service.d/override.conf  
[Service]
Environment="CADDYPATH=/var/lib/caddy"
Environment="XDG_DATA_HOME=/var/lib/caddy/.local/share"
Environment="XDG_CONFIG_HOME=/var/lib/caddy/.config"
EnvironmentFile=-/etc/caddy/caddy.env
EnvironmentFile=-/etc/auth-shared/auth-shared.env
EOFCADDY

# start service
systemd_restart "caddy"
