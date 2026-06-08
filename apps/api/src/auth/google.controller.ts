import { Controller, Get, Res, Query } from "@nestjs/common";
import type { Response } from "express";

@Controller("auth/google")
export class GoogleController {

@Get()
googleLogin(
@Res() res:Response
){

const clientId=
process.env.GOOGLE_CLIENT_ID;

const redirect=
encodeURIComponent(
process.env.GOOGLE_REDIRECT_URI!
);

const scope=
encodeURIComponent(
"https://www.googleapis.com/auth/business.manage"
);

const url=

`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&response_type=code&access_type=offline&prompt=consent&scope=${scope}`;

return res.redirect(url);

}

@Get("callback")
async callback(
@Query("code")
code:string
){

const response=
await fetch(
"https://oauth2.googleapis.com/token",
{
method:"POST",

headers:{
"Content-Type":
"application/x-www-form-urlencoded"
},

body:new URLSearchParams({

code,

client_id:
process.env.GOOGLE_CLIENT_ID!,

client_secret:
process.env.GOOGLE_CLIENT_SECRET!,

redirect_uri:
process.env.GOOGLE_REDIRECT_URI!,

grant_type:
"authorization_code"

})

}
);

return await response.json();

}

}
