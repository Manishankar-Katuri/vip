type Competitor={

name:string;

rating:number;

address:string;

types:string[];

};

const store:
Record<
string,
Competitor[]
>={};

export function saveCompetitors(

hospital:string,

competitors:
Competitor[]

){

store[
hospital
]=competitors;

return store[
hospital
];

}

export function getCompetitors(

hospital:string

){

return store[
hospital
] || [];

}