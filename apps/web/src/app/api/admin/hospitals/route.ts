import { NextResponse } from "next/server";

import prisma from "@vip/database";
import {
  adminJsonError,
  hospitalInputSchema,
  hospitalSelect,
  initializeDefaultRolePermissions,
  normalizeCode,
  requireHospitalAdmin,
  toHospitalDto,
  uniqueSlug
} from "@/lib/server/hospital-admin";

export async function GET(request:Request) {
  try {
    requireHospitalAdmin(request);
    const hospitals = await prisma.hospitalWorkspace.findMany({
      select:hospitalSelect(),
      orderBy:{ createdAt:"desc" }
    });

    return NextResponse.json(hospitals.map(toHospitalDto));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request:Request) {
  try {
    const user = requireHospitalAdmin(request);
    const input = hospitalInputSchema.parse(await request.json());
    const slug = await uniqueSlug(input.name, input.slug);
    const hospitalCode = normalizeCode(input.hospitalCode, slug);

    const hospital = await prisma.hospitalWorkspace.create({
      data:{
        name:input.name,
        hospitalName:input.hospitalName || input.name,
        slug,
        hospitalCode,
        domain:input.domain || null,
        industryType:input.industryType || null,
        contactEmail:input.contactEmail || null,
        specialty:input.specialty || null,
        city:input.city || null,
        status:input.status
      },
      select:hospitalSelect()
    });

    await initializeDefaultRolePermissions(hospital.id, user.userId);

    return NextResponse.json(toHospitalDto(hospital), { status:201 });
  } catch (error) {
    return adminJsonError(error);
  }
}
