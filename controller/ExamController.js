const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

// Thêm exam
router.get('/createExam', async (req, res) => {
    const { creator_id, name, duration, question_no } = req.query;
    try {
        // Chuyển đổi thời gian từ phút thành định dạng giờ:phút:giây
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const seconds = 0; // Giây được thiết lập mặc định là 0
        const timeInTimeFormat = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const insertExamSql = `INSERT INTO exam (creator_id, name, time, question_no) 
                                VALUES (${creator_id}, '${name}', '${timeInTimeFormat}', ${question_no})`;
        await query(insertExamSql);

        res.status(200).json({ message: "Bài kiểm tra đã được tạo thành công" });
    } catch (error) {
        console.error("Lỗi khi tạo bài kiểm tra:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi tạo bài kiểm tra" });
    }
});

// Xóa exam
router.get('/deleteExam', async (req, res) => {
    const { id } = req.query;
    try {
        const sql = `DELETE FROM exam WHERE id = ${id}`;
        await query(sql);
        res.status(200).json({ message: "Bài thi đã được xóa thành công" });
    } catch (error) {
        console.error("Lỗi khi xóa bài thi:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi xóa bài thi" });
    }
});

router.get('/getExam', async (req, res) => {
    const { id } = req.query;

    try {
        const sql = `SELECT * FROM exam WHERE id = ${id}`;
        const result = await query(sql);
        if (result.length === 0) {
            res.status(404).json({ error: "Không tìm thấy bài thi" });
        } else {
            res.status(200).json({ exam: result[0] });
        }
    } catch (error) {
        console.error("Lỗi khi lấy thông tin bài thi:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi lấy thông tin bài thi" });
    }
});

// Lấy danh sách các bài thi của giáo viên
router.get('/getTeacherExams', async (req, res) => {
    const { creator_id } = req.query;

    try {
        const sql = `SELECT * FROM exam WHERE creator_id = ${creator_id}`;
        const result = await query(sql);
        res.status(200).json({ exams: result });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bài thi của giáo viên:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi lấy danh sách bài thi của giáo viên" });
    }
});

// Sửa thông tin bài thi
router.get('/updateExam', async (req, res) => {
    const { creator_id, exam_id, name, duration, question_no } = req.query;

    // Kiểm tra xem creator_id có được truyền vào hay không
    if (!creator_id) {
        return res.status(400).json({ error: "Thiếu thông tin creator_id" });
    }

    try {
        const checkExamSql = `SELECT * FROM exam WHERE id = ${exam_id}`;
        const exam = await query(checkExamSql);

        if (exam.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy bài kiểm tra" });
        }

        const checkOwnershipSql = `SELECT * FROM exam WHERE id = ${exam_id} AND creator_id = ${creator_id}`;
        const owner = await query(checkOwnershipSql);

        if (owner.length === 0) {
            return res.status(403).json({ error: "Bạn không có quyền sửa thông tin bài kiểm tra này" });
        }

        // Chuyển đổi thời gian từ phút thành định dạng giờ:phút:giây
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const seconds = 0; // Giây được thiết lập mặc định là 0
        const timeInTimeFormat = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const updateExamSql = `UPDATE exam 
                               SET name = '${name}', 
                                   time = '${timeInTimeFormat}', 
                                   question_no = ${question_no}
                               WHERE id = ${exam_id}`;
        await query(updateExamSql);

        res.status(200).json({ message: "Thông tin bài kiểm tra đã được cập nhật thành công" });
    } catch (error) {
        console.error("Lỗi khi cập nhật thông tin bài kiểm tra:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật thông tin bài kiểm tra" });
    }
});

// Tìm kiếm bài thi
router.get('/search', async (req, res) => {
    try {
        var searchTerm = req.query.searchTerm;

        var sql = !searchTerm ? `SELECT * FROM exam` :
            `SELECT * FROM exam WHERE name LIKE '%${searchTerm}%'`;

        var result = await query(sql);
        res.json({ exams: result });
    } catch (error) {
        res.json(error);
    }
})

module.exports = router;
