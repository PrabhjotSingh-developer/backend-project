const asyncHandler = (requsetHandler) =>{
     return (req,res,next)=>{
        Promise.resolve(requsetHandler(req,res,next)).
        catch((err)=>next(err))
     }
}
export {asyncHandler}









// type 2 => try catch
// const asyncHandler = (func)=>{}
//const asyncHandler = (func) =>{()=>{}}
//const asyncHandler = (func) => ()=>{}


// const asyncHandler = (func) => async(req,res,next)=>{
//     try {
//          await func(req,res,next)
//     } catch (err) {
//         res.send(err.code||500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }




