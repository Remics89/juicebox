const PORT = 3000;
const express = require('express');
const server = express();
const morgan = require('morgan');

server.use(morgan('dev'));
server.use(express.json());

const apiRouter = require('./api');
server.use('/api', apiRouter);

const { client } = require('./db');
client.connect();

server.listen(PORT, () => {
    console.log("Server is listening on port", PORT);
})

