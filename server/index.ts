import express from 'express';
import { handler } from '../build/handler.js';
import { createServer } from 'node:http';
import setupWebSockets from './setupWebSockets';

const app = express();
const server = createServer(app);

setupWebSockets(server);

app.use(handler);

server.listen(3000, () => {
  console.log('listening on port 3000');
});
