const memory=new Map();

export function getCache(key:string){

return memory.get(key);

}

export function setCache(
key:string,
value:any
){

memory.set(key,value);

}