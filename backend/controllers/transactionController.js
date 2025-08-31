let $ = require("jquery");
// const request = require("request");
const moment = require("moment");
const crypto = require("crypto");
const config = require("config");

const catchAsync = require("./../utils/catchAsync");
const TransactionServices = require("./../services/transactionServices");
const PostServices = require("./../services/postServices");
const AppError = require("../utils/appError");
const PostTransaction = require("./../models/postTransactionModel");
const factory = require("./../controllers/handlerFactory");

exports.getAllTransactions = factory.getAll(PostTransaction);

exports.getRevenue = catchAsync(async (req, res, next) => {
  const data = await TransactionServices.getRevenue();
  res.status(200).json({
    status: "success",
    data: data,
  });
});
exports.getTransactionsByBusiness = catchAsync(async (req, res, next) => {
  const data = await TransactionServices.getTransactionByBusiness(
    req.params.id,
    req.query
  );

  res.status(200).json(data);
});

exports.getTransactionsByMe = catchAsync(async (req, res, next) => {
  const data = await TransactionServices.getTransactionByBusiness(
    req.user.id,
    req.query
  );

  res.status(200).json(data);
});
exports.createTransaction = catchAsync(async (req, res, next) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  if (!req.body.user) req.body.user = req.user.id;
  const post = (await PostServices.createBusinessPost(req.body)).data;
  if (!post) {
    reject(new AppError("An error occurs when create business post", 400));
  }

  req.body.post = post.id;

  const transaction = await TransactionServices.createTransaction(req.body);
  let date = new Date();
  let createDate = moment(date).format("YYYYMMDDHHmmss");

  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let tmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");
  let vnpUrl = config.get("vnp_Url");
  const base_url =
    process.env.NODE_ENV === "development"
      ? process.env.BASE_URL
      : process.env.PRODUCTION_BASE_URL;

  let returnUrl = `${base_url}${config.get("vnp_ReturnUrl")}`;
  console.log(returnUrl);
  let orderId = transaction.data.id;
  let amount = req.body.amount;
  let bankCode = "VNBANK";

  let locale = req.body.language;
  if (!locale || locale === "") {
    locale = "vn";
  }
  let currCode = "VND";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  if (bankCode !== null && bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);
  // console.log(vnp_Params);
  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
  // console.log(vnpUrl);
  // res.redirect(vnpUrl);
  res.status(200).json({
    status: "success",
    url: vnpUrl,
  });
});

exports.executeTransaction = catchAsync(async (req, res, next) => {
  let vnp_Params = req.query;
  let secureHash = vnp_Params["vnp_SecureHash"];

  let orderId = vnp_Params["vnp_TxnRef"];
  let rspCode = vnp_Params["vnp_ResponseCode"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const transaction = (await TransactionServices.getTransactionById(orderId))
    .data;
  vnp_Params = sortObject(vnp_Params);
  let secretKey = config.get("vnp_HashSecret");
  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  // let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  let paymentStatus = transaction.status; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
  //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
  //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

  let checkOrderId = false; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
  if (transaction) {
    checkOrderId = true;
  }
  let checkAmount = false; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
  if (transaction.amount === vnp_Params["vnp_Amount"] / 100) {
    checkAmount = true;
  }
  if (secureHash === signed) {
    //kiểm tra checksum
    let redirect_Url = `${process.env.CLIENT_URL}/business/advertisement`;
    if (checkOrderId) {
      if (checkAmount) {
        if (paymentStatus === "pending" || paymentStatus === "failed") {
          //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
          let status = "pending";
          if (rspCode == "00") {
            //thanh cong
            //paymentStatus = '1'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
            status = "success";
          } else {
            //that bai
            //paymentStatus = '2'
            status = "failed";
            // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
          }
          const result = await TransactionServices.changeTransactionStatus(
            transaction.id,
            status
          );
          // res.status(200).json({ RspCode: "00", status: status, data: result });
          res.render("success", {
            code: vnp_Params["vnp_ResponseCode"],
            redirect_Url: redirect_Url,
          });
        } else {
          res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
          res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
        }
      } else {
        // res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
        res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
      }
    } else {
      // res.status(200).json({ RspCode: "01", Message: "Payment not found" });
      res.status(200).json({ RspCode: "01", Message: "Payment not foundk" });
    }
  } else {
    // res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }
});
exports.return = catchAsync(async (req, res, next) => {
  let vnp_Params = req.query;

  let secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  let tmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

    res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
  } else {
    res.render("success", { code: "97" });
  }
});

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
