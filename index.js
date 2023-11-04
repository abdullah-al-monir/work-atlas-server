const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 7000;

// middleware
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Work Atlas is running");
});

app.listen(port, () => {
  console.log("Work Atlas is running on port", port);
});
