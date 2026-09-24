#!/bin/env bash

# Setup for secure environment for potholder
# Paul H Alfille 2026
# https://github.com/alfille/github_walled

# Basically sets up caddy, authelia, lldap and couchdb

# Check if the effective user ID is 0 using the 'id -u' command
if [ "$(id -u)" -ne 0 ]; then
  echo "Error: This script must be run as root or with sudo." >&2
  # Try to suggest how to run it if sudo is available and the user isn't already root
  if command -v sudo >/dev/null 2>&1 && [ "$(id -u)" -ne 0 ]; then
    echo "Please run: sudo \"$0\" \"$@\"" >&2
  fi
  exit 1
fi

# Create a random alphanumeric string
random_string() {
  tr -dc 'A-Za-z0-9' < dev/urandom| head -c 32
  echo
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
    if [ -z "$user" ]; then
        echo "Error: No username provided to maybe_make_user." >&2
        return 1
    fi

    # Check if user exists, otherwise create
    if id "$user" >/dev/null 2>&1; then
        echo "$user"
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

# Helper: Prompt for confirmation if file exists
confirm_overwrite() {
    local target_file="$1"

    if [ -f "$target_file" ]; then
        local reply
        read -r -p "File '$target_file' already exists. Overwrite? [y/N] " reply
        case "$reply" in
            [yY][eE][sS]|[yY])
                return 0 # Proceed with overwrite
                ;;
            *)
                echo "Skipped '$target_file'." >&2
                return 1 # Abort write
                ;;
        esac
    fi
    return 0 # File doesn't exist, proceed
}

# Wrapper: Read stdin and write to target file if confirmed
safe_write() {
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

# install caddy
apt install caddy -y
maybe_make_user "caddy" "caddy"
mkdir -p /etc/caddy
cp -i Caddyfile /etc/caddy/Caddyfile

if [ ! -f /etc/caddy/caddy.env
