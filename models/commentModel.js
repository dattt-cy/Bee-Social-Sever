const mongoose = require("mongoose");

const Post = require("./postModel");

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    maxLength: 1000,
    minLength: 1,
    trim: true,
    required: [true, "Please provide a Comment name"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: [true, "A comment must belong to a user"],
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post", // Reference to the Post model
    required: [true, "A comment must belong to a post"],
  },
  numLikes: {
    type: Number,
    default: 0,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment", // Reference to the Comment model
  },
  numReplies: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CommentSchema.statics.setNumComments = async function (postId) {
  let numComments = 0;
  if (postId) {
    numComments = await this.countDocuments({ post: postId });
  }
  await Post.findByIdAndUpdate(postId, { numComments: numComments });
};

CommentSchema.statics.setNumReplies = async function (commentId) {
  let numReplies = 0;
  if (commentId) {
    numReplies = await this.countDocuments({ parent: commentId });
  }
  await this.findByIdAndUpdate(commentId, { numReplies: numReplies });
};

//update numComments of Post when a comment is created
CommentSchema.post("save", async function (doc, next) {
  if (doc) {
    await doc.constructor.setNumComments(doc.post);
    if (doc.parent) {
      await doc.constructor.setNumReplies(doc.parent);
    }
  }

  next();
});

CommentSchema.pre(/^findOneAndDelete/, async function (next) {
  this.deletedComment = await this.model.findOne(this.getFilter());
  next();
});
//update numComments of Post when a comment is deleted
CommentSchema.post(/^findOneAndDelete/, async function (doc, next) {
  if (doc) {
    await this.deletedComment.constructor.setNumComments(
      this.deletedComment.post
    );
    if (this.deletedComment.parent) {
      await this.deletedComment.constructor.setNumReplies(
        this.deletedComment.parent
      );
    } else {
    }
  }
  next();
});

//populate profile when query
CommentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "_id email profile",
    populate: {
      path: "profile",
      model: "Profile",
      select: "name avatar firstname lastname slug",
    },
  });
  next();
});
const CommentModel = mongoose.model("Comment", CommentSchema);

module.exports = CommentModel;
