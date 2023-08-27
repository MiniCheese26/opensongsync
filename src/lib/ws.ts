import { PUBLIC_DOMAIN, PUBLIC_HTTPS } from '$env/static/public';
import { io } from 'socket.io-client';

const scheme = PUBLIC_HTTPS.toLowerCase() === 'true' ? 'wss://' : 'ws://';

const socket = io(scheme + PUBLIC_DOMAIN);

export default socket;
