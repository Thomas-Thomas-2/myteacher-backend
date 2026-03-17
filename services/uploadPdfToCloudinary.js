const streamifier = require("streamifier");
// const cloudinary = require("./cloudinary");
const cloudinary = require("cloudinary").v2;

function uploadPdfToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "myteacher/invoices",
        public_id: publicId,
        type: "upload",
        access_mode: "public",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = uploadPdfToCloudinary;
