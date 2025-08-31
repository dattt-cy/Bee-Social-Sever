const cloudinary = require('cloudinary').v2;

cloudinary.config({
    secure: true
});

module.exports = async (file) => {

    // Use the uploaded file's name as the asset's public ID and 
    // allow overwriting the asset with new versions
    const options = {
      unique_filename: false,
      overwrite: true,
    };

    try {
      // Upload the image
      const result = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
      });
      console.log(result);
      return result.url;
    } catch (error) {
      console.error(error);
    }
};

