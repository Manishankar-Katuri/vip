import { NextResponse } from "next/server";

import prisma from "@vip/database";
import { readAuthUser } from "@/lib/server/admin-auth";
import { hospitalSelect, toHospitalDto } from "@/lib/server/hospital-admin";

export async function GET(request:Request) {
  const user = readAuthUser(request);

  if (!user) {
    return NextResponse.json({ success:false, error:"Authentication is required." }, { status:401 });
  }

  const hospitals = await prisma.hospitalWorkspace.findMany({
    where:user.isGlobal
      ? {}
      : { id:user.hospitalId ?? "__none__" },
    select:hospitalSelect(),
    orderBy:{ name:"asc" }
  });
  const activeHospital = hospitals.find((hospital) => hospital.id === user.hospitalId) ?? hospitals[0] ?? null;

  return NextResponse.json({
    hospitals:hospitals.map(toHospitalDto),
    activeHospital:activeHospital ? toHospitalDto(activeHospital) : null
  });
}
