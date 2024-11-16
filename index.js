const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");

const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@restaurant.rf6ld.mongodb.net/?retryWrites=true&w=majority&appName=Restaurant`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db("Restaurants").collection("users");
    const menuCollection = client.db("Restaurants").collection("Menu");
    const reviewsCollection = client.db("Restaurants").collection("Reviwes");
    const cardsCollection = client.db("Restaurants").collection("cards");

    // user collection Api Methods
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/restaurants", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const results = await reviewsCollection.find().toArray();
      res.send(results);
    });
    // Cards Collections
    app.get("/cards", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const results = await cardsCollection.find(query).toArray();
      res.send(results);
    });
    app.post("/cards", async (req, res) => {
      const cardItem = req.body;
      const result = await cardsCollection.insertOne(cardItem);
      res.send(result);
    });
    app.delete("/cards/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cardsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connectionc
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.listen(port, () => {
  console.log(`Welcome to the API ${port}`);
});
