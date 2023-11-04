const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb');

// middleware
app.use(cors({
    origin: [
        // 'http://localhost:5173'
        'https://student-info-server-bay.vercel.app',
        'student-info-server-2aaxx9hne-habibs-projects-f48ee51a.vercel.app'
    ],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());

// const logged =  
// verifyToken here
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({
            message: 'Unauthorized access'
        })
    }
    jwt.verify(token, process.env.COOKIES_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: 'Unauthorized access'
            })
        }
        req.user = decoded;
        next()
    });
    
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zauwwqb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // database collection here
        const studentCollection = client.db('studentDB').collection('studentInfo');
        const userCollection = client.db('studentDB').collection('user');


        app.post('/api/createToken/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.COOKIES_TOKEN, {
                expiresIn: '1h'
            });

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ message: 'Success' })
        })



        // all data get
        app.get('/studentInfo', verifyToken, async (req, res) => {
            const queryEmail = req.query?.email;
            const tokenEmail = req.user?.email;

            if (queryEmail !== tokenEmail) {
                return res.status(403).send({
                    message: 'Forbidden'
                })
            }

            let query = {};
            if (queryEmail) {
                query = { userEmail: queryEmail }
            }

            const cursor = studentCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // single data get
        app.get('/studentInfo/:id',  async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await studentCollection.findOne(query);
            res.send(result);
        })

        // post 
        app.post('/studentInfo', async (req, res) => {

            const studentData = req.body;
            const result = await studentCollection.insertOne(studentData);
            res.send(result);
        })

        // put (update)
        app.put('/studentInfo/:id', async (req, res) => {
            const id = req.params.id;
            const studentNewData = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateData = {
                $set: {
                    student_name: studentNewData.student_name,
                    student_email: studentNewData.student_email,
                    gender: studentNewData.gender,
                    status: studentNewData.status
                },
            }
            const result = await studentCollection.updateOne(filter, updateData, options);
            res.send(result);
        })

        // delete
        app.delete('/studentInfo/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await studentCollection.deleteOne(query);
            res.send(result);
        })

        // *---users--- *
        // get 
        app.get('/users', async (req, res) => {

            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        
        // post 
        app.post('/users', async (req, res) => {
            const userData = req.body;
             const result = await userCollection.insertOne(userData);
             res.send(result);
        })

        // patch (update)
        app.patch('/users', async (req, res) => {
            const userData = req.body;
            const filter = { email: userData.email };
            const updateUser = {
                $set: {
                    lastLoginAt: userData.lastLoginAt
                }
            }
            const result = await userCollection.updateOne(filter, updateUser);
            res.send(result);
        })

        //logOut
        app.post('/api/logOut', async (req, res) => {
            const user = req.body;
            res
                .clearCookie('token', { maxAge: 0 })
                .send({ message: 'logOut completed' })
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({
            ping: 1
        });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Student info server')
})

app.listen(port, () => {
    console.log(`student info server on port: ${port}`);
})