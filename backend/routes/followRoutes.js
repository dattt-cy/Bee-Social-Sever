const express = require('express');
const followController = require('./../controllers/followController');
const authController = require('./../controllers/authController');


const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);
// other user
router.get('/getAllFollowings/:id', followController.getAllFollowings);
router.get('/getAllFollowers/:id', followController.getAllFollowers);
router.get('/getNumberOfFollows/:id', followController.getNumberOfFollows);

//me

router.get('/getMyFollowerList', followController.getMyFollowerList);
router.get('/getMyFollowingList', followController.getMyFollowingList)
router.delete('/unfollow/:followingId', followController.unfollow);
router.post('/followingOtherUser', followController.followingOtherUser);
router.get('/getMyNumberOfFollows', followController.getMyNumberOfFollows);
router.get('/isFollowing/:id', followController.isFollowing);
router.get('/suggestFollow', followController.suggestFollow);
router.get('/get-friends', followController.getFriends);


module.exports = router;