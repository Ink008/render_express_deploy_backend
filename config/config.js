const mysql = require("mysql");
const Client_URL = "http://localhost:3000";

const connection = mysql.createConnection({
    host: "us-cluster-east-01.k8s.cleardb.net",
    user: "b62cd45bd6fa49",
    password: "0e49a496",
    database: "heroku_d7cf4e1e07a6b59" 
});

//Dùng hàm này để truy vấn sql
function query(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, result) => {
            if(err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

module.exports = {
    Client_URL: Client_URL,
    query: query
}