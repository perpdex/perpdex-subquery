rm -rf .data
yarn codegen
yarn build
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker-compose up -d postgres
sleep 5
docker-compose pull subquery-node graphql-engine && docker-compose up subquery-node graphql-engine