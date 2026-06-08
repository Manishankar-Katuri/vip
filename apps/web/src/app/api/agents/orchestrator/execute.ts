import { routeTask } from "./router";

import { ContentAgent } from "../content-agent";
import { ReviewAgent } from "../review-agent";
import { CompetitorAgent } from "../competitor-agent";
import { TrendAgent } from "../trend-agent";

type AgentInput = {
    task:string;
    [key:string]:unknown;
};

export async function executeAgent(input:AgentInput){

    const agent = routeTask(input.task);

    switch(agent){

        case "content-agent":
            return await ContentAgent.execute(input);

        case "review-agent":
            return await ReviewAgent.execute(input);

        case "competitor-agent":
            return await CompetitorAgent.execute(input);

        case "trend-agent":
            return await TrendAgent.execute(input);

        default:
            throw new Error("Agent not found");

    }

}
