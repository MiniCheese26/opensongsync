import api from './api';
import express from 'express';
import { handler } from '../build/handler.js';

const app = express();

app.use('/api/jobs', api);

app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});
