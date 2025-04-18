const { default: mongoose, Schema } = require("mongoose");
const policyschema = new Schema(
    {
        url: {
            type: String
        },
        title: {
            type: String
        },
        description: {
            type: String
        }
    }, { timestamps: true }
);
const emmodule = mongoose.model('Policy', policyschema);
module.exports = emmodule;