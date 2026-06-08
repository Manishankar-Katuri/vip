export function getContentPrompt(data:any){

return `

Generate 5 social media posts.

Hospital:
${data.hospital}

Platform:
${data.platform}

Goal:
${data.goal}

Keep concise.

`;

}