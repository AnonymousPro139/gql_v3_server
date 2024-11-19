import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connect("mongodb://localhost:27017/gql", {
      useNewUrlParser: true,
    });
  } catch (err) {
    console.log("Mongodb error:", err);
  }
};
export default connectDB;
