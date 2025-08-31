const express = require("express");
const commentController = require("./../controllers/commentController");
const authController = require("./../controllers/authController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route("/")
    .get(
        commentController.setQueryParameters,
        commentController.checkParentComment,
        commentController.setPagingComment,
        commentController.getCommentsOfPost
    )
    .post(
        authController.restrictTo("user", "business"),
        commentController.setQueryParameters,
        commentController.checkParentComment,
        commentController.createComment
    );

router.route("/id/:id").get(commentController.getCommentById);
router.route("/users/:id").get(commentController.getUsersLikingComment);
router
    .route("/:id")
    .get(
        commentController.setQueryParameters,
        commentController.checkParentComment,
        commentController.setPagingComment,
        commentController.getCommentsOfPost
    )
    .patch(
        authController.restrictTo("user", "business"),
        commentController.updateComment
    )
    .delete(
        // authController.restrictTo("user", "bussiness", "admin"),
        commentController.deleteComment
    );

router
    .route("/:id/like")
    .get(commentController.isCommentLikeByUser)
    .post(
        authController.restrictTo("user", "business"),
        commentController.setQueryParameters,
        commentController.likeComment
    )
    .delete(
        authController.restrictTo("user", "business"),
        commentController.setQueryParameters,
        commentController.unlikeComment
    );

module.exports = router;
