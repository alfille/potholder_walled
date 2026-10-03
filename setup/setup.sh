#!/bin/env bash

# Setup for secure environment for potholder
# Paul H Alfille 2026
# https://github.com/alfille/github_walled

# Basically sets up caddy, authelia, lldap and couchdb

## Test ROOT
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
apt install --yes whiptail

## FQDN (fully qualified domain name)
fqdn_to_dc() {
  local domain="${1%.}"          # Strip trailing dot if present
  local dc="dc=${domain//./,dc=}" # Replace all '.' with ',dc='
  echo "$dc"
}
FQDN=$(whiptail --title "Get the Server's External Address" --inputbox "Enter your FQDN:" 8 60 $(hostname -f) 3>&1 1>&2 2>&3)
DC=$(fqdn_to_dc $FQDN)

echo $FQDN $DC

# Create a random alphanumeric string
random_string() {
  tr -dc 'A-Za-z0-9' < /dev/urandom| head -c 32
  echo
}

## UTILITIES
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
    cat <<EOFOVE
The file 
.   $target 
.   .     already exists.

Do you want to replace it?
EOFOVE
}
    

# Helper: Prompt for confirmation if file exists
confirm_overwrite() {
    local target_file="$1"

    if [ -f "$target_file" ]; then
        if whiptail --title "Confirm Overwrite" --yesno "$(overwrite_text "$target_file")" 15 70
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
        whiptail --title "Confirm Overwrite"  --yesno "$(overwrite_text "$dest")" 15 70 || return 1
    fi
    cp "$src" "$dest"
}

get_password() {
    local title="$1"
    local prompt="$2"
    local pw1 pw2
    while :; do
        pw1=$(whiptail --title "${title}" --passwordbox "${prompt}:" 10 60 3>&1 1>&2 2>&3) || exit 1
        if [ "${#pw1}" -lt 8 ]; then
            whiptail --title "${title}" --msgbox "Password must be at least 8 characters" 10 60  >&2
            continue
        fi

        pw2=$(whiptail --title "${title}" --passwordbox "Repeat Admin password:" 10 60 3>&1 1>&2 2>&3) || exit 1

        if [ "$pw1" != "$pw2" ]; then
            whiptail --title "${title}" --msgbox "Passwords do not match" 10 60  >&2
            continue
        fi

        printf '%s\n' "$pw1"
        return 0
    done
}       

## GIT repository
apt install git
if [ -d "/srv/potholder_walled" ]; then
    pushd "/srv/potholder_walled"
    git pull
else
    pushd "/srv"
    git clone https://github.com/alfille/potholder_walled
    chown -R www-data:www-data potholder_walled
fi
popd

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
systemctl restart caddy
systemctl restart couchdb

# Shared between lldap and authelia:
auth2=$(random_string)
authpsw=$(get_password "User Manager (LLDAP)" "Set Admin password") || exit 1
cat > /etc/auth-shared/auth-shared2.env << EOFAUTH2
# Token shared by authelia and lldap
# these two must match
LLDAP_JWT_SECRET="$auth2"
AUTHELIA_IDENTITY_VALIDATION_RESET_PASSWORD_JWT_SECRET="$auth2"
# just for session
AUTHELIA_SESSION_SECRET="$(random_string)"
# these two must match
AUTHELIA_AUTHENTICATION_BACKEND_LDAP_PASSWORD="$authpsw"
LLDAP_LDAP_USER_PASS="$authpsw"
EOFAUTH2

chmod 640 /etc/auth-shared/auth-shared2.env
systemctl restart lldap
systemctl restart authelia

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
maybe_copy Caddyfile /etc/caddy/Caddyfile

# file to create database entries in caddy
maybe_copy env-setup.sh /etc/caddy/env-setup.sh
chmod +x /etc/caddy/env-setup.sh
chown -R caddy:caddy /etc/caddy

# Set standard secure file and directory permissions
chmod 755 /etc/caddy
chmod 644 /etc/caddy/Caddyfile

# Modify systemd service file to use environment variables
mkdir -p /etc/systemd/system/caddy.service.d
cat << 'EOFCADDY' | sudo tee /etc/systemd/system/caddy.service.d/override.conf  
[Service]
RuntimeDirectory=caddy
RuntimeDirectoryMode=0755
ExecStartPre=/etc/caddy/env-setup.sh
EnvironmentFile=-/etc/auth-shared/auth-shared.env
EnvironmentFile=-/run/caddy/caddy.env
EOFCADDY

# start service
systemctl daemon-reload
systemctl enable caddy
systemctl restart caddy

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
systemctl daemon-reload
systemctl enable authelia
systemctl restart authelia

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
password=$(get_password "CouchDB Administrator" "Select an admin password")
safe_write "/opt/couchdb/etc/local.d/10-admin.ini" 640 <<EOFCOUCH
[admins]
admin = ${password}

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
EOFCOUCH

# Modify systemd service file to use environment variables
mkdir -p /etc/systemd/system/couchdb.service.d
cat << 'EOFCOUCH' | tee /etc/systemd/system/caddy.service.d/override.conf  
[Service]
EnvironmentFile=-/etc/auth-shared/auth-shared.env
EOFCOUCH

# 4. Set ownership to couchdb user & group
chown couchdb:couchdb /opt/couchdb/etc/local.d/10-admin.ini

# 5. Restart CouchDB to apply settings and trigger automatic password hashing
systemctl daemon-reload
systemctl enable couchdb
systemctl restart couchdb

## LLDAP
# Download and install the repository signing key
echo 'deb http://download.opensuse.org/repositories/home:/Masgalor:/LLDAP/Debian_13/ /' | tee /etc/apt/sources.list.d/home:Masgalor:LLDAP.list
curl -fsSL https://download.opensuse.org/repositories/home:Masgalor:LLDAP/Debian_13/Release.key | gpg --dearmor --yes | tee /etc/apt/trusted.gpg.d/home_Masgalor_LLDAP.gpg > /dev/null

apt update
apt install lldap

chown lldap:lldap /etc/lldap/lldap.env

# Modify systemd service file to use environment variables
mkdir -p /etc/systemd/system/lldap.service.d
cat << 'EOFLLDAP' | tee /etc/systemd/system/caddy.service.d/override.conf  
[Service]
EnvironmentFile=-/etc/lldap/lldap.env
EnvironmentFile=-/etc/auth-shared/auth-shared2.env
EOFLLDAP

systemctl daemon-reload
systemctl enable lldap
systemctl restart lldap
