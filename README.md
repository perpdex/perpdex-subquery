# perpdex-subquery

This repository contains the SubQuery project for [PerpDEX](https://perpdex.com/).

## Local Development

### Environment

- [Typescript](https://www.typescriptlang.org/) are required to compile project and define types.

- Both SubQuery CLI and generated Project have dependencies and require [Node](https://nodejs.org/en/).

### Install the SubQuery CLI

Install SubQuery CLI globally on your terminal by using NPM:

```
npm install -g @subql/cli
```

Run help to see available commands and usage provide by CLI

```
subql help
```

### Build and Run

```
yarn install
yarn codegen
yarn build
docker-compose pull && docker-compose up
```

### Query

Open your browser and head to `http://localhost:3000`.

Finally, you should see a GraphQL playground is showing in the explorer and the schemas that ready to query.

The following is an example of querying entity Deposited.
```graphql
query {
  depositeds {
    nodes {
      id
      txHash
      trader
      amount
      blockNumberLogIndex
      blockNumber
      timestamp
    }
  }
}
```
## Contribution

Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## Related Projects
- [perpdex-contract](https://github.com/perpdex/perpdex-contract)
- [perpdex-oracle-contract](https://github.com/perpdex/perpdex-oracle-contract)
- [perpdex-subgraph](https://github.com/perpdex/perpdex-subgraph)