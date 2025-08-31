const catchAsync = require("./../utils/catchAsync");
const notiServices = require("./../services/notificationServices");

exports.getNotificationsByUser = catchAsync(async (req, res, next) => {
  req.query.sort = "-updatedAt";
  const data = await notiServices.getNotificationsByUser(
    req.user.id,
    req.query
  );

  res.status(200).json({
    status: "success",
    total: data.populatedData.length,
    numUnread: data.numUnread,
    data: data.populatedData,
  });
});

exports.setAllNotificationsRead = catchAsync(async (req, res, next) => {
  console.log(req.user);
  const data = await notiServices.setAllNotificationsRead(req.user.id);
  res.status(200).json({
    status: "success",
    data: data,
  });
});

exports.setNotificationRead = catchAsync(async (req, res, next) => {
  const data = await notiServices.setNotificationRead(
    req.body.notiId,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data,
  });
});
exports.createNotifications = catchAsync(async (req, res, next) => {
  const { type } = req.body;
  let data;
  switch (type) {
    case "follow": {
      data = await notiServices.createFollowNotification(
        req.user.id,
        req.body.followingId
      );
      break;
    }
    case "like post": {
      data = await notiServices.createLikePostNotification(
        req.user.id,
        req.body.postId
      );
      break;
    }
    case "comment": {
      data = await notiServices.createCommentPostNotification(
        req.body.commentId,
        req.body.postId
      );
      break;
    }
    case "like comment": {
      data = await notiServices.createLikeCommentNotification(
        req.user.id,
        req.body.commentId
      );
      break;
    }
    case "reply comment": {
      data = await notiServices.createReplyCommentNotification(
        req.body.commentId
      );
      break;
    }
    case "share post": {
      data = await notiServices.createSharePostNotification(req.body.postId);
      break;
    }
    default: {
      res.status(400).json({
        status: "failed",
        message: "input type is not supported",
      });
    }
  }

  res.status(201).json({
    status: "success",
    data: data,
  });
});
