const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

// router.get("/getAnswer", async (req, res) => {
//     const { answer_id } = req.query;
//     try {
//         // Truy vấn để lấy thông tin về câu trả lời với id đã cung cấp
//         const getAnswerSql = `SELECT * FROM answer WHERE id = ${answer_id}`;
//         const answer = await query(getAnswerSql);

//         if (answer.length === 0) {
//             // Nếu không tìm thấy câu trả lời, trả về mã lỗi 404 và thông báo lỗi
//             res.status(404).json({ error: "Không tìm thấy câu trả lời" });
//         } else {
//             // Truy vấn để kiểm tra xem câu trả lời có phải là câu trả lời đúng không
//             const isCorrectSql = `SELECT * FROM correct_answer WHERE answer_id = ${answer_id}`;
//             const correctAnswer = await query(isCorrectSql);

//             // Trả về thông tin về câu trả lời và trạng thái của checkbox
//             res.status(200).json({ answer: answer[0], is_correct: correctAnswer.length > 0 });
//         }
//     } catch (error) {
//         console.error("Lỗi khi lấy thông tin câu trả lời:", error);
//         res.status(500).json({ error: "Có lỗi xảy ra khi lấy thông tin câu trả lời" });
//     }
// });

router.get("/getAnswersForQuestion", async (req, res) => {
    const { question_id } = req.query;
    try {
        // Truy vấn để lấy danh sách các câu trả lời cho câu hỏi có question_id đã cung cấp
        const getAnswersSql = `SELECT a.*, ca.question_id IS NOT NULL AS is_correct
                               FROM answer a
                               LEFT JOIN correct_answer ca ON a.id = ca.answer_id
                               WHERE a.question_id = ${question_id}`;
        const answers = await query(getAnswersSql);

        // Trả về danh sách các câu trả lời với trạng thái câu đúng hoặc sai
        res.status(200).json({ answers });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách câu trả lời:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi lấy danh sách câu trả lời" });
    }
});

router.post("/createAnswer", async (req, res) => {
    const { question_id, content, is_correct } = req.query;
    try {
        const addAnswerSql = `INSERT INTO answer (question_id, content) VALUES (${question_id}, '${content}')`;
        const result = await query(addAnswerSql);
        const answerId = result.insertId;

        if (is_correct == 1) {
            const addCorrectAnswerSql = `INSERT INTO correct_answer (question_id, answer_id) VALUES (${question_id}, ${answerId})`;
            await query(addCorrectAnswerSql);
        }

        res.status(201).json({ message: "Câu trả lời đã được tạo thành công", answer_id: answerId });
    } catch (error) {
        console.error("Lỗi khi tạo câu trả lời:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi tạo câu trả lời" });
    }
});

router.get('/deleteAnswer', async (req, res) => {
    const { answer_id } = req.query;

    try {
        const deleteCorrectAnswerSql = `DELETE FROM correct_answer WHERE answer_id = ${answer_id}`;
        await query(deleteCorrectAnswerSql);

        const deleteAnswerSql = `DELETE FROM answer WHERE id = ${answer_id}`;
        await query(deleteAnswerSql);

        res.status(200).json({ message: "Câu trả lời đã được xóa thành công" });
    } catch (error) {
        console.error("Lỗi khi xóa câu trả lời:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi xóa câu trả lời" });
    }
});

router.get('/updateAnswer', async (req, res) => {
    const { answer_id, new_content } = req.query;

    try {
        // Cập nhật nội dung của câu trả lời trong bảng 'answer'
        const updateAnswerSql = `UPDATE answer SET content = '${new_content}' WHERE id = ${answer_id}`;
        await query(updateAnswerSql);

        res.status(200).json({ message: "Nội dung câu trả lời đã được cập nhật thành công" });
    } catch (error) {
        console.error("Lỗi khi cập nhật nội dung câu trả lời:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật nội dung câu trả lời" });
    }
});

router.get("/updateCorrectAnswer", async (req, res) => {
    const { answer_id, is_correct } = req.query;
    try {
        // Bước 1: Lấy question_id của câu trả lời từ bảng answer
        const getQuestionIdSql = `SELECT question_id FROM answer WHERE id = ${answer_id}`;
        const questionResult = await query(getQuestionIdSql);
        const question_id = questionResult[0].question_id;

        // Bước 2: Xóa answer_id của câu trả lời sai (nếu có) từ bảng correct_answer
        if (is_correct === "0") {
            const deleteIncorrectAnswerSql = `DELETE FROM correct_answer WHERE answer_id = ${answer_id}`;
            await query(deleteIncorrectAnswerSql);
        }

        // Bước 3: Nếu is_correct là 1, thêm answer_id của câu trả lời đúng vào bảng correct_answer
        if (is_correct === "1") {
            // Đầu tiên, kiểm tra xem answer_id đã tồn tại trong bảng correct_answer chưa
            const checkAnswerIdSql = `SELECT * FROM correct_answer WHERE answer_id = ${answer_id}`;
            const existingAnswer = await query(checkAnswerIdSql);

            // Nếu answer_id chưa tồn tại trong bảng correct_answer, thêm mới
            if (existingAnswer.length === 0) {
                const addCorrectAnswerSql = `INSERT INTO correct_answer (question_id, answer_id) VALUES (${question_id}, ${answer_id})`;
                await query(addCorrectAnswerSql);
            }
        }

        res.status(200).json({ message: "Đã cập nhật trạng thái câu trả lời thành công", question_id: question_id });
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái câu trả lời:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật trạng thái câu trả lời" });
    }
});

module.exports = router;