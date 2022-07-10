#/bin/bash

# set -ex

rm -rf .data
yarn codegen
yarn build
docker-compose down
docker-compose up -d postgres
sleep 5
docker-compose pull subquery-node graphql-engine && docker-compose up subquery-node graphql-engine
