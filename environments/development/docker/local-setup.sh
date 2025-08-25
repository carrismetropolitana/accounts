#!/bin/bash

echo "+----------------------------------------------+"
echo "|    Initializing MongoDB Entrypoint Script    |"
echo "+----------------------------------------------+"

mongosh <<EOF
use admin

// Initialize the replica set
rs.initiate()

while (!rs.isMaster().ismaster) {
	sleep(1000);
}

db.createUser({
 	user: "root",
 	pwd: "root",
 	roles: ["root"]
})
EOF

mongorestore production --drop --gzip --archive=/dump/db.dump

mongosh <<EOF
use production

db.accounts.createIndex({ 'devices.device_id': 1 });
db.accounts.createIndex({ 'widgets.data.id': 1 });
db.accounts.createIndex({ 'widgets.data.type': 1 });
EOF

echo "+----------------------------------------------+"
echo "|      MongoDB replica set initialized         |"
echo "+----------------------------------------------+"