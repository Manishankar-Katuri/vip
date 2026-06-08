export type Review={

author:string;

rating:number;

text:string;

time?:string;

};

const store:
Record<
string,
Review[]
>={};

export function saveReviews(

hospital:string,

reviews:Review[]

){

store[
hospital
]=reviews;

return reviews;

}

export function getReviews(

hospital:string

){

return store[
hospital
] || [];

}