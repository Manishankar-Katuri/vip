import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

export type AuditLogInput = {
  userId?:string | null;
  action:string;
  resource:string;
  resourceId?:string | null;
  hospitalId?:string | null;
};

@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma:PrismaService
  ) {}

  async auditLog(
    input:AuditLogInput
  ) {
    return this.prisma.auditLog.create({
      data:{
        userId:input.userId ?? null,
        action:input.action,
        resource:input.resource,
        resourceId:input.resourceId ?? null,
        hospitalId:input.hospitalId ?? null
      }
    });
  }

  async list() {
    return this.prisma.auditLog.findMany({
      orderBy:{ createdAt:"desc" },
      take:100,
      include:{
        user:{
          select:{
            id:true,
            email:true,
            role:true
          }
        },
        hospital:{
          select:{
            id:true,
            name:true,
            slug:true
          }
        }
      }
    });
  }
}
