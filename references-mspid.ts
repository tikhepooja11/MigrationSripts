import mongoose from "mongoose";
import { config } from "./config/config";
import { MongoClient } from "mongodb";
import mysql from "mysql";
import _ from "lodash";

mongoose.set("strictQuery", true);

//  part 1: connect to mysql task DB
const con = mysql.createConnection({
  host: "track-buyerassist.cogei7jo5kw0.ap-south-1.rds.amazonaws.com",
  user: "admin",
  password: "llXraVgBqC93aSqj",
  database: "alignx_thor",
});

//  part 2: connect to mongoDB
MongoClient.connect(config.mongo.url)
  .then(async (client) => {
    const connect = await client
      .db("annotation-thor")
      .collection("annotations")
      .find({
        annotationType: "COMMENTS",
        references: {
          $elemMatch: { referenceType: "TASK" },
        },
      })
      .toArray();

    enum refType {
      COMMENTS = "COMMENTS",
      MSP = "MSP",
    }
    type referencesArray = {
      id: string;
      referenceType: refType;
      primaryAttachedSource?: boolean;
    };
    const tasksIds = connect.map((item) => {
      const myObj = JSON.parse(JSON.stringify(item.references[0]));
      return "'" + myObj.id + "'";
    });
    console.log("taskIds List: ", tasksIds);

    //  now get mspIds of all taskIds in single database hit
    type mysqlDbResult = {
      id: string;
      mspId: string;
    };
    const dbResult: mysqlDbResult[] = [];
    con.connect(function (err) {
      if (err) console.log("error in connecting mysql task DB", err);
      console.log("Successfully connected to mysql TASK database");
      con.query(
        `SELECT mspId,id FROM task WHERE id IN(${tasksIds})`,
        async function (err, rows) {
          if (err) console.log(err);
          for (const row of rows) {
            const jsonRowDataPacket = JSON.parse(JSON.stringify(row));
            dbResult.push(jsonRowDataPacket);
          }
          console.log("dbResult", dbResult);

          for (const item of connect) {
            let mspReference = {} as referencesArray;
            console.log("myid:  ", item._id);
            let referencesArray1: referencesArray[] = JSON.parse(
              JSON.stringify(item.references)
            );
            dbResult.forEach((result) => {
              const filteredRef = referencesArray1.find(
                (a) => a.id === result.id
              );
              if (filteredRef) {
                mspReference = {
                  id: result.mspId,
                  referenceType: refType.MSP,
                };
              }
            });
            referencesArray1.push(mspReference);
            referencesArray1 = _.uniqWith(referencesArray1, _.isEqual);
            console.log("updatedReferences", referencesArray1);
            client
              .db("annotation-thor")
              .collection("annotations")
              .updateMany(
                { _id: item._id, references: { $exists: true } },
                { $set: { references: referencesArray1 } }
              );
          }
        }
      );
      console.log("Added mspId into references successfully");
      con.end();
    });
    console.log("connected to annotation-thor database");
  })
  .catch((error) =>
    console.log("Error in connecting to annotation-thor DB", error)
  );
