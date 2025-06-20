const { Schema, model } = require("mongoose");
const oschema = new Schema({
    option : String
})
const schema = new Schema({
    test_name: {
        type: Schema.Types.ObjectId,
        ref : "Setting"
    },
    question: {
        type: String
    },
    options: [oschema],
},  {timestamps : true});
module.exports = new model('TestQuestion', schema);