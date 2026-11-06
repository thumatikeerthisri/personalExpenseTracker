const mongoose = require("mongoose");

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Education",
  "Healthcare",
  "Entertainment",
  "Salary",
  "Investment",
  "Freelance",
  "Other"
];

const transactionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      required: true,
      enum: categories
    },
    type: { type: String, required: true, enum: ["income", "expense"] },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
module.exports.categories = categories;
