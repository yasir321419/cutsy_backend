require("dotenv").config();
const { S3Client } = require("@aws-sdk/client-s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const uploadFileWithFolder = async (buffer, filename, contentType, folder) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `${folder}/${filename}`,
      ContentType: contentType,
      Body: buffer,
    });

    await s3.send(command);
    return `${process.env.S3_ACCESS_URL}/${folder}/${filename}`;
  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error(error.message);
  }
};

module.exports = uploadFileWithFolder;
