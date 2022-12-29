import mongoose from "mongoose";
import { config } from "./config/config";
import { MongoClient } from "mongodb";

//now connect to mongoDB
mongoose.set("strictQuery", true);
MongoClient.connect(config.mongo.url)
  .then(async (client) => {
    console.log("hello connected to annotation-thor database");
    const pipeline = [
      { $match: { annotationType: "COMMENTS" } },
      {
        $addFields: {
          refid: { $toObjectId: "$reference.id" },
        },
      },
      {
        $lookup: {
          from: "annotations",
          localField: "refid",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $unwind: {
          path: "$result",
        },
      },
    ];

    const aggCursor = client
      .db("annotation-thor")
      .collection("annotations")
      .aggregate(pipeline);

    console.log("aggregation cursor", aggCursor);

    enum refType {
      COMMENTS = "COMMENTS",
      MSP = "MSP",
    }
    type referencesArray = {
      id: string;
      referenceType: refType;
      primaryAttachedSource?: boolean;
    };

    if (aggCursor) {
      await aggCursor.forEach((item) => {
        const refArray: referencesArray[] = [
          {
            id: item.result.reference.id,
            referenceType: item.result.reference.type,
            primaryAttachedSource: true,
          },
        ];

        client
          .db("annotation-thor")
          .collection("annotations")
          .updateMany({ _id: item._id }, { $set: { references: refArray } });
        console.log("updated document with id -> ", item._id);
      });
    } else {
      console.log("cursor array is empty");
    }
  })
  .catch((err) => {
    console.log("error", err);
  });
