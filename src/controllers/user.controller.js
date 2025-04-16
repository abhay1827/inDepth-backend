import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAcessAndRefreshTokes = async (userId)=>{
    try {
        const user = await User.findById(userId)
       const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating acces and refresh token") 
    }
}


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
    throw new ApiError(500,"Something went wrong while creating the user in database");
}
//console.log(createdUser)

return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
)

})

const loginUser = asyncHandler(async (req,res)=>{
    //req body - data
    // username or email
    //find theuser
    // check password
    // access and refresh token
    //send cookie
    //res successfully login
    const {email,username,password}= req.body

    if(!username && !email){
        throw new ApiError(400,"username or email required")
    }

     const user = await User.findOne({
        $or: [{username},{email}]
    })
     if(!user){
        throw new ApiError(404,"user does not exist")
     }


   const isPasswordValid =  await user.isPasswordCorrect(password)
 if(!isPasswordValid){
    throw new ApiError(401,"password does not match")
 }

 const {accessToken,refreshToken } =await generateAcessAndRefreshTokes(user._id)

 const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options ={
    httpOnly :  true,
    secure :true
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user : loggedInUser,accessToken,refreshToken
        },
    "user logged in successfully"
    )
)

})

const logoutUser = asyncHandler (async(req,res)=>{
  await User.findByIdAndUpdate(req.user ._id,
    {
        $set :{
            refreshToken:undefined,

        }
    },{
        new : true
    }
  )


  const options ={
    httpOnly :  true,
    secure :true
}

return res.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"user logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken =  req.cookies.refreshToken ||req.body.refreshToken // first one for system || second for mobile

  if(!incomingRefreshToken){
    throw new ApiError(401,"Session expired")
  }

 try {
    const decodedToken =  jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
   )
   const user =await User.findById(decodedToken?._id)
   
   if(!user){
       throw new ApiError(401,"Invalid Refresh Token")
   }
   
   if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(401,"Refresh Token is expired or used")
   
   }
   const options ={
       httpOnly : true,
       secure : true
   }
    const {accessToken,newrefreshToken} =await generateAcessAndRefreshTokes(user._id)
   
   
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
       new ApiResponse(
           200,
           {accessToken, refreshToken : newrefreshToken , message :"Access Token Refreshed"}
       )
    )
 } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh Token")
 }
})


const changeCurrentPassword = asyncHandler ( async(req,res)=>{
    const {oldPassword , newPassword} =req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Incorrect old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"password changed")
    )



})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,req.user,"current user fetched successfully"
    ))
})
 const updateAccountDetails = asyncHandler (async(req,res)=>{
    const {fullname,email} = req.body

    if(!(fullname || email)){
        throw new ApiError(400,"all feilds are required")
    }
   const updatedInformation = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,updatedInformation,"account details updated successfully"))
 })

 const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath =req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar on cloudinary")
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar image uploaded"))

 })


 const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath =req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage on cloudinary")
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,user,"cover image uploaded"
    ))

 })


 const getUserChannelProfile = asyncHandler(async(req,res)=>{
        const{username}=req.params
        if (!username?.trim) {
            throw new ApiError(400,"username is missing")
        }

       const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                    from : "subscription",
                    localField:"_id",
                    foreignField:"channel",
                    as: "subscribers"
            }
        },
        {
            $lookup:{
                from : "subscription",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size :"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }

            }
        },{
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
       ])
       if (!channel?.length) {
        throw new ApiError(404,"channel does not exist")
       }

       return res
       .status(200)
       .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
       )

 })

 const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"video",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first :"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
 })

export  {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} 