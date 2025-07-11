const mongoose = require("mongoose");
const schema = mongoose.Schema

const Userschema = new schema({
    user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
        required: true,
    },
    transaction_type: {
        type: String,
        required: true,
    },
    token_img: {
        type: String,
    },
    token_name: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        required: true,
    },
    trx_amount: {
        type: Number,
        required: true,
    },
    bill_id: {
        type: String,
        required: true,
    },
    datetime: {
        type: Date,
        required: true,
    },
    status: {
        type: Boolean,
        required: true,
    }
}, { timestamp : true})

module.exports = mongoose.model('bill', Userschema)