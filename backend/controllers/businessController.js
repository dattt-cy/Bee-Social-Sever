const catchAsync = require("./../utils/catchAsync");
const businessServices = require("./../services/businessServices");

exports.approveBusinessRequest = catchAsync(async (req, res) => {
  console.log(req.body);
  const { id } = req.body;
  const data = await businessServices.handleBusinessRequest(id, "approved");

  res.status(200).json(data);
});

exports.rejectBusinessRequest = catchAsync(async (req, res) => {
  console.log(req.body);
  const { id } = req.body;
  const data = await businessServices.handleBusinessRequest(id, "rejected");

  res.status(200).json(data);
});

exports.cancelBusinessRequest = catchAsync(async (req, res) => {
  console.log(req.body);
  const { id } = req.body;
  const data = await businessServices.handleBusinessRequest(id, "canceled");

  res.status(200).json(data);
});

exports.getBusinessRequests = catchAsync(async (req, res) => {
  console.log(req.body);

  const data = await businessServices.getBusinessRequests(
    req.query.status,
    req.query
  );

  res.status(200).json(data);
});
// exports.signup = catchAsync(async (req, res) => {
//   const data = await BusinessServices.businessSignUp(data);

//   res.status(201).json({
//     status: "success",
//     message:
//       "An email has been sent to your email address. Please verify your email address to continue to next steps",
//   });
// });
