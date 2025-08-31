const mongoose = require("mongoose");
const pusher = require("./../utils/pusherObject");
const notiServices = require("./../services/notificationServices");
const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: [true, "A notification must belong to a user"],
    },
    type: {
      type: String,
      enum: [
        "follow",
        "comment",
        "like post",
        "like comment",
        "reply comment",
        "share post",
        "message",
      ],
      required: [true, "Notification type must be declared"],
    },
    actors: [
      {
        type: String,
      },
    ],
    image: String,
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      require: [true, "A notification must contain content id"],
    },
    subContentId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipient: 1 });

NotificationSchema.post("save", async function (doc, next) {
  const populate = await notiServices.populateNotificationContent(doc);
  let sentData = { ...doc._doc };
  sentData.populate = populate;
  const channel = doc.recipient.toString();
  if (!sentData.read) {
    await pusher.trigger(channel, "notifications:new", sentData);
  }
  next();
});
const NotificationModel = mongoose.model("Notification", NotificationSchema);

module.exports = NotificationModel;
