const express = require("express");
const { query } = require("../config/config");

const router = express.Router();
router.use(express.json());

router.get('/', async (req, res) => {
    try {
        var search = req.query.search;

        var sql = !search ? `SELECT * FROM student` :
        `SELECT * FROM student 
        WHERE firstname LIKE '%${search}%' OR lastname LIKE '%${search}%'`;

        var result = await query(sql);
            res.json({students: result});
    } catch(error) {
        res.json(error);
    }
})

router.post('/add', async (req, res) => {
    try {
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        if(!firstname || !lastname) throw Error("Don't have argument");
        
        var result = await query(`INSERT INTO student (firstname, lastname) 
        VALUES ('${firstname}', '${lastname}')`);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
})

router.post('/update', async (req, res) => {
    try {
        var id = req.body.id;
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        if(!id || !firstname || !lastname) throw Error("Don't have argument");
        
        var result = await query(`UPDATE student SET 
        firstname = '${firstname}', lastname = '${lastname}'
        WHERE id = '${id}'`);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
})

router.get('/delete', async (req, res) => {
    try {
        var id = req.query.id;
        if(!id) throw Error("Don't have argument");
        
        var result = await query(`DELETE FROM student WHERE id = '${id}'`);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
})

router.get('/examcontent', async (req, res) => {
    try {
        const exam_id = req.query.exam_id;
        if(!exam_id) throw Error("Don't have agrument");

        var sql = `SELECT * FROM exam WHERE exam.id = ${exam_id}`;
        var result = await query(sql);
        var exam = result[0];

        sql = `SELECT random_question.*, answer.id as answer_id, 
        answer.content as answer_content, correct.correct_answer_no 
        FROM (SELECT * FROM question WHERE question.exam_id = ${exam_id} 
        ORDER BY RAND() LIMIT ${exam.question_no}) AS random_question 
        JOIN answer ON random_question.id = answer.question_id 
        JOIN (SELECT correct_answer.question_id, COUNT(correct_answer.answer_id) AS correct_answer_no 
        FROM correct_answer GROUP BY correct_answer.question_id) AS correct 
        ON correct.question_id = random_question.id;`
        result = await query(sql);

        var questions = [];
        if(result.length > 0) {
            questions.push({
                id: result[0].id,
                content: result[0].content,
                correct_answer_no: result[0].correct_answer_no,
                answers: [{
                    id: result[0].answer_id,
                    content: result[0].answer_content
                }]
            });
            for (let i = 1; i < result.length; i++) {
                if(result[i].id == questions[questions.length - 1].id)
                    questions[questions.length - 1].answers.push({
                        id: result[i].answer_id,
                        content: result[i].answer_content
                    });
                else
                    questions.push({
                        id: result[i].id,
                        content: result[i].content,
                        correct_answer_no: result[i].correct_answer_no,
                        answers: [{
                            id: result[i].answer_id,
                            content: result[i].answer_content
                        }]
                    });
            }
        }
        exam.questions = questions;

        res.json(exam);
    } catch (error) {
        res.json(error);
    }
})

router.post('/calcgrade', async (req, res) => {
    try {
        const body = req.body;
        let score = 0;
        const MAX_POINT = 10;
        if(body.questions.length > 0) {
            let sql = `SELECT exam.question_no, correct_answer.question_id, 
            correct_answer.answer_id FROM exam
            JOIN question ON question.exam_id = exam.id
            JOIN correct_answer ON correct_answer.question_id = question.id
            WHERE exam.id = ${body.exam_id}`;
            const result = await query(sql);

            sql = `SELECT correct_answer.question_id, COUNT(correct_answer.question_id) AS correct_answer_no
            FROM correct_answer
            JOIN question ON question.id = correct_answer.question_id
            WHERE question.exam_id = ${body.exam_id}
            GROUP BY correct_answer.question_id`;
            const correct = await query(sql);

            const QUESTION_POINT = MAX_POINT / result[0].question_no;
            for (let i = 0; i < body.questions.length; i++) {
                const question = body.questions[i];
                var correct_answer_no = 0;
                for (let i = 0; i < correct.length; i++) {
                    const row = correct[i];
                    if(question.id == row.question_id) {
                        correct_answer_no = row.correct_answer_no;
                        break;
                    }
                }

                if(correct_answer_no == 0) continue;
                if(correct_answer_no != question.answers.length) continue;

                let count = 0;
                question.answers.forEach(answer_id => {
                    for (let j = 0; j < result.length; j++) {
                        const row = result[j];
                        if(question.id == row.question_id && answer_id == row.answer_id) {
                            ++count;
                            break;
                        }
                    }
                    if(count == correct_answer_no) {
                        score += QUESTION_POINT;
                        count = 0;
                    }
                });
            }
        }
        console.log(score);

        let sql = `INSERT INTO result (student_id, exam_id, grade)
        VALUES ('${body.student_id}','${body.exam_id}','${score}')`;

        res.json(await query(sql));
    } catch (error) {
        console.log(error);
        res.json({});
    }
})

// Không được viết code sau dòng này
module.exports = router;