import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

export type AiAuditQuery = {
  hospitalId?:string;
  userId?:string;
  roleId?:string;
  feature?:string;
  provider?:string;
  model?:string;
  success?:string;
  from?:string;
  to?:string;
  page?:string;
  pageSize?:string;
};

export type AiPricingInput = {
  provider:string;
  model:string;
  inputTokenPricePerMillion:number;
  outputTokenPricePerMillion:number;
  currency?:string;
  isActive?:boolean;
  effectiveFrom?:string;
  effectiveTo?:string | null;
};

@Injectable()
export class AiAuditService {
  constructor(
    private readonly prisma:PrismaService
  ) {}

  async summary(
    query:AiAuditQuery
  ) {
    const where = whereFor(query);
    const logs = await this.prisma.aiAuditLog.findMany({
      where,
      orderBy:{ createdAt:"asc" },
      include:{
        hospital:{ select:{ id:true, name:true } },
        user:{ select:{ id:true, email:true, name:true, role:true } }
      }
    });
    const totalCalls = logs.length;
    const totalTokens = sum(logs, (log)=>log.totalTokens);
    const totalCost = sum(logs, (log)=>log.estimatedCost);
    const failedCalls = logs.filter((log)=>!log.success).length;
    const averageResponseTime = totalCalls
      ? Math.round(sum(logs, (log)=>log.responseTimeMs) / totalCalls)
      : 0;

    return {
      overview:{
        totalCalls,
        totalTokens,
        totalCost:roundMoney(totalCost),
        averageResponseTime,
        failedCalls
      },
      dailyUsage:seriesByDay(logs, (log)=>1),
      tokenConsumption:seriesByDay(logs, (log)=>log.totalTokens),
      costTrends:seriesByDay(logs, (log)=>log.estimatedCost),
      featureUsage:seriesByKey(logs, (log)=>log.feature),
      modelUsage:seriesByKey(logs, (log)=>log.model),
      hospitalUsage:seriesByKey(logs, (log)=>log.hospital?.name ?? log.hospitalId ?? "Global")
    };
  }

  async logs(
    query:AiAuditQuery
  ) {
    const page = positiveInt(query.page, 1);
    const pageSize = Math.min(positiveInt(query.pageSize, 25), 100);
    const where = whereFor(query);
    const [rows, total] = await Promise.all([
      this.prisma.aiAuditLog.findMany({
        where,
        orderBy:{ createdAt:"desc" },
        skip:(page - 1) * pageSize,
        take:pageSize,
        include:{
          hospital:{ select:{ id:true, name:true, slug:true } },
          user:{ select:{ id:true, email:true, name:true, role:true } }
        }
      }),
      this.prisma.aiAuditLog.count({ where })
    ]);

    return {
      rows,
      pagination:{
        page,
        pageSize,
        total,
        totalPages:total === 0 ? 0 : Math.ceil(total / pageSize)
      }
    };
  }

  async detail(
    id:string
  ) {
    const log = await this.prisma.aiAuditLog.findUnique({
      where:{ id },
      include:{
        hospital:{ select:{ id:true, name:true, slug:true } },
        user:{ select:{ id:true, email:true, name:true, role:true } }
      }
    });

    if (!log) {
      throw new NotFoundException("AI audit log not found");
    }

    return log;
  }

  async exportRows(
    query:AiAuditQuery
  ) {
    return this.prisma.aiAuditLog.findMany({
      where:whereFor(query),
      orderBy:{ createdAt:"desc" },
      include:{
        hospital:{ select:{ id:true, name:true, slug:true } },
        user:{ select:{ id:true, email:true, name:true, role:true } }
      }
    });
  }

  async listPricing() {
    return this.prisma.aiModelPricing.findMany({
      orderBy:[
        { provider:"asc" },
        { model:"asc" },
        { effectiveFrom:"desc" }
      ]
    });
  }

  async createPricing(
    input:AiPricingInput
  ) {
    return this.prisma.aiModelPricing.create({
      data:{
        provider:input.provider,
        model:input.model,
        inputTokenPricePerMillion:Number(input.inputTokenPricePerMillion),
        outputTokenPricePerMillion:Number(input.outputTokenPricePerMillion),
        currency:input.currency ?? "USD",
        isActive:input.isActive ?? true,
        ...(input.effectiveFrom ? { effectiveFrom:new Date(input.effectiveFrom) } : {}),
        ...(input.effectiveTo !== undefined ? { effectiveTo:input.effectiveTo ? new Date(input.effectiveTo) : null } : {})
      }
    });
  }

  async updatePricing(
    id:string,
    input:Partial<AiPricingInput>
  ) {
    return this.prisma.aiModelPricing.update({
      where:{ id },
      data:pricingData(input)
    });
  }
}

export function csvForLogs(
  rows:Array<Record<string, any>>
) {
  const headers = [
    "Timestamp",
    "Hospital",
    "User",
    "Role",
    "Feature",
    "Provider",
    "Model",
    "Prompt Tokens",
    "Completion Tokens",
    "Total Tokens",
    "Cost",
    "Duration Ms",
    "Status",
    "Error"
  ];
  const lines = rows.map((log)=>[
    log.createdAt?.toISOString?.() ?? String(log.createdAt),
    log.hospital?.name ?? log.hospitalId ?? "Global",
    log.user?.email ?? log.userId ?? "System",
    log.roleId ?? log.user?.role ?? "",
    log.feature,
    log.provider,
    log.model,
    log.promptTokens,
    log.completionTokens,
    log.totalTokens,
    log.estimatedCost,
    log.responseTimeMs,
    log.success ? "Success" : "Failed",
    log.errorMessage ?? ""
  ]);

  return [
    headers,
    ...lines
  ]
    .map((line)=>line.map(csvCell).join(","))
    .join("\n");
}

export function excelXmlForLogs(
  rows:Array<Record<string, any>>
) {
  const csv = csvForLogs(rows);
  const lines = csv.split("\n").map((line)=>
    line.split(",").map((cell)=>
      cell.replace(/^"|"$/g, "").replace(/""/g, "\"")
    )
  );

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="AI Audit Logs">
  <Table>
${lines.map((line)=>`   <Row>${line.map((cell)=>`<Cell><Data ss:Type="String">${xmlCell(cell)}</Data></Cell>`).join("")}</Row>`).join("\n")}
  </Table>
 </Worksheet>
</Workbook>`;
}

function whereFor(
  query:AiAuditQuery
) {
  return {
    ...(query.hospitalId ? { hospitalId:query.hospitalId } : {}),
    ...(query.userId ? { userId:query.userId } : {}),
    ...(query.roleId ? { roleId:query.roleId } : {}),
    ...(query.feature ? { feature:query.feature } : {}),
    ...(query.provider ? { provider:query.provider } : {}),
    ...(query.model ? { model:query.model } : {}),
    ...(query.success === "true" ? { success:true } : {}),
    ...(query.success === "false" ? { success:false } : {}),
    ...(query.from || query.to ? {
      createdAt:{
        ...(query.from ? { gte:new Date(query.from) } : {}),
        ...(query.to ? { lte:new Date(query.to) } : {})
      }
    } : {})
  };
}

function pricingData(
  input:Partial<AiPricingInput>
) {
  return {
    ...(input.provider !== undefined ? { provider:input.provider } : {}),
    ...(input.model !== undefined ? { model:input.model } : {}),
    ...(input.inputTokenPricePerMillion !== undefined ? { inputTokenPricePerMillion:Number(input.inputTokenPricePerMillion) } : {}),
    ...(input.outputTokenPricePerMillion !== undefined ? { outputTokenPricePerMillion:Number(input.outputTokenPricePerMillion) } : {}),
    ...(input.currency !== undefined ? { currency:input.currency } : {}),
    ...(input.isActive !== undefined ? { isActive:Boolean(input.isActive) } : {}),
    ...(input.effectiveFrom !== undefined ? { effectiveFrom:new Date(input.effectiveFrom) } : {}),
    ...(input.effectiveTo !== undefined ? { effectiveTo:input.effectiveTo ? new Date(input.effectiveTo) : null } : {})
  };
}

function sum<T>(
  rows:T[],
  value:(row:T)=>number
) {
  return rows.reduce((total, row)=>total + value(row), 0);
}

function seriesByDay<T extends { createdAt:Date }>(
  rows:T[],
  value:(row:T)=>number
) {
  const map = new Map<string, number>();

  rows.forEach((row)=>{
    const day = row.createdAt.toISOString().slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + value(row));
  });

  return Array.from(map.entries()).map(([date, total])=>({
    date,
    total:roundMoney(total)
  }));
}

function seriesByKey<T>(
  rows:T[],
  key:(row:T)=>string
) {
  const map = new Map<string, number>();

  rows.forEach((row)=>{
    const name = key(row);
    map.set(name, (map.get(name) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, total])=>({ name, total }))
    .sort((left, right)=>right.total - left.total)
    .slice(0, 10);
}

function positiveInt(
  value:string | undefined,
  fallback:number
) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

function roundMoney(
  value:number
) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function csvCell(
  value:unknown
) {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, "\"\"")}"`;
}

function xmlCell(
  value:string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
