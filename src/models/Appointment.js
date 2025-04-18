const { Schema, model } = require("mongoose");

const schema = new Schema({
    first_name : {
        type : String
    },
    last_name : {
        type : String
    },
    dob : {
        type : Date
    },
    gender : {
        type : String
    },
    marital_status : {
        type : String
    },
    mobile : {
        type : Number
    },
    patient_name : {
        type : String
    },
    appointment_date:{
        type : Date
    },
    payment_gateway_request : {
        type : String
    },
    payment_gateway_response : {
        type : String
    },
    payment_mode : {
        type : String
    },
    payment_status : {
        type : String
    }
},  {timestamps : true});


module.exports = new model('Appointment', schema);