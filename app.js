var express=require("express");
var app=express();
var bodyParser = require("body-parser");
var mongoose=require("mongoose");
var methodOverride = require("method-override");
var passport=require("passport");
var LocalStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var User=require("./models/user");
var Blog=require("./models/blog");
var Comment=require("./models/comments");




app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));

mongoose.connect("mongodb://localhost/restful_blog_app", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//passport configuration
app.use(require("express-session")({
  secret: 'i am shivam an it is a key',
  resave: false,
  saveUninitialized: true,
}));

//tell express to use passport
app.use(passport.initialize());
app.use(passport.session());

//using passport local mongoose and in user model hence User.serilaize is serialising the data
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 



//restful routes
app.get("/",function(req, res) {
   res.redirect("/blogs"); 
});

app.get("/blogs",function(req,res){
    Blog.find({},function(err,blogs)
    {
        if(err)
        {
            res.redirect("/blogs");
        }
        else
        {
             res.render("index",{blogs:blogs});
        }
    });

});

app.get("/blogs/post",isloggedIn,function(req, res) {
   res.render("blogs/new") ;
});

app.post("/blogs",function(req,res){
    Blog.create(req.body.blog,function(err,newblog){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.redirect("/blogs");
        }
    });
});

app.get("/blogs/:id",isloggedIn,function(req,res){
    Blog.findById(req.params.id).populate("comments").exec(function(err,foundblog){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("blogs/show",{blog:foundblog});
        }
    });
});

//Edit route
app.get("/blogs/:id/edit",function(req,res){
    Blog.findById(req.params.id,function(err,foundblog){
        if(err)
        {res.redirect("/blogs")}
        else{
            res.render("blogs/edit",{blog:foundblog});
        }
    });
    
});

app.put("/blogs/:id",function(req,res){
    Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updatedblog){
        if(err)
        {res.redirect("/blogs")}
        else
        {
            res.redirect("/blogs/"+req.params.id);
        }
        
    });
    
});

app.delete("/blogs/:id",function(req,res){
 Blog.findByIdAndRemove(req.params.id,function(err){
     if(err)
     {
         res.redirect("/blogs");
     }
     else{
         res.redirect("/blogs");
     }
 });
});

//comment routes 
app.get("/blogs/:id/comments/new",function(req, res) {
   Blog.findById(req.params.id,function(err, foundblog) {
       if(err)
       {
           console.log(err);
       }
       else{
           res.render("comments/new",{blog:foundblog});
       }
       
   }) ;
});

app.post("/blogs/:id/comments",function(req, res) {
   Blog.findById(req.params.id,function(err, foundblog) {
       if(err)
       {console.log(err);}
       else{
           Comment.create(req.body.comment,function(err,comment){
               if(err){console.log(err);}
               else
               {
                     comment.author._id=req.user._id;
                     comment.author.username=req.user.username;
                     
                     comment.save();
                     
                     foundblog.comments.push(comment);
                     foundblog.save();
                     res.redirect("/blogs/"+foundblog._id);
               }
           });
       }
   });
});

//Edit the comment routes
app.get("/blogs/:id/comments/:commentid/edit",function(req, res) {
   Comment.findById(req.params.commentid,function(err, foundcomment) {
       if(err){console.log(err);}
       else
       {
           res.render("comments/edit",{blogid:req.params.id,comment:foundcomment});
       }
   }) ;
});

app.put("/blogs/:id/comments/:commentid",function(req,res){
    Comment.findByIdAndUpdate(req.params.commentid,req.body.comment,function(err,updatedcomment){
          if(err)
          {
              console.log(err);
          }
          else{
              res.redirect("/blogs/"+req.params.id);
          }
    });
});

app.delete("/blogs/:id/comments/:commentid",function(req,res){
    Comment.findByIdAndRemove(req.params.commentid,function(err)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            res.redirect("/blogs/"+req.params.id);
        }
    });
});










//auth routes
//show up the sign up form
app.get("/register",function(req, res) {
    res.render("register");
});

//handling user sign up
app.post("/register",function(req,res){
    req.body.username;
    req.body.password;
    User.register(new User({username:req.body.username}),req.body.password,function(err,user)
    {
        if(err){
            console.log(err);
            return res.render("register");
        }
        else
        {
            //log the user in,take care of session,store correct information,use serialise method
           passport.authenticate("local")(req,res,function(){
               res.redirect("/blogs");
           }) ;
        }
    });
});

//login routes
//render login page
app.get("/login",function(req, res) {
    res.render("login");
});

//login logic
//middleware
app.post("/login",passport.authenticate("local",{
    successRedirect:"/blogs",
    failureRedirect:"/login"
}),function(req, res){
    
});

app.get("/logout",function(req, res) {
    req.logout();
    res.redirect("/blogs");
});

function isloggedIn(req,res,next)
{
    if(req.isAuthenticated())
    {
        return next();
    }
    res.redirect("/login");
}

app.listen(process.env.PORT,process.env.IP,function(){
    console.log("SERVER IS RUNNING");
});