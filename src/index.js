const express = require('express');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const http = require('http');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');
require('dotenv').config();

const db = require('./db');
const models = require('./models');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;

// get the user info from a JWT
const getUser = (token) => {
  if (token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Session invalid');
    }
  }
};

async function startApolloServer(typeDefs, resolvers) {
  const app = express();
  db.connect(DB_HOST);
  app.use(helmet());
  app.use(cors());

  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
    context: async ({ req }) => {
      const token = req.headers.authorization;
      const user = getUser(token);
      return { models, user };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/api' });
  await new Promise((resolve) => httpServer.listen({ port }, resolve));
  console.log(
    `🚀 GraphQL Server ready at http://localhost:${port}${server.graphqlPath}`
  );
}

startApolloServer(typeDefs, resolvers);
