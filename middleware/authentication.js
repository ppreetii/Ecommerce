module.exports = (req,res,next) =>{
    if(!req.session.user){
        return res.redirect('/login'); // return is necessary to not execute any code outside this check
    }

    next();
}