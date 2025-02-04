const mongoose = require("mongoose");

const blockListSchema = mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const BlockList = mongoose.model("BlockList", blockListSchema);

module.exports = BlockList;
