const express = require("express");
const { query } = require("../config/config");
const e = require("express");

const router = express.Router();

router.get('/getQuestionsForExam', async (req, res) => {
    const { exam_id } = req.query;

    try {
        // Truy vấn danh sách các câu hỏi cho một bài thi cụ thể
        const getQuestionsSql = `
            SELECT q.id, q.content
            FROM question q
            JOIN exam e ON q.exam_id = e.id
            WHERE q.exam_id = ${exam_id}
        `;
        const questions = await query(getQuestionsSql);

        res.status(200).json({ questions });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách câu hỏi cho bài thi:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi lấy danh sách câu hỏi cho bài thi" });
    }
});

router.get('/createQuestion', async (req, res) => {
    const { exam_id, content } = req.query;

    try {
        // Kiểm tra xem exam_id có tồn tại trong bảng exam không
        const examCheckSql = `SELECT * FROM exam WHERE id = '${exam_id}'`;
        const examCheckResult = await query(examCheckSql);
        if (examCheckResult.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy bài thi tương ứng" });
        }

        // Thêm câu hỏi mới vào bảng question
        const addQuestionSql = `INSERT INTO question (exam_id, content) VALUES('${exam_id}', '${content}')`;
        const result = await query(addQuestionSql);
        const questionId = result.insertId;

        res.status(201).json({ message: "Câu hỏi đã được tạo thành công", question_id: questionId });
    } catch (error) {
        console.error("Lỗi khi tạo câu hỏi:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi tạo câu hỏi" });
    }
});

router.get('/deleteQuestion', async (req, res) => {
    const { exam_id, question_id } = req.query;

    try {
        const checkQuestionSql = `SELECT * FROM question WHERE id = ${question_id} AND exam_id = ${exam_id}`;
        const questionResult = await query(checkQuestionSql);

        if (questionResult.length === 0) {
            res.status(404).json({ error: "Câu hỏi không tồn tại trong kỳ thi" });
            return;
        }

        const deleteQuestionSql = `DELETE FROM question WHERE id = ${question_id} AND exam_id = ${exam_id}`;
        await query(deleteQuestionSql);

        res.status(200).json({ message: "Câu hỏi đã được xóa khỏi kỳ thi thành công" });
    } catch (error) {
        console.error("Lỗi khi xóa câu hỏi khỏi kỳ thi:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi xóa câu hỏi khỏi kỳ thi" });
    }
});

router.get('/updateQuestion', async (req, res) => {
    const { exam_id, question_id, new_content } = req.query;

    try {
        const checkQuestionSql = `SELECT * FROM question WHERE id = ${question_id} AND exam_id = ${exam_id}`;
        const questionResult = await query(checkQuestionSql);

        if (questionResult.length === 0) {
            res.status(404).json({ error: "Câu hỏi không tồn tại trong kỳ thi" });
            return;
        }

        const updateQuestionSql = `UPDATE question SET content = '${new_content}' WHERE id = ${question_id} AND exam_id = ${exam_id}`;
        await query(updateQuestionSql);

        res.status(200).json({ message: "Nội dung của câu hỏi đã được cập nhật thành công" });
    } catch (error) {
        console.error("Lỗi khi cập nhật nội dung câu hỏi:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật nội dung câu hỏi" });
    }
});

router.get('/search', async (req, res) => {
    try {
        var searchTerm = req.query.searchTerm;

        var sql = !searchTerm ? `SELECT * FROM question` :
            `SELECT * FROM question WHERE content LIKE '%${searchTerm}%'`;

        var result = await query(sql);
        res.json({ questions: result });
    } catch (error) {
        res.json(error);
    }
})

module.exports = router;