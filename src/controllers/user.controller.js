import {asyncHandler} from '../utils/asyncHandler.js'
import  {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
const generateAccessAndRefreshTokens = async(userId)=>
{
    try {
         const user = await User.findById(userId);
         const accessToken = user.generateAccessToken();
         const refreshToken = user.generateRefreshToken()
         user.refreshToken = refreshToken;
         await user.save({validateBeforeSave:false})
         return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
        
    }
}
const registerUser = asyncHandler( async (req,res)=>{
    //   get data from frontend or user 
     const {fullName,email,password,userName} = req.body;
     console.log(email);
    //  validate the data check all fields
    if([fullName,email,password,userName].some((field)=>
        field?.trim === ""))
        {
              throw new ApiError(400,"All fields are required")
        }
    // check if user already exist
    const existingUser = await User.findOne({
        $or:[{userName},{email}]
    })
    if(existingUser)
    {
         throw new ApiError(409,"user with email or username already exist")
    }
    // check for images,check for avatar
    // console.log()
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverLocalPath;
    if(req.files?.coverImage != undefined)
    {
         coverLocalPath = req.files?.coverImage[1]?.path;

    }

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required")
    }
    // upload these images to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImageUpload = await uploadOnCloudinary(coverLocalPath)
    if(!avatar)
      throw new ApiError(400,"Avatar file is required")

   const user = await User.create(
        {
            fullName,
            avatar:avatar.url,
            coverImage:coverImageUpload?.url || "",
            email,
            password,
            userName:userName.toLowerCase()
        }
    )
    const createdUser = await User.findById(user._id).select(

        "-password -refreshToken"
    )
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while regestring the user")
    }
       return res.status(201).json(
        new ApiResponse(200,createdUser,"User registred successfully")
       )
})
const loginUser = asyncHandler(async (req,res)=>{
    // req body -> data
//    username or email 
// find the user
// password check
// access and refresh token
//send cokkie
      const {userName ,email,password} = req.body;
      if(!userName && !email)
      {
        throw new ApiError(400,"Username or password is required");
      }
      const user = await User.findOne({
        $or:[{userName},{email}]
      })
      
      if(!user)
         throw new ApiError(404,"User does not exist")
    // console.log(password)
    const isPassValid =  await user.isPasswordCorrect(password)
    
    if(!isPassValid)
       throw new ApiError(401,"Invalid user credentials")
     
   const {refreshToken,accessToken} =await generateAccessAndRefreshTokens(user._id);
//    console.log(refreshToken,accessToken)
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
   const options = {
    httpOnly:true,
    secure:true
   }
   return res.status(200).
   cookie("accessToken",accessToken,options).
   cookie("refreshToken",refreshToken,options).
   json(
     new ApiResponse(200,{
        user:loggedInUser,accessToken,refreshToken
     },
     "user logged in successfuly"
     )

   )
})
const logoutUser = asyncHandler(async (req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
       )
    const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200).
    clearCookie("accessToken",options).
    clearCookie("refreshToken",options).
    json(new ApiResponse(200,{},"user logged out successfully"))
})
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken ||req.body.refreshToken;
    if(incomingRefreshToken)
    {
         throw new ApiError(401,"Unauthorized Access")
    }
  try {
       const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
       const user =  await User.findById(decodedToken?._id)
       if(!user)
      {
           throw new ApiError(401,"Invalid refresh Token")
      }
      if(incomingRefreshToken!==user?.refreshToken)
      {
          throw new ApiError(401,"Refresh token is expired or used")
  
      }
      const options = {
          httpOnly:true,
          secure:true
      }
      const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)
      return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).
      json(new ApiResponse(200,{accessToken,refreshToken},
          "Access token refreshed"
          ))
  } catch (error) {
     throw new ApiError(401, error?.message  || "Invalid refresh token")
  }
})
export {
    registerUser
       ,loginUser,
       logoutUser,
       refreshAccessToken
}