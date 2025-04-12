import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser = asyncHandler (async (req,res)=>{
 //jo jo bhi user schema me wha se dekho
 // //get user details
 //validation -not empty
 //check is user already exist : username , email
 //check for avatar,check for images 
 // if image and avatar available then upload them on cloudinary
 // check  on cloudinary that avatar has been uploaded succeesfully
// create user object
//create entry in db
//remove password and refresh token from response
// check for user creation
// return response

const {fullname,email,username,password}= req.body
// console.log("email",email);

if(
    [fullname,email,username,password].some((field)=>
    field?.trim()==="")
){
    throw new ApiError(400,"All fields are required")
}

 const existedUser = await User.findOne({
    $or :[{ username },{ email }]
})
if(existedUser){
    throw new ApiError(409,"User with this username and this email already exist")
}
// console.log(req.files)
//console.log(req.files.avatar[0])
const avatarLocalPath = req.files?.avatar[0]?.path;
//const coverImageLocalPath = req.files?.coverImage[0]?.path;
// console.log(avatarLocalPath)


let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
    coverImageLocalPath = req.files.coverImage[0].path
}

if(!avatarLocalPath){
    throw new ApiError(400,'Avatar file is required')
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,'Avatar file is required')
}
//console.log(avatar)
const user = await User.create({
    fullname,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"Something went wrong while creating the user in datase");
}
//console.log(createdUser)

return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
)

})

export  {
    registerUser,
}