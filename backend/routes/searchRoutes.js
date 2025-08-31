const express = require("express");
const searchController = require("./../controllers/searchController");

const router = express.Router();

router.route("/users").get(searchController.searchUsers);

router.route("/posts").get(searchController.searchPosts);

module.exports = router;
