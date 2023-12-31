const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 7000;

// middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://work-atlas.web.app",
      "https://work-atlas.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a4caxts.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const categoryCollection = client.db("Categorires").collection("Category");
    const jobCollection = client.db("JobsDB").collection("Jobs");
    const appliedJobCollection = client.db("JobsDB").collection("appliedJobs");
    const serviceJobCollection = client
      .db("JobServices")
      .collection("services");
    const hiringJobCollection = client.db("JobServices").collection("hiring");
    const clientsJobCollection = client.db("JobServices").collection("clients");

    app.get("/categories", async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/jobServices", async (req, res) => {
      const cursor = serviceJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/hiring", async (req, res) => {
      const cursor = hiringJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/clients", async (req, res) => {
      const cursor = clientsJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobsByCategory", async (req, res) => {
      const query = {};
      const category = req.query.category;
      if (category && category !== "All Jobs") {
        query.category = category;
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/allJobs", async (req, res) => {
      const search = req.query.search;
      const query = {};
      if (search) {
        query.jobTitle = { $regex: search, $options: "i" };
      }
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });
    app.get("/appliedJobs", verifyToken, async (req, res) => {
      const userEmail = req.query?.email;
      const query = { email: userEmail };
      const category = req.query.category;
      if (category && category !== "All Jobs") {
        query.category = category;
      }
      const result = await appliedJobCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/myJobs", verifyToken, async (req, res) => {
      const userId = req.query.userId;
      const query = { userId: userId };
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });
    app.put("/job/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateJob = req.body;
      const options = { upsert: true };
      const job = {
        $set: {
          jobTitle: updateJob.jobTitle,
          category: updateJob.category,
          salaryRange: updateJob.salaryRange,
          companyLogo: updateJob.companyLogo,
          jobDetails: updateJob.jobDetails,
          applicationDeadline: updateJob.applicationDeadline,
          jobBanner: updateJob.jobBanner,
        },
      };
      const result = await jobCollection.updateOne(filter, job, options);
      res.send(result);
    });
    app.patch("/applied/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const job = { $inc: { NumberOfApplicants: 1 } };
      const result = await jobCollection.updateOne(filter, job);
      res.send(result);
    });
    app.post("/allJobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });
    app.post("/appliedJobs", async (req, res) => {
      const appliedJob = req.body;
      const result = await appliedJobCollection.insertOne(appliedJob);
      res.send(result);
    });

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ status: true });
    });

    app.delete("/allJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
  res.send("Work Atlas is running");
});

app.listen(port, () => {
  console.log("Work Atlas is running on port", port);
});
