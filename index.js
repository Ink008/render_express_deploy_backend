const express = require("express");
const http = require('http');
const examController = require('./controller/ExamController')
const questionController = require('./controller/QuestionController')
const answerController = require('./controller/AnswerController')
const teachers = require('./controller/teacher')
const students = require('./controller/student')
const hocsinh = require('./controller/hocsinh')

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.json({
        message: "this is the API"
    })
})

//Thêm Controller ở đây
app.use('/teachers', teachers);
app.use('/students', students);
app.use('/exam', examController);
app.use('/question', questionController);
app.use('/answer', answerController);
app.use('/hocsinh', hocsinh);


server.listen(port, () => {
    console.log(`http://localhost:${port}`);
});