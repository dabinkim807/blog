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

app.get('/api/posts/:postID', async (req, res) => {
    const post_id = parseInt(req.params.postID);
    try {
        const { rows: posts } = await db.query('SELECT * FROM posts WHERE post_id = $1', [post_id]);
        const post = posts[0];
        const { rows: comments } = await db.query(
            `
            SELECT 
                c.comment_id,
                c.comment_date,
                c.comment,
                u.*
            FROM 
                comments c
                JOIN users u ON u.user_id = c.user_id
            WHERE post_id = $1
            ORDER BY comment_date DESC
            `
            , [post_id]
        );
        post["comments"] = comments;
        res.send(post);
    } catch (e) {
        return res.status(400).send(String(e));
    }
});

// nested for loop method - runtime: O(p * c), space: O(1)
app.get('/api/posts1', async (req, res) => {
    try {
        const { rows: posts } = await db.query('SELECT * FROM posts');
        const { rows: comments } = await db.query(
            `
            SELECT 
                c.*,
                u.*
            FROM 
                comments c
                JOIN users u ON u.user_id = c.user_id
            ORDER BY comment_date DESC
            `
        );
        
        let start = Date.now();
        
        for (let i = 0; i < posts.length; i++) {
            posts[i]["comments"] = [];
            for (let j = 0; j < comments.length; j++) {
                if (posts[i]["post_id"] === comments[j]["post_id"]) {
                    posts[i]["comments"].push(comments[j]);
                }
            }
        }
        let elapsed = Date.now() - start;

        res.json({elapsed: elapsed, posts: posts});
    } catch (e) {
        console.log(e);
        return res.status(400).send(String(e));
    }
});

// // 3 for loop + object method - runtime: O(p + c), space: O(p + c)
app.get('/api/posts2', async (req, res) => {
    try {
        const { rows: posts } = await db.query('SELECT * FROM posts');
        const { rows: comments } = await db.query(
            `
            SELECT 
                c.*,
                u.*
            FROM 
                comments c
                JOIN users u ON u.user_id = c.user_id
            ORDER BY comment_date DESC
            `
        );
        
        let start = Date.now();
        
        const ref = {};
        for (let i = 0; i < posts.length; i++) {
            ref[posts[i]["post_id"]] = [];
        }
        for (let i = 0; i < comments.length; i++) {
            ref[comments[i]["post_id"]].push(comments[i]);
        }
        for (let i = 0; i < posts.length; i++) {
            posts[i]["comments"] = ref[posts[i]["post_id"]];
        }

        let elapsed = Date.now() - start;

        res.json({elapsed: elapsed, posts: posts});
    } catch (e) {
        console.log(e);
        return res.status(400).send(String(e));
    }
});
        
// sort + while loop + for loop method - runtime: O(p + c), space: O(1)
app.get('/api/posts3', async (req, res) => {
    try {
        const { rows: posts } = await db.query('SELECT * FROM posts');
        for (let post of posts) {
            post["comments"] = [];
        }
        const { rows: comments } = await db.query(
            `
            SELECT 
                c.*,
                u.*
            FROM 
                comments c
                JOIN users u ON u.user_id = c.user_id
            ORDER BY post_id ASC, comment_date DESC
            `
        );
        
        let start = Date.now();
        
        let i = 0;
        let j = 0; 
        while (i < posts.length && j < comments.length) {
            // posts[i]["comments"] = [];
            if (posts[i]["post_id"] === comments[j]["post_id"]) {
                posts[i]["comments"].push(comments[j]);
                j++;
            } else {
                i++;
            }
        }
        
        // while (i < posts.length) {
        //     posts[i]["comments"] = [];
        //     i++;
        // }

        let elapsed = Date.now() - start;

        res.json({elapsed: elapsed, posts: posts});
    } catch (e) {
        console.log(e);
        return res.status(400).send(String(e));
    }
});

// app.get('/api/do_not_use_more_than_once', async (req, res) => {
//     try {
//         const numPosts = 10000;
//         const avgCommentsPerPost = 10;
//         let postIds = [];
//         for ( let i = 0; i < numPosts; i++) {
//             const res = await db.query(
//                 "INSERT INTO posts(post_date, title, author, post_body) VALUES(NOW(), $1, $2, $3) RETURNING *",
//                 [`T${i}`, "Dana", "K"]
//             );
//             postIds.push(res.rows[0].post_id);
//         }
//         for ( let i = 0; i < numPosts * avgCommentsPerPost; i++ ) {
//             let pid = Math.floor(Math.random() * numPosts)
//             db.query(
//                 "INSERT INTO comments(comment_date, comment, post_id, user_id) VALUES(NOW(), $1, $2, $3) RETURNING *",
//                 ["c", postIds[pid], 2]
//             );
//         }
//         return res.status(200).end();
//     } catch (e) {
//         return res.status(400).send(String(e));
//     }
// })


app.post('/api/posts', async (req, res) => {
    try {
        const result = await db.query(
            "INSERT INTO posts(post_date, title, author, post_body) VALUES(NOW(), $1, $2, $3) RETURNING *",
            [req.body.title, req.body.author, req.body.post_body]
        );
        const returnObj = {
            post_id: result.rows[0].post_id,
            post_date: result.rows[0].date,
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
            "INSERT INTO comments(comment_date, comment, post_id, user_id) VALUES(NOW(), $1, $2, $3) RETURNING *",
            [req.body.comment, req.body.post_id, req.body.user_id]
        );

        const findPost = await db.query("SELECT * FROM posts WHERE post_id = $1", [req.body.post_id]);
        const findUser = await db.query("SELECT * FROM users WHERE user_id = $1", [req.body.user_id]);

        const returnObj = {
            comment_id: result.rows[0].comment_id,
            comment_date: result.rows[0].comment_date,
            comment: req.body.comment,
            post_id: findPost.rows[0].post_id,
            user_id: findUser.rows[0].user_id
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





app.put('/api/posts/:postID', async (req, res) => {
    const post_id = parseInt(req.params.postID);
	try {
		await db.query(
			"UPDATE posts SET title = $1, author = $2, post_body = $3 WHERE post_id = $4 RETURNING *", 
			[req.body.title, req.body.author, req.body.post_body, post_id]
		);
	} catch(e) {
        console.log(e);
		return res.status(400).send(String(e));
	}
	return res.end();
});
app.put('/api/comments/:commentID', async (req, res) => {
    const comment_id = parseInt(req.params.commentID);
	try {
		await db.query(
			"UPDATE comments SET comment = $1 WHERE comment_id = $2 RETURNING *", 
			[req.body.comment, comment_id]
		);
	} catch(e) {
        console.log(e);
		return res.status(400).send(String(e));
	}
	return res.end();
});
app.put('/api/users/:userID', async (req, res) => {
    const user_id = parseInt(req.params.userID);
	try {
		await db.query(
			"UPDATE users SET name = $1 WHERE user_id = $2 RETURNING *", 
			[req.body.name, user_id]
		);
	} catch(e) {
        console.log(e);
		return res.status(400).send(String(e));
	}
	return res.end();
});

app.delete('/api/posts/:postID', async (req, res) => {
    const post_id = parseInt(req.params.postID);
	try {
		await db.query("DELETE FROM posts WHERE post_id = $1", [post_id]);
	} catch(e) {
		return res.status(400).send(String(e));
	}
	return res.end();
});
app.delete('/api/comments/:commentID', async (req, res) => {
    const comment_id = parseInt(req.params.commentID);
	try {
		await db.query("DELETE FROM comments WHERE comment_id = $1", [comment_id]);
	} catch(e) {
		return res.status(400).send(String(e));
	}
	return res.end();
});
app.delete('/api/users/:userID', async (req, res) => {
    const user_id = parseInt(req.params.userID);
	try {
		await db.query("DELETE FROM users WHERE user_id = $1", [user_id]);
	} catch(e) {
		return res.status(400).send(String(e));
	}
	return res.end();
});


app.listen(PORT, () => {
    console.log(`Hello, my server is listening on ${PORT}`);
});