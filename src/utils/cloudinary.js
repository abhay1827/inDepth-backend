import {v2 as cloudinary} from "cloudinary"
import fs, { fdatasync } from  "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        //upload
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type :"auto"
        })
        //file has been uploaded successfully
        // console.log("file has been uploaded on cloudinary",
        //     response.url
        // );
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally 
        //savedd temporary file as the upload 
        // operation got failed
        return null
    }
}

export {uploadOnCloudinary}