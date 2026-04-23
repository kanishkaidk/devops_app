import { io } from "socket.io-client";

// In our environment, the portal and server share the same origin
const socket = io();

export default socket;
