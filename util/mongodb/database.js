const mongodb = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const MongoClient = mongodb.MongoClient;
let _db;

const mongoConnect = callback => {
  MongoClient.connect(process.env.MONGODB_URL)
    .then((client) => {
      console.log("Connected to MongoDb!!");
      _db = client.db(); //creates connection pool
      callback();
    })
    .catch((err) => console.log(err));
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found!";
};

module.exports = {
  mongoConnect,
  getDb,
};
