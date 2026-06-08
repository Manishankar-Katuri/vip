import { NextResponse } from "next/server";

import prisma from "@vip/database";
import {
  adminJsonError,
  hospitalPatchSchema,
  hospitalSelect,
  normalizeCode,
  requireHospitalAdmin,
  toHospitalDto
} from "@/lib/server/hospital-admin";

type RouteContext = {
  params:Promise<{ id:string }>;
};

export async function GET(request:Request, context:RouteContext) {
  try {
    requireHospitalAdmin(request);
    const { id } = await context.params;
    const hospital = await prisma.hospitalWorkspace.findUnique({
      where:{ id },
      select:hospitalSelect()
    });

    if (!hospital) {
      return NextResponse.json({ success:false, error:"Hospital not found." }, { status:404 });
    }

    return NextResponse.json(toHospitalDto(hospital));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH(request:Request, context:RouteContext) {
  try {
    const user = requireHospitalAdmin(request);
    const { id } = await context.params;
    const input = hospitalPatchSchema.parse(await request.json());
    const existing = await prisma.hospitalWorkspace.findUnique({
      where:{ id },
      select:{ id:true, slug:true, name:true }
    });

    if (!existing) {
      return NextResponse.json({ success:false, error:"Hospital not found." }, { status:404 });
    }

    const hospital = await prisma.hospitalWorkspace.update({
      where:{ id },
      data:{
        ...(input.name ? { name:input.name, hospitalName:input.hospitalName || input.name } : {}),
        ...(input.hospitalName ? { hospitalName:input.hospitalName } : {}),
        ...(input.hospitalCode !== undefined ? { hospitalCode:normalizeCode(input.hospitalCode, existing.slug) } : {}),
        ...(input.domain !== undefined ? { domain:input.domain || null } : {}),
        ...(input.industryType !== undefined ? { industryType:input.industryType || null } : {}),
        ...(input.contactEmail !== undefined ? { contactEmail:input.contactEmail || null } : {}),
        ...(input.specialty !== undefined ? { specialty:input.specialty || null } : {}),
        ...(input.city !== undefined ? { city:input.city || null } : {}),
        ...(input.status ? { status:input.status } : {}),
        ...(input.disabled !== undefined ? { disabledAt:input.disabled ? new Date() : null } : {})
      },
      select:hospitalSelect()
    });

    await prisma.auditLog.create({
      data:{
        userId:user.userId,
        action:"hospital.update",
        resource:"HospitalWorkspace",
        resourceId:id,
        hospitalId:id
      }
    });

    return NextResponse.json(toHospitalDto(hospital));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function DELETE(request:Request, context:RouteContext) {
  try {
    const user = requireHospitalAdmin(request);
    const { id } = await context.params;
    const dependencies = await prisma.$transaction([
      prisma.user.count({ where:{ hospitalId:id } }),
      prisma.contentCalendarItem.count({ where:{ hospitalId:id } }),
      prisma.contentGeneratorRun.count({ where:{ hospitalId:id } }),
      prisma.hospitalIntegrationConfig.count({ where:{ hospitalId:id } })
    ]);
    const hasDependencies = dependencies.some((count) => count > 0);

    if (hasDependencies) {
      const hospital = await prisma.hospitalWorkspace.update({
        where:{ id },
        data:{
          status:"PAUSED",
          disabledAt:new Date()
        },
        select:hospitalSelect()
      });

      await prisma.auditLog.create({
        data:{
          userId:user.userId,
          action:"hospital.disable",
          resource:"HospitalWorkspace",
          resourceId:id,
          hospitalId:id
        }
      });

      return NextResponse.json({ deleted:false, hospital:toHospitalDto(hospital) });
    }

    await prisma.hospitalWorkspace.delete({ where:{ id } });
    await prisma.auditLog.create({
      data:{
        userId:user.userId,
        action:"hospital.delete",
        resource:"HospitalWorkspace",
        resourceId:id,
        hospitalId:id
      }
    });

    return NextResponse.json({ deleted:true });
  } catch (error) {
    return adminJsonError(error);
  }
}
