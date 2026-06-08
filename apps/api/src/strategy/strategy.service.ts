import { Injectable } from "@nestjs/common";

type Recommendation={

priority:string;

title:string;

action:string;

};

@Injectable()
export class StrategyService {

generateStrategy(
dashboard:any,
competitor:any
){

const recommendations:
Recommendation[]=[];


if(
dashboard.doctorTrustIssues>2
){

recommendations.push({

priority:"HIGH",

title:
"Doctor Trust Recovery Campaign",

action:

"Create doctor introduction videos and treatment transparency content"

});

}


if(
dashboard.staffIssues>1
){

recommendations.push({

priority:"HIGH",

title:
"Patient Experience Campaign",

action:

"Publish patient stories and staff care content"

});

}


if(
competitor?.insights?.length
){

recommendations.push({

priority:"MEDIUM",

title:
"Competitor Gap Strategy",

action:

String(
competitor.insights[0]
)

});

}


recommendations.push({

priority:"MEDIUM",

title:
"Review Acquisition Campaign",

action:

"Launch QR-based review collection after consultations"

});


return{

sixtyDayGoal:

"Increase reputation score and appointment trust",


strategy:

recommendations

};

}

}