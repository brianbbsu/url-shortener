#!/bin/bash
set -ex

cd "$(dirname "$0")"

if [ ! -d ./test/ ]; then
    mkdir test
fi

cp ./src/* ./test/
cp ./test_server.js ./test/

cat > ./test/config.json << 'EOF'
{
    "gcp_project": "url-redirect-bb",
    "OAuth_client_id": "932478565653-a54e4pb8auqb6p0jo0kqnjdbqpuchnuq.apps.googleusercontent.com",
    "base_url": "http://localhost:3000/?key=",
    "allowed_user" : ["brianbb.su@gmail.com"]
}
EOF

if [ ! -d ./test/node_modules/ ]; then
    (cd test && npm install)
fi

# Start datastore emulator if not running
if ! curl -s 'localhost:8081'; then
    gcloud beta emulators datastore start --data-dir=$(mktemp -d) > /dev/null 2>&1 &
fi

# Deploy function
$(gcloud beta emulators datastore env-init)
(cd test && node test_server.js)
