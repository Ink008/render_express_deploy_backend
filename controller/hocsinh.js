const express = require("express");
const { query } = require("../config/config");

const router = express.Router();
router.use(express.json());

router.get('/login', async (req, res) => {
    try {
        const { studentId, password } = req.query;
        // Thực hiện kiểm tra mã số sinh viên và mật khẩu trong cơ sở dữ liệu
        const sql = `SELECT * FROM student WHERE id = '${studentId}' AND password = '${password}'`;
        const result = await query(sql);
        if (result.length === 0) {
            throw new Error('Mã số sinh viên hoặc mật khẩu không chính xác.');
        }
        // Đăng nhập thành công, có thể thực hiện các hành động cần thiết
        res.status(200).json({ message: 'Đăng nhập thành công' });
    } catch(error) {
        res.status(401).json({ error: error.message });
    }
})

router.post('/submitexam', async (req, res) => {
    try {
        const { answers } = req.body;
        // Thực hiện xử lý câu trả lời bài thi ở đây
        // Ví dụ: lưu câu trả lời vào cơ sở dữ liệu và tính điểm
        // Sau đó trả về kết quả nếu cần
        res.status(200).json({ message: 'Nộp bài thi thành công' });
    } catch(error) {
        res.status(500).json({ error: 'Đã có lỗi xảy ra khi xử lý bài thi.' });
    }
})


router.get('/score', async (req, res) => {
    const mssv = req.query.mssv;
    if (mssv){
        try {
            const sql = `SELECT result.id, result.grade, exam.name
            FROM result 
            INNER JOIN exam ON result.exam_id = exam.id
            WHERE result.student_id = '${mssv}';`;
            const scores = await query(sql);
            res.json(scores);
        } catch(error) {
            res.status(500).json({ error: 'Đã có lỗi xảy ra khi tải bảng điểm.' });
        }
    }else{
        res.status(500).json({ error: 'Vui lòng nhập MSSV' });
    }
})

router.get('/mssv', async (req, res) => {
    try {
        const sql = 'SELECT id FROM student'; // Lấy tất cả các ID từ bảng sinh viên
        const studentIds = await query(sql);
        res.json(studentIds); // Trả về danh sách các ID của sinh viên
    } catch(error) {
        res.status(500).json({ error: 'Đã có lỗi xảy ra khi tải danh sách sinh viên.' });
    }
});


router.get('/exam', async (req, res) => {
     try {
         const search = req.query.search;

         const sql = !search ? `SELECT * FROM exam` :
         `SELECT * FROM exam 
         WHERE name LIKE '%${search}%'`;

         const result = await query(sql);
         res.json(result);
     } catch(error) {
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

router.post('/totalgrade', async (req, res) => {
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