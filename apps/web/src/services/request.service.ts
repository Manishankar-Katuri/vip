import axios from "axios";
import type { HospitalRequestForm } from "@/lib/request-schema";

export type RequestStatus =
  | "NEW"
  | "REVIEWING"
  | "APPROVED"
  | "SETUP"
  | "LIVE";

export type HospitalRequest = {
  id: string;
  hospitalName: string;
  contactName: string;
  email: string;
  website?: string | null;
  status: RequestStatus;
  createdAt: string;
};

export type HospitalWorkspace = {
  id: string;
  hospitalRequestId?: string;
  hospitalName: string;
  slug: string;
  status: "CREATING" | "ACTIVE" | "PAUSED";
  createdAt?: string;
  knowledgeSources?: KnowledgeSource[];
  hospitalRequest?: HospitalRequest;
};

export type KnowledgeSourceType =
  | "WEBSITE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "YOUTUBE"
  | "REVIEWS"
  | "BLOG";

export type KnowledgeSource = {
  id: string;
  workspaceId: string;
  sourceType: KnowledgeSourceType;
  sourceName: string;
  sourceUrl?: string | null;
  createdAt: string;
};

export type CreateKnowledgeSourcePayload = {
  sourceType: KnowledgeSourceType;
  sourceName: string;
  sourceUrl?: string;
};

export type WebsiteContent = {
  id: string;
  workspaceId: string;
  url: string;
  title?: string | null;
  description?: string | null;
  content: string;
  createdAt: string;
};

export type KnowledgeSearchResult = {
  chunkText: string;
  score: number;
};

export type KnowledgeSearchResponse = {
  results: KnowledgeSearchResult[];
};

export type ContentPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "BLOG"
  | "LINKEDIN";

export type ContentStatus =
  | "DRAFT"
  | "APPROVED"
  | "PUBLISHED";

export type ContentDraft = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  platform: ContentPlatform;
  status: ContentStatus;
  createdAt: string;
};

export type WorkspaceChatResponse = {
  answer: string;
  sources: KnowledgeSearchResult[];
};

export type GenerateMemoryResponse = {
  chunkCount?: number;
  savedCount: number;
};

export type ApproveHospitalRequestResponse = {
  request: HospitalRequest;
  workspace: HospitalWorkspace | null;
};

const HOSPITAL_REQUEST_URL =
  "http://localhost:3001/hospital-request";

const WORKSPACE_URL =
  "http://localhost:3001/workspace";

export const submitHospitalRequest =
async(data:HospitalRequestForm)=>{

const response=
await axios.post(

HOSPITAL_REQUEST_URL,

data

)

return response.data

}

export const getWorkspace =
async(workspaceId:string)=>{

const response =
await axios.get<HospitalWorkspace>(
`${WORKSPACE_URL}/${workspaceId}`
)

return response.data

}

export const getKnowledgeSources =
async(workspaceId:string)=>{

const response =
await axios.get<KnowledgeSource[]>(
`${WORKSPACE_URL}/${workspaceId}/knowledge`
)

return response.data

}

export const createKnowledgeSource =
async({
workspaceId,
payload
}:{
workspaceId:string;
payload:CreateKnowledgeSourcePayload;
})=>{

const response =
await axios.post<KnowledgeSource>(
`${WORKSPACE_URL}/${workspaceId}/knowledge`,
payload
)

return response.data

}

export const ingestWebsite =
async({
workspaceId,
url
}:{
workspaceId:string;
url:string;
})=>{

const response =
await axios.post<WebsiteContent>(
`${WORKSPACE_URL}/${workspaceId}/ingest/website`,
{
url
}
)

return response.data

}

export const getWebsiteContentCount =
async(workspaceId:string)=>{

const response =
await axios.get<{
count:number;
}>(
`${WORKSPACE_URL}/${workspaceId}/website-content/count`
)

return response.data

}

export const searchWorkspaceMemory =
async({
workspaceId,
query
}:{
workspaceId:string;
query:string;
})=>{

const response =
await axios.post<KnowledgeSearchResponse>(
`${WORKSPACE_URL}/${workspaceId}/search`,
{
query
}
)

return response.data

}

export const generateWorkspaceMemory =
async(workspaceId:string)=>{

const response =
await axios.post<GenerateMemoryResponse>(
`${WORKSPACE_URL}/${workspaceId}/embed`
)

return response.data

}

export const chatWithWorkspace =
async({
workspaceId,
message
}:{
workspaceId:string;
message:string;
})=>{

const response =
await axios.post<WorkspaceChatResponse>(
`${WORKSPACE_URL}/${workspaceId}/chat`,
{
message
}
)

return response.data

}

export const getVectorMemoryCount =
async(workspaceId:string)=>{

const response =
await axios.get<{
count:number;
}>(
`${WORKSPACE_URL}/${workspaceId}/vector-memory/count`
)

return response.data

}

export const getContentDrafts =
async(workspaceId:string)=>{

const response =
await axios.get<ContentDraft[]>(
`${WORKSPACE_URL}/${workspaceId}/content`
)

return response.data

}

export const generateContentDraft =
async({
workspaceId,
platform,
type
}:{
workspaceId:string;
platform:ContentPlatform;
type:string;
})=>{

const response =
await axios.post<ContentDraft>(
`${WORKSPACE_URL}/${workspaceId}/content/generate`,
{
platform,
type
}
)

return response.data

}

export const approveContentDraft =
async(draftId:string)=>{

const response =
await axios.patch<ContentDraft>(
`${WORKSPACE_URL}/content/${draftId}/status`,
{
status:"APPROVED"
}
)

return response.data

}

export const getHospitalRequests =
async()=>{

const response =
await axios.get<HospitalRequest[]>(
HOSPITAL_REQUEST_URL
)

return response.data

}

export const approveHospitalRequest =
async(id:string)=>{

const response =
await axios.patch<ApproveHospitalRequestResponse>(
`${HOSPITAL_REQUEST_URL}/${id}`,
{
status:"APPROVED"
}
)

return response.data

}
