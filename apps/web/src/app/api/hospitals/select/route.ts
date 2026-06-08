import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@vip/database";
import { readAuthUser } from "@/lib/server/admin-auth";
import { hospitalSelect, toHospitalDto } from "@/lib/server/hospital-admin";

const selectSchema = z.object({
  hospitalId:z.string().min(1)
});

export async function POST(request:Request) {
  const user = readAuthUser(request);

  if (!user) {
    return NextResponse.json({ success:false, error:"Authentication is required." }, { status:401 });
  }

  const { hospitalId } = selectSchema.parse(await request.json());

  if (!user.isGlobal && user.hospitalId !== hospitalId) {
    return NextResponse.json({ success:false, error:"Hospital-scoped users cannot switch hospitals." }, { status:403 });
  }

  const hospital = await prisma.hospitalWorkspace.findUnique({
    where:{ id:hospitalId },
    select:hospitalSelect()
  });

  if (!hospital) {
    return NextResponse.json({ success:false, error:"Hospital not found." }, { status:404 });
  }

  return NextResponse.json({
    selectedHospitalId:hospital.id,
    activeHospital:toHospitalDto(hospital)
  });
}
