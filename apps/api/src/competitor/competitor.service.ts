import { Injectable } from "@nestjs/common";

@Injectable()
export class CompetitorService {

async findNearbyCompetitors(
hospital:string
){

const apiKey=
process.env.GOOGLE_PLACES_KEY;

const specialty="ENT";

const searchUrl=

`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
hospital
)}&key=${apiKey}`;

const searchResponse=
await fetch(
searchUrl
);

const searchData=
await searchResponse.json();

if(
!searchData.results?.length
){

return {
error:
"Hospital not found"
};

}

const client=
searchData.results[0];

const location=
client.geometry.location;

const competitorUrl=

`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${specialty}+hospital&location=${location.lat},${location.lng}&radius=15000&key=${apiKey}`;

const competitorResponse=
await fetch(
competitorUrl
);

const competitorData=
await competitorResponse.json();

const competitors=

competitorData.results

.filter(
(place:any)=>

!place.name
.toLowerCase()
.includes(
"harika"
)

)

.filter(
(place:any)=>

place.user_ratings_total>20

)

.sort(
(a:any,b:any)=>

b.user_ratings_total-
a.user_ratings_total

)

.slice(
0,
10
);

const clientReviews=
client.user_ratings_total||0;

const top=
competitors[0];

return{

client:{

name:
client.name,

rating:
client.rating,

reviews:
clientReviews

},

competitors:

competitors.map(
(c:any)=>({

name:
c.name,

rating:
c.rating,

reviews:
c.user_ratings_total,

address:
c.formatted_address||

c.vicinity

})
),

insights:[

top
?`${top.name} has ${Math.round(
top.user_ratings_total/
Math.max(
clientReviews,
1
)
)}x more reviews`
:null,

"Focused specialty: ENT",

"Radius:15km",

"Doctor authority content recommended",

"ENT awareness campaigns recommended",

"Review acquisition campaign recommended"

].filter(Boolean)

}

}


/*
REVIEW INGESTION
*/

async getReviews(
hospital:string
){

const key=
process.env
.GOOGLE_PLACES_KEY;

const search=

await fetch(

`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
hospital
)}&key=${key}`

);

const searchData=
await search.json();

if(
!searchData.results?.length
){

return{

error:
"Hospital not found"

};

}

const placeId=

searchData.results[0]
.place_id;

const details=

await fetch(

`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${key}`

);

const data=
await details.json();

const result=
data.result;

return{

hospital:
result.name,

rating:
result.rating,

reviewCount:
result.user_ratings_total,

reviews:

(result.reviews||[])

.map(
(r:any)=>({

author:
r.author_name,

rating:
r.rating,

text:
r.text,

time:
r.relative_time_description

})
)

};

}

}