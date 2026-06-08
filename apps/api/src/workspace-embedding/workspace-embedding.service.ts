import {
  Injectable,
  Logger
}
from "@nestjs/common";

import OpenAI from "openai";

import {
  pipeline
}
from "@xenova/transformers";

import {
  PrismaService
}
from "../prisma.service";

import {
  cosineSimilarity
}
from "../utils/cosineSimilarity";

import { AIUsageTracker }
from "../ai-audit/ai-usage-tracker.service";

const CHUNK_SIZE =
1000;

type LocalExtractor =
(
text:string,
options:{
pooling:"mean";
normalize:boolean;
}
)=>Promise<{
data:Float32Array | number[];
}>;

@Injectable()

export class WorkspaceEmbeddingService{

private readonly logger =
new Logger(
WorkspaceEmbeddingService.name
);

private readonly openai =
new OpenAI({
apiKey:
process.env.OPENAI_API_KEY
});

private localExtractorPromise:
Promise<LocalExtractor> | null =
null;

constructor(

private prisma:
PrismaService,

private readonly aiUsageTracker:
AIUsageTracker

){}

async embedWorkspace(
workspaceId:string
){

this
.logger
.log(
`Embedding pipeline started for workspace ${workspaceId}`
)

const content =
await this
.prisma
.websiteContent
.findMany({

where:{
workspaceId
}

})

this
.logger
.debug(
`Website records: ${content.length}`
)

const chunks =
content
.flatMap((website)=>
this
.splitIntoChunks(
website.content
)
.map((chunkText)=>({
sourceId:
website.id,

chunkText
}))
)

this
.logger
.debug(
`Chunks created: ${chunks.length}`
)

this
.logger
.log(
`Prepared ${chunks.length} chunks for workspace ${workspaceId}`
)

let savedCount =
0;

for(const chunk of chunks){

this
.logger
.log(
`Generating embedding for source ${chunk.sourceId}`
)

const embedding =
await this
.generateEmbedding(
chunk.chunkText,
workspaceId,
"workspace-embedding.embed"
)

await this
.prisma
.vectorMemory
.create({

data:{
workspaceId,

sourceId:
chunk.sourceId,

chunkText:
chunk.chunkText,

embedding
}

})

savedCount =
savedCount + 1;

}

this
.logger
.debug(
`Saved vectors: ${savedCount}`
)

this
.logger
.log(
`Embedding pipeline completed for workspace ${workspaceId}. Saved ${savedCount}/${chunks.length} chunks.`
)

return {
savedCount
}

}

async searchWorkspace(
workspaceId:string,
query:string
){

this
.logger
.log(
`Retrieval query for workspace ${workspaceId}: ${query}`
)

const queryEmbedding =
await this
.generateEmbedding(
query,
workspaceId,
"workspace-embedding.search"
)

const vectorMemories =
await this
.prisma
.vectorMemory
.findMany({

where:{
workspaceId
},

orderBy:{
createdAt:"desc"
}

})

const scoredResults =
vectorMemories
.map((memory)=>({
chunkText:
memory.chunkText,

score:
cosineSimilarity(
queryEmbedding,
memory.embedding as number[]
)
}))
.sort((first,second)=>
second.score - first.score
)
.slice(
0,
5
)

this
.logger
.log(
`Matched ${scoredResults.length} chunks for workspace ${workspaceId}`
)

scoredResults
.forEach((result,index)=>{

this
.logger
.log(
`Match ${index + 1}: score=${result.score.toFixed(4)} chunk="${result.chunkText.slice(0,120)}"`
)

})

return {
results:
scoredResults
}

}

async chatWorkspace(
workspaceId:string,
message:string
){

const retrieval =
await this
.searchWorkspace(
workspaceId,
message
)

const context =
retrieval
.results
.map((result,index)=>
`Source ${index + 1} (score ${result.score.toFixed(4)}):\n${result.chunkText}`
)
.join("\n\n")

let answer =
"I do not have enough hospital knowledge to answer that.";

if(
process.env.OPENAI_QUOTA_APPROVED === "false" ||
process.env.DISABLE_OPENAI === "true" ||
!process.env.OPENAI_API_KEY
){

answer =
this.extractiveAnswer(
message,
retrieval.results.map((result)=>result.chunkText)
)

} else {

try{

const completion =
await this.aiUsageTracker.execute({
hospitalId:
workspaceId,

feature:
"workspace-embedding.chat",

provider:
"openai",

model:
"gpt-4.1-mini",

operation:()=>this
  .openai
  .chat
  .completions
  .create({
  model:
  "gpt-4.1-mini",

  messages:[
  {
  role:
  "system",

  content:
  "You are an AI assistant answering only using hospital knowledge."
  },
  {
  role:
  "user",

  content:
  `Context:\n${context || "No hospital knowledge found."}\n\nQuestion:\n${message}`
  }
  ]
  })
})

answer =
completion
.choices[0]
.message
.content
||
answer

} catch(error){

if(
!this
.shouldUseLocalFallback(error)
){

throw error

}

this
.logger
.warn(
"Using local workspace chat fallback"
)

answer =
this.extractiveAnswer(
message,
retrieval.results.map((result)=>result.chunkText)
)

}

}

return {
answer,

sources:
retrieval.results
}

}

async getVectorMemoryCount(
workspaceId:string
){

const count =
await this
.prisma
.vectorMemory
.count({

where:{
workspaceId
}

})

return {
count
}

}

private async generateEmbedding(
text:string,
workspaceId:string,
feature:string
){

try{

const embeddingResponse =
await this.aiUsageTracker.execute({
hospitalId:
workspaceId,

feature,

provider:
"openai",

model:
"text-embedding-3-small",

operation:()=>this
  .openai
  .embeddings
  .create({
  model:
  "text-embedding-3-small",

  input:
  text
  })
})

return embeddingResponse
.data[0]
.embedding

}

catch(error){

if(
!this
.shouldUseLocalFallback(error)
){

throw error

}

this
.logger
.warn(
"Using local embedding fallback"
)

return await this
.generateLocalEmbedding(
text
)

}

}

private shouldUseLocalFallback(
error:unknown
){

const errorRecord =
error as {
code?:string;
error?:{
code?:string;
type?:string;
};
message?:string;
status?:number;
};

const code =
errorRecord.code ||
errorRecord.error?.code ||
errorRecord.error?.type ||
"";

const message =
errorRecord.message ||
"";

return [
"insufficient_quota",
"invalid_api_key"
].some((fallbackCode)=>
code.includes(fallbackCode) ||
message.includes(fallbackCode)
) ||
errorRecord.status === 429

}

private async generateLocalEmbedding(
text:string
){

const extractor =
await this
.getLocalExtractor()

const output =
await extractor(
text,
{
pooling:
"mean",

normalize:
true
}
)

return Array
.from(
output.data
)

}

private async getLocalExtractor(){

if(!this.localExtractorPromise){

this.localExtractorPromise =
Promise
.resolve()
.then(async()=>{

const extractor =
await pipeline(
"feature-extraction",
"Xenova/all-MiniLM-L6-v2"
)

return extractor as LocalExtractor

})

}

return await this.localExtractorPromise

}

private extractiveAnswer(
message:string,
chunks:string[]
){

if(!chunks.length){

return "I do not have enough hospital knowledge to answer that.";

}

const terms =
message
.toLowerCase()
.split(/\W+/)
.filter((term)=>
term.length > 3
)

const sentences =
chunks
.join("\n")
.split(/(?<=[.!?])\s+|\n+/)
.map((sentence)=>
sentence.trim()
)
.filter(Boolean)

const ranked =
sentences
.map((sentence)=>({
sentence,
score:
terms
.filter((term)=>
sentence
.toLowerCase()
.includes(term)
)
.length
}))
.sort((first,second)=>
second.score - first.score
)

const selected =
ranked
.filter((item)=>
item.score > 0
)
.slice(0,3)
.map((item)=>
item.sentence
)

const answerSentences =
selected.length
? selected
: sentences.slice(0,3)

return answerSentences.join(" ");

}

private splitIntoChunks(
content:string
){

const normalizedContent =
content
.trim()

const chunks:string[] =
[];

for(
let index = 0;
index < normalizedContent.length;
index = index + CHUNK_SIZE
){

const chunk =
normalizedContent
.slice(
index,
index + CHUNK_SIZE
)
.trim()

if(chunk){

chunks
.push(chunk)

}

}

return chunks

}

}
