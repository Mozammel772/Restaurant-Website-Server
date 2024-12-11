const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
var jwt = require("jsonwebtoken");
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

    // jwt authorization Apl
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middleware
    const verifyToken = (req, res, next) => {
      console.log("insert verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
      // next();
    };

    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // user collection Api Methods
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      console.log("query", query);
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send("User already exists");
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedUser = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(query, updatedUser);
      res.send(result);
    });

    // app.post("/users", async (req, res) => {
    //   try {
    //     const user = req.body;

    //     // Basic validation
    //     if (!user.email || !user.name) {
    //       return res.status(400).send("Missing required fields");
    //     }

    //     // Check if user already exists
    //     const query = { email: user.email };
    //     const existingUser = await userCollection.findOne(query);
    //     if (existingUser) {
    //       return res.status(400).send("User already exists");
    //     }

    //     // Insert new user
    //     const result = await userCollection.insertOne(user);

    //     // Respond with success
    //     res.status(201).send({ message: "User created successfully", userId: result.insertedId });
    //   } catch (error) {
    //     console.error("Error inserting user:", error);
    //     res.status(500).send("Internal Server Error");
    //   }
    // });

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
