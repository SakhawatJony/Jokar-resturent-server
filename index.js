const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT||5000;

// MIDLEWARE

app.use(cors());
app.use(express.json());

const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorized access'})
  }
  const token = authorization.split('')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({err:true,message:'unauthorized access'})
    }
    req.decoded=decoded;
    next()
  })


}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tw8naco.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const menuCollection = client.db("joka10resturent").collection("menu");
    const userCollection = client.db("joka10resturent").collection("users");
    const reviewsCollection = client.db("joka10resturent").collection("reviews");
    const cartsCollection = client.db("joka10resturent").collection("carts");
  
    //  jwt post method
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
  res.send({token})

    }) 

    // Warning: use verifyJWT before using verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    app.get('/users', verifyJWT,verifyAdmin,async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    app.post('/users',async (req,res)=>{
      const user = req.body;
      const query = {email:user.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message:'user already exists'})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);


    })

    // admin user  

    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id;
       const filter = {_id: new ObjectId(id)};
       const updateDoc = {
        $set:{
          role: 'admin'
        }
       };
       const result = await userCollection.updateOne(filter,updateDoc);
       res.send(result);

    })

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })


    app.get('/menu', async (req, res) => {
        const result = await menuCollection.find().toArray();

        res.send(result);
        
    });
 

    app.get('/reviews', async (req, res) => {
        const result = await reviewsCollection.find().toArray();

        res.send(result);
        
    });
    app.get('/carts', verifyJWT,async(req,res)=>{
      const email = req.query.email;
      if(!email){
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error:true,message:'probiden access'})
      }
      const query = {email:email};
      const result = await cartsCollection.find(query).toArray();
      res.send(result);


    })
    app.post('/carts',async(req,res)=>{
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result)


    })
    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('jokar10 resturent is sitting')
})

app.listen(port,()=>{
console.log(`Jokar10 is sitting on port${port}`)

})