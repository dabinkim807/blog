const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const db = require('./db/db-connection.js');

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "Hello! This is Dana's template ExpressJS with React-Vite" });
});

app.get('/api/posts', async (req, res) => {
    try {
        const { rows: posts } = await db.query('SELECT * FROM posts ORDER BY post_id ASC');
        res.send(posts);
    } catch (e) {
        return res.status(400).send(String(e));
    }
});
app.get('/api/comments', async (req, res) => {
    try {
        const { rows: comments } = await db.query('SELECT * FROM comments ORDER BY comment_id ASC');
        res.send(comments);
    } catch (e) {
        return res.status(400).send(String(e));
    }
});
app.get('/api/users', async (req, res) => {
    try {
        const { rows: users } = await db.query('SELECT * FROM users ORDER BY user_id ASC');
        res.send(users);
    } catch (e) {
        return res.status(400).send(String(e));
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const result = await db.query(
            "INSERT INTO posts(date, title, author, post_body) VALUES(NOW(), $1, $2, $3) RETURNING *",
            [req.body.title, req.body.author, req.body.post_body]
        );
        const returnObj = {
            post_id: result.rows[0].post_id,
            date: result.rows[0].date,
            title: req.body.title,
            author: req.body.author,
            post_body: req.body.post_body
        }
        return res.status(200).json(returnObj);
    } catch (e) {
        return res.status(400).send(String(e));
    }
});
app.post('/api/comments', async (req, res) => {
    try {
        const result = await db.query(
            "INSERT INTO comments(date, comment, comment_author, post_id) VALUES(NOW(), $1, $2, $3) RETURNING *",
            [req.body.comment, req.body.comment_author, req.body.post_id]
        );

        const findPost = await db.query("SELECT * FROM posts WHERE post_id = $1", [req.body.post_id]);

        const returnObj = {
            comment_id: result.rows[0].comment_id,
            date: result.rows[0].date,
            comment: req.body.title,
            comment_author: req.body.author,
            post_id: findPost.rows[0].post_id
        }
        return res.status(200).json(returnObj);
    } catch (e) {
        return res.status(400).send(String(e));
    }
});
app.post('/api/users', async (req, res) => {
    try {
        const result = await db.query("INSERT INTO users(name) VALUES($1) RETURNING *", [req.body.name]);
        const returnObj = {
            user_id: result.rows[0].user_id,
            name: req.body.name
        }
        return res.status(200).json(returnObj);
    } catch (e) {
        return res.status(400).send(String(e));
    }
});

// app.delete('/api/students/:studentId', async (req, res) => {
//     try {
//         const studentId = req.params.studentId;
//         await db.query('DELETE FROM students WHERE id=$1', [studentId]);
//         console.log("From the delete request-url", studentId);
//         res.status(200).end();
//     } catch (e) {
//         console.log(e);
//         return res.status(400).json({ e });

//     }
// });

// app.put('/api/students/:studentId', async (req, res) =>{
//     //console.log(req.params);
//     //This will be the id that I want to find in the DB - the student to be updated
//     const studentId = req.params.studentId
//     const updatedStudent = { id: req.body.id, firstname: req.body.firstname, lastname: req.body.lastname, iscurrent: req.body.is_current}
//     console.log("In the server from the url - the student id", studentId);
//     console.log("In the server, from the react - the student to be edited", updatedStudent);
//     // UPDATE students SET lastname = "something" WHERE id="16";
//     const query = `UPDATE students SET firstname=$1, lastname=$2, is_current=$3 WHERE id=${studentId} RETURNING *`;
//     const values = [updatedStudent.firstname, updatedStudent.lastname, updatedStudent.iscurrent];
//     try {
//       const updated = await db.query(query, values);
//       console.log(updated.rows[0]);
//       res.send(updated.rows[0]);
  
//     }catch(e){
//       console.log(e);
//       return res.status(400).json({e})
//     }
//   })

app.listen(PORT, () => {
    console.log(`Hello, my server is listening on ${PORT}`);
});