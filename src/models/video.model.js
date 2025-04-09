
import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile:{
            type: String,//cloudinary url
            rquired:true,
        },
        tumbnail:{
            type: String,//cloudinary url
            rquired:true,
        },
        
        title:{
            type: String,
            rquired:true,
        },
        description:{
            type: String,
            rquired:true,
        },
        duration:{
            type: Number,//cloudinary url
            rquired:true,
        },
        views:{
            type :Number,
            default:0,
        },
        isPublished:{
            type :Boolean,
            default:true
        },
        owner:{
            type : Schema.Types.ObjectId,
            ref : "User"
        },
        
        
    },
    {Timestamp :true})
    videoSchema.plugin(mongooseAggregatePaginate)

    export const Video = mongoose.model("Video",videoSchema)