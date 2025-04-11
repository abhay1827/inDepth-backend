const asyncHandler =(requestHandler)=>{
return (req,res,next) => {
    Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
}
}//higher order function return itself

export {asyncHandler}




// const asyncHandler=(fn)=> async (req,res,next)=>{ 
// try{
//     await fn(req,res,next)
// }
// catch(error){
//     res.status(error.code || 500).json({
//         success: false,
//         message : error.messgae
//     })
// }
// }//it is an higher order function