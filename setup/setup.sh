#!/bin/env bash

# Setup for secure environment for potholder
# Paul H Alfille 2026
# https://github.com/alfille/github_walled

# Basically sets up caddy, authelia, lldap and couchdb

random_string() {
	tr -dc 'A-Za-z0-9' < dev/urandom| head -c 32
	echo
}

# install caddy

apt install caddy -y
mkdir -p /etc/caddy
if [ ! -f /etc/caddy/caddy.env
