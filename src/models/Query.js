const mongoose = require("mongoose");
const { Schema } = mongoose;

const qschema = new Schema(
    {
        name: { type: String },
        mobile: { type: String },
        city: { type: String },
        message: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Query", qschema);
