const express = require("express");
const { query } = require("../config/config");

const router = express.Router();
router.use(express.json());

router.get('/', async (req, res) => {
    try {
        var search = req.query.search;

        var sql = !search ? `SELECT * FROM teacher` :
            `SELECT * FROM teacher WHERE username LIKE '%${search}%'
         OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%'`;

        var result = await query(sql);
        res.json({ teachers: result });
    } catch (error) {
        res.json(error);
    }
})

router.post('/add', async (req, res) => {
    try {
        var username = req.body.username;
        var password = req.body.password;
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        if (!username || !password || !firstname || !lastname)
            throw Error("Don't have argument");

        var result = await query(`INSERT INTO teacher (username, password, firstname, lastname) 
        VALUES ('${username}', '${password}', '${firstname}', '${lastname}')`);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
})

router.post('/update', async (req, res) => {
    try {
        var id = req.body.id;
        var password = req.body.password;
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        if (!id || !password || !firstname || !lastname)
            throw Error("Don't have argument");

        var result = await query(`UPDATE teacher SET 
        password = '${password}', firstname = '${firstname}', lastname = '${lastname}'
        WHERE id = '${id}'`);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
})

router.get('/delete', async (req, res) => {
    try {
        var id = req.query.id;
        if (!id) throw Error("Don't have argument");

        var result = await query(`DELETE FROM teacher WHERE id = '${id}'`);
        res.json(result);
    } catch (error) {
        res.json(error);
    }
})

router.get('/getTeacher', async (req, res) => {
    const { username, password } = req.query;

    try {
        // Thực hiện truy vấn SQL để lấy thông tin của teacher với username và password 
        const sql = `SELECT * FROM teacher WHERE Username = '${username}' AND Password = '${password}'`;
        const result = await query(sql);

        if (result.length === 0) {
            res.json({ user: null });
        } else {
            const user = result[0];
            res.json({ user });
        }
    } catch (error) {
        // Xử lý lỗi nếu truy vấn gặp vấn đề
        console.error("Lỗi truy vấn:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi truy vấn cơ sở dữ liệu" });
    }
});

router.get('/isTeacher', async (req, res) => {
    const { username, password } = req.query;

    try {
        const teacherSql = `SELECT * FROM teacher WHERE username = '${username}' AND password = '${password}'`;
        const teacherResult = await query(teacherSql);

        if (teacherResult.length > 0) {
            return res.status(200).json({ isTeacher: true });
        }

        const managerSql = `SELECT * FROM manager WHERE username = '${username}' AND password = '${password}'`;
        const managerResult = await query(managerSql);

        if (managerResult.length > 0) {
            return res.status(200).json({ isTeacher: false });
        }

        return res.status(200).json({ isTeacher: null });
    } catch (error) {
        console.error("Lỗi khi kiểm tra xem người dùng có phải là teacher hay không:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi kiểm tra thông tin" });
    }
});

// Không được viết code sau dòng này
module.exports = router;