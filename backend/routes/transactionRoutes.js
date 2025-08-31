const express = require("express");

const router = express.Router();
const transactionController = require("../controllers/transactionController");
const authController = require("./../controllers/authController");

router.get("/vnpay_ipn", transactionController.executeTransaction);
router.get("/vnpay_return", transactionController.return);
router
  .route("/revenue")
  .get(authController.protect, transactionController.getRevenue);
router
  .route("/all")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    transactionController.getAllTransactions
  );

router
  .route("/me")
  .get(
    authController.protect,
    authController.restrictTo("admin", "business"),
    transactionController.getTransactionsByMe
  );
router
  .route("/:id")
  .get(
    authController.protect,
    authController.restrictTo("admin", "business"),
    transactionController.getTransactionsByBusiness
  );

router.post(
  "/create_payment_url",
  authController.protect,
  authController.restrictTo("business", "admin"),
  transactionController.createTransaction
);

// router.get("/", function (req, res, next) {
//   res.render("orderlist", { title: "Danh sách đơn hàng" });
// });

// router.get("/create_payment_url", function (req, res, next) {
//   res.render("order", { title: "Tạo mới đơn hàng", amount: 10000 });
// });

// router.get("/querydr", function (req, res, next) {
//   let desc = "truy van ket qua thanh toan";
//   res.render("querydr", { title: "Truy vấn kết quả thanh toán" });
// });

// router.get("/refund", function (req, res, next) {
//   let desc = "Hoan tien GD thanh toan";
//   res.render("refund", { title: "Hoàn tiền giao dịch thanh toán" });
// });

// router.post("/querydr", function (req, res, next) {
//   process.env.TZ = "Asia/Ho_Chi_Minh";
//   let date = new Date();

//   let config = require("config");
//   let crypto = require("crypto");

//   let vnp_TmnCode = config.get("vnp_TmnCode");
//   let secretKey = config.get("vnp_HashSecret");
//   let vnp_Api = config.get("vnp_Api");

//   let vnp_TxnRef = req.body.orderId;
//   let vnp_TransactionDate = req.body.transDate;

//   let vnp_RequestId = moment(date).format("HHmmss");
//   let vnp_Version = "2.1.0";
//   let vnp_Command = "querydr";
//   let vnp_OrderInfo = "Truy van GD ma:" + vnp_TxnRef;

//   let vnp_IpAddr =
//     req.headers["x-forwarded-for"] ||
//     req.connection.remoteAddress ||
//     req.socket.remoteAddress ||
//     req.connection.socket.remoteAddress;

//   let currCode = "VND";
//   let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

//   let data =
//     vnp_RequestId +
//     "|" +
//     vnp_Version +
//     "|" +
//     vnp_Command +
//     "|" +
//     vnp_TmnCode +
//     "|" +
//     vnp_TxnRef +
//     "|" +
//     vnp_TransactionDate +
//     "|" +
//     vnp_CreateDate +
//     "|" +
//     vnp_IpAddr +
//     "|" +
//     vnp_OrderInfo;

//   let hmac = crypto.createHmac("sha512", secretKey);
//   let vnp_SecureHash = hmac
//     .update(Buffer.from(signData, "utf-8"))
//     .digest("hex");

//   let dataObj = {
//     vnp_RequestId: vnp_RequestId,
//     vnp_Version: vnp_Version,
//     vnp_Command: vnp_Command,
//     vnp_TmnCode: vnp_TmnCode,
//     vnp_TxnRef: vnp_TxnRef,
//     vnp_OrderInfo: vnp_OrderInfo,
//     vnp_TransactionDate: vnp_TransactionDate,
//     vnp_CreateDate: vnp_CreateDate,
//     vnp_IpAddr: vnp_IpAddr,
//     vnp_SecureHash: vnp_SecureHash,
//   };
//   // /merchant_webapi/api/transaction
//   request(
//     {
//       url: vnp_Api,
//       method: "POST",
//       json: true,
//       body: dataObj,
//     },
//     function (error, response, body) {
//       console.log(response);
//     }
//   );
// });

// router.post("/refund", function (req, res, next) {
//   process.env.TZ = "Asia/Ho_Chi_Minh";
//   let date = new Date();

//   let config = require("config");
//   let crypto = require("crypto");

//   let vnp_TmnCode = config.get("vnp_TmnCode");
//   let secretKey = config.get("vnp_HashSecret");
//   let vnp_Api = config.get("vnp_Api");

//   let vnp_TxnRef = req.body.orderId;
//   let vnp_TransactionDate = req.body.transDate;
//   let vnp_Amount = req.body.amount * 100;
//   let vnp_TransactionType = req.body.transType;
//   let vnp_CreateBy = req.body.user;

//   let currCode = "VND";

//   let vnp_RequestId = moment(date).format("HHmmss");
//   let vnp_Version = "2.1.0";
//   let vnp_Command = "refund";
//   let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

//   let vnp_IpAddr =
//     req.headers["x-forwarded-for"] ||
//     req.connection.remoteAddress ||
//     req.socket.remoteAddress ||
//     req.connection.socket.remoteAddress;

//   let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

//   let vnp_TransactionNo = "0";

//   let data =
//     vnp_RequestId +
//     "|" +
//     vnp_Version +
//     "|" +
//     vnp_Command +
//     "|" +
//     vnp_TmnCode +
//     "|" +
//     vnp_TransactionType +
//     "|" +
//     vnp_TxnRef +
//     "|" +
//     vnp_Amount +
//     "|" +
//     vnp_TransactionNo +
//     "|" +
//     vnp_TransactionDate +
//     "|" +
//     vnp_CreateBy +
//     "|" +
//     vnp_CreateDate +
//     "|" +
//     vnp_IpAddr +
//     "|" +
//     vnp_OrderInfo;
//   let hmac = crypto.createHmac("sha512", secretKey);
//   let vnp_SecureHash = hmac
//     .update(Buffer.from(signData, "utf-8"))
//     .digest("hex");

//   let dataObj = {
//     vnp_RequestId: vnp_RequestId,
//     vnp_Version: vnp_Version,
//     vnp_Command: vnp_Command,
//     vnp_TmnCode: vnp_TmnCode,
//     vnp_TransactionType: vnp_TransactionType,
//     vnp_TxnRef: vnp_TxnRef,
//     vnp_Amount: vnp_Amount,
//     vnp_TransactionNo: vnp_TransactionNo,
//     vnp_CreateBy: vnp_CreateBy,
//     vnp_OrderInfo: vnp_OrderInfo,
//     vnp_TransactionDate: vnp_TransactionDate,
//     vnp_CreateDate: vnp_CreateDate,
//     vnp_IpAddr: vnp_IpAddr,
//     vnp_SecureHash: vnp_SecureHash,
//   };

//   request(
//     {
//       url: vnp_Api,
//       method: "POST",
//       json: true,
//       body: dataObj,
//     },
//     function (error, response, body) {
//       console.log(response);
//     }
//   );
// });

// function sortObject(obj) {
//   let sorted = {};
//   let str = [];
//   let key;
//   for (key in obj) {
//     if (obj.hasOwnProperty(key)) {
//       str.push(encodeURIComponent(key));
//     }
//   }
//   str.sort();
//   for (key = 0; key < str.length; key++) {
//     sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
//   }
//   return sorted;
// }

module.exports = router;
