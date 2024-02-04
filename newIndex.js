import express from "express"
import path from "path"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";

const app=express();

app.use(express.static(path.join(path.resolve(),'/public')));
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(cookieParser());

mongoose.connect('mongodb://localhost:27017',{dbName:"NoteTaker"}).then(()=>{
    console.log('Database is now Connected');
})
.catch((err)=>{
    console.log(`Something went wrong in connecting the Database, Following Error is being displayed \n ${err}`);
})

const userSchema= new mongoose.Schema({
    name:String,
    email:String,
    password:String
})
const User= mongoose.model('users',userSchema);

const noteSchema= new mongoose.Schema({
    title:String,
    descr:String,
    createdBy:{type:mongoose.Types.ObjectId, ref:'users'}
})
const Notes=mongoose.model('notes',noteSchema);

const isAuth= (req,res,next)=>{
    const {token}= req.cookies;

    if(token)
    {
        const token1 = jwt.verify(token,'abcdefgh');

        req.user=token1;    
    }

    next();
}

app.get('/logout',(req,res)=>{

    res.cookie('token',null,{expires: new Date(Date.now())})
    res.redirect('/');
})

app.get('/loggedIn',isAuth, async (req,res)=>{

    let theNotes=[];
    let name='';

    if(req.user)
    {
        theNotes= await Notes.find({createdBy:req.user});
        name= req.user.name;
    }

    res.render('userNotes',{theNotes,name});
  
})

app.post('/newNote',isAuth,async (req,res)=>{
    const {title,descr}=req.body;

    const createdBy= req.user;

    await Notes.create({title,descr,createdBy});

    res.redirect('/loggedIn');

})

app.post('/login',async (req,res)=>{
    const {email,password}=req.body;

    const thisUser= await User.findOne({email:email});

    if(!thisUser) return res.render('signup');

    const isMatching= await bcrypt.compare(password,thisUser.password);

    if(!isMatching) return res.render('login',{email, message:"Incorrect password, Please try again"} );

    const token= jwt.sign(thisUser.toJSON(),'abcdefgh');

    res.cookie('token',token,{httpOnly:true});

    res.redirect('/loggedIn');
})

app.post('/signup',async (req,res)=>{
    const {name,email,password}=req.body;

    const pass= await bcrypt.hash(password,10);
    const thisuser= await User.create({name,email,password:pass});
    res.render('done');
})

app.get('/trysignup',(req,res)=>{
    res.render('signup');
})

app.get('/trylogin',(req,res)=>{
    res.render('login');
})

app.get('/',(req,res)=>{
    res.render('first');
})

app.listen(5508,()=>{
    console.log('Server is Working fine');
})