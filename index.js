const express = require("express");
const http = require('http');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.json({
        message: "Hello world"
    })
})

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});