let express = require("express")
const {MongoClient} = require("mongodb")
const jwt=require("jsonwebtoken")
let path = require("path")
const app = express()
const cors = require("cors")
app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.json())
async function CreateDB(collectionname)
{
    const uri = "mongodb://127.0.0.1:27017/"
    let client = new MongoClient(uri)
    await client.connect()
    let db = client.db("FaceBook")
    let usercollection = db.collection(collectionname)
    return(usercollection)

}
app.post( "/user/signup" , async (req , res)=>
{
    let usercollection =await  CreateDB("User Signup Details")
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let data = {"name":name , "email":email , "password":password }
    console.log(data);
    await usercollection.insertOne(data)
    res.json({"message":"sign up successfull"})

})
app.post( "/user/login" , async (req , res)=>
{
    let usercollection = await CreateDB("User Signup Details")
    let loginemail = req.body.email;
    let loginpassword = req.body.password;
    const user = await usercollection.findOne({"email":loginemail})
    if(user == null)
    {
        return(res.json({"message":"Email Not found"}))
    }
    else if(user.password != loginpassword)
    {
        return(res.json({"message":"Invalid Password"}))
    }
    let payload = {email:user.email , password:loginpassword}
    let secretkey = '!@#$%^'
    let options = {expiresIn:'1hr'}
    let token = jwt.sign(payload , secretkey , options)
    res.json({"message":"Valid" , "token":token , "email":user.email})


})

app.post("/sendrequest" , async(req , res)=>
{
    let receiver = req.body.email
    let token = req.body.token
    let secretkey = '!@#$%^'
    let payload = jwt.verify(token , secretkey)
    let sender = payload.email
    let dt = new Date().toLocaleDateString()
    console.log(receiver)
    let status = 0
    let usercoll =await CreateDB("friends")
    let data = {"senderemail":sender , "receiveremail":receiver , "dateofsending":dt , "status":status}
    await usercoll.insertOne(data)
    res.json({"message":"Friend Request Send"})

})
app.post("/welcome" , async(req , res)=>
{
    let token = req.body.token
    let secretkey = '!@#$%^'
    let payload = jwt.verify(token , secretkey)
    let friencoll = await CreateDB("friends")
    let pendings =  await friencoll.find({$and:[{"receiveremail":payload.email},{"status":0}]}).toArray()
    let pendingreq = []
    if(pendings.length == 0)
    {
        res.json({"message":"No Pending Friend Request"})
    }
    for(let pend of pendings)
    {
        pendingreq.push({"Sender": pend.senderemail , "Date_Sending":pend.dateofsending  })
    }
    res.json({"pendingreq":pendingreq})

    /*let rows =  await friencoll.find(
        {$and:
            [
                {$or:
                [{"receiveremail":payload.email},{"senderemail":payload.email}],
            },
                {"status":1}
            ]
        }).toArray()
    let friends = []
    if(rows.length == 0)
    {
        return(res.json({"message":"No Accepted Friend Request"}))
    }
    for(let fr of rows)
    {
        if(payload.email == fr.receiveremail)
            friends.push(fr.senderemail)
        else
            friends.push(fr.receiveremail)
    }
    console.log(friends)
    res.json({"message":"Pending Friends and Friends created"})*/
    
})
app.post("/acceptrequest" , async(req , res)=>
{
    let token = req.body.token
    let send = req.body.send
    let secretkey = '!@#$%^'
    let payload = jwt.verify(token , secretkey)
    let friencoll = await CreateDB("friends")
    await friencoll.updateOne(
    {
        $and:
        [{"senderemail":send},{"receiveremail":payload.email}] 
    },
    {
        $set:{"status":1}
    }

)
    res.json({"message":"Friend Request Accepted"})


})
app.post("/rejectrequest" , async(req , res)=>
{
    let token = req.body.token
    let send = req.body.send
    let secretkey = '!@#$%^'
    let payload = jwt.verify(token , secretkey)
    let friencoll = await CreateDB("friends")
    await friencoll.updateOne(
    {
        $and:
        [{"senderemail":send},{"receiveremail":payload.email}] 
    },
    {
        $set:{"status":2}
    }

)
    res.json({"message":"Friend Request Rejected"})


})
app.post("/wpost/save" , async(req , res)=>
{
    let messages = await CreateDB("messages")
    let token = req.body.token
    let secretkey = '!@#$%^'
    let payload = jwt.verify(token , secretkey)
    let message = req.body.message
     messages.insertOne({
        message:message ,
        sender:payload.email
    })
    res.json({"message":"message sent"})


})
app.post("/wpost/display" , async(req , res)=>
{
    let friencoll = await CreateDB("friends")
    let messages_row = await CreateDB("messages")
    let mrows = await messages_row.find().toArray()
    let token = req.body.token
    let secretkey = '!@#$%^'
    let payload = jwt.verify(token , secretkey)
    let rows =  await friencoll.find(
        {$and:
            [
                {$or:
                [{"receiveremail":payload.email},{"senderemail":payload.email}],
            },
                {"status":1}
            ]
        }).toArray()
    let friends = []
    if(rows.length == 0)
    {
        return(res.json({"message":"No Accepted Friend Request"}))
    }
    for(let fr of rows)
    {
        if(payload.email == fr.receiveremail)
            friends.push(fr.senderemail)
        else
            friends.push(fr.receiveremail)
    }
    let wpost = []
    for(let row of mrows)
    {
        if(friends.includes(row.sender) || payload.email == row.sender)
        {
            wpost.push(row)
        }
    }
    res.json({"Displayed Posfriends":wpost})




})
app.post("/welcomeuser" , async(req , res)=>
{
    let token = req.body.token
    let secretkey = '!@#$%^'
    let payload = jwt.verify(token , secretkey)
    res.json({"useremail":payload.email})
})








app.listen(8000)

