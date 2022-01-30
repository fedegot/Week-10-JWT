require("dotenv/config");
const express = require(`express`);
const cookieParser = require(`cookie-parser`);
const cors = require(`cors`);
const { verify } = require(`jsonwebtoken`);
const { hash, compare } = require(`bcryptjs`);
const {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} = require(`./token`);

const { isAuth } = require(`./isauth`);

const { fakeDB } = require(`./fakeDB.js`);

const server = express();

server.use(cookieParser());

server.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

server.use(express.json()); // to support JSON-encoded bodies
server.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

// rEGISTER AN USER

server.post(`/register`, async (req, res) => {
  const { email, password } = req.body;
  try {
    //check if the user exist
    const user = fakeDB.find((user) => user.email === email);
    if (user) throw new error("user already exist");
    //2 if not user exist, hash the password
    const hashedPassword = await hash(password, 10);
    //3 insert the user in "database"
    fakeDB.push({
      id: fakeDB.length,
      email,
      password: hashedPassword,
    });
    res.send({ message: `user created` });
    console.log(fakeDB);
  } catch (err) {
    res.send({
      error: `${err.message}`,
    });
  }
});

server.post(`/refres_token`, (req, res) => {
  const token = req.cookies.refreshtoken;
  //if we dont have a token in our request
  if (!token) return res.send({ accesstoken: `` });
  //we have a token and lets try

  let payload = null;
  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.send({ accesstoken: `` });
  }
  const user = fakeDB.find((user) => user.id === payload.userId);
  if (!user) return res.send({ accesstoken: `` });

  if (user.refreshtoken !== token) {
    return res.send({ accesstoken: `` });
  }
  //token exist, create new refresh and accesstoken

  const accesstoken = createAccessToken(user.id);
  const refreshtoken = createRefreshToken(user.id);

  user.refreshtoken = refreshtoken;
  //send new refreshtoken
  sendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken });
});

server.listen(process.env.PORT, () =>
  console.log(`Server listening on port ${process.env.PORT}!`)
);
