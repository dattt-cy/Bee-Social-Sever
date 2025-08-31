const Pusher = require("pusher");
const pusher = new Pusher({
  appId: "1726124",
  key: "347a18ba158ea55c148d",
  secret: "935e6d0a12fb024b0a0c",
  cluster: "ap1",
  useTLS: true,
});

module.exports = pusher;
