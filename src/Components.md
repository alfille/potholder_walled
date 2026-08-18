# Components

Although there are many ways to set up a database server, we will use a simple and secure scheme:

![](Components.png)

## Server

This is a computer, real or virtual, that talks to the network and runs the database.

## Software

* Operating system
  * Linux (which will be the example), Windows or Macintosh
  * All these program exist for all 3 operating systems
  * Development and testing was solely on Linux
  * Linux has no purchase cost or licensing fees
* Web Server
  * [Caddy](https://caddyserver.com/) is used
  * Automatic procures security certificates
  * Easy SSL security (_https_)
  * Free and lightweight
* Database
  * [CouchDB](https://couchdb.apache.org/)
  * Replicates with devices automatically
  * Stores data
  * Communication is kept internal (via _Caddy_)
* Potholder
  * Javascript App
  * Stays in Web Browser
  * Loaded automatically on first visit to website
  * Runs locally on device
  * Kept in device cache
  * No calls to external resources
* SSH
  * Optional way to administer server from network
  * Secure communication
  * Alternative is physical access (keyboard and screen)