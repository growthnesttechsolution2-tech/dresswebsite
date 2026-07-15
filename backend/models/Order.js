// const mongoose=require('mongoose');
// const orderSchema=new mongoose.Schema({
//   user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
//   items:[{product:{type:mongoose.Schema.Types.ObjectId,ref:'Product'},name:String,price:Number,quantity:Number,size:String,color:String,image:String}],
//   address:{fullName:String,phone:String,alternatePhone:String,address:String,city:String,district:String,state:String,pincode:String},
//   amount:Number,
//   paymentMethod:{type:String,enum:['Razorpay','Cash on Delivery']},
//   paymentStatus:{type:String,default:'Pending'},
//   razorpayPaymentId:String,
//   orderStatus:{type:String,default:'Order Placed'},
//   deliveryStatus:{type:String,default:'Order Placed'},
//   cancelReason:{type:String,default:''},
//   cancelledByAdmin:{type:Boolean,default:false},
// },{timestamps:true});
// module.exports=mongoose.model('Order',orderSchema);


const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
        size: String,
        color: String,
        image: String,
      },
    ],
    address: { type: Object, required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Scan & Pay", "Razorpay"],
      required: true,
      trim: true,
    },
    paymentStatus: { type: String, default: "Pending" },

    // NEW: store the UPI transaction ID / UTR number for manual verification
    transactionId: { type: String, default: null },

    orderStatus: { type: String, default: "Placed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
