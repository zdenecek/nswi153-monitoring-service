export const typeDefs = `#graphql
  type Query {
    projects: [Project!]!
    status(
      monitorIdentifier: String!
      from: Int
      to: Int
    ): [Status!]
  }

  type Project {
    identifier: ID!
    label: ID!
    description: ID!
    monitors: [Monitor!]
  }

  type Monitor {
    identifier: ID!
    periodicity: Int
    label: ID!
    type: String!
    host: String
    url: String
    badgeUrl: String!
  }

  type Status {
    date: String!
    ok: Boolean!
    responseTime: Int
  }
`; 