import { Injectable } from "@nestjs/common";

@Injectable()
export class GbpService {

async getAccounts(){

const token=
process.env.GOOGLE_OAUTH_ACCESS_TOKEN;

const response=
await fetch(
"https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
{
headers:{
Authorization:
`Bearer ${token}`
}
}
);

return await response.json();

}

async getLocations(
accountId:string
){

const token=
process.env.GOOGLE_OAUTH_ACCESS_TOKEN;

const response=
await fetch(

`https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,

{
headers:{
Authorization:
`Bearer ${token}`
}
}

);

return await response.json();

}

}