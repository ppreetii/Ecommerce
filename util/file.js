const fs = require("fs");
const path = require("path");

 exports.deleteFile = (filepath) =>{
    fs.unlink(path.join(__dirname, "../", filepath), (err) =>{
        if(err)
        throw err;
    })

}