import { handler } from '../build/handler.js';
import express from 'express';
import api from './api';

const app = express();

app.use('/api/jobs', api);

app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});
