import { ForbiddenException } from "@nestjs/common";
import type { JwtUserPayload } from "../../auth/jwt";

export type HospitalContext = {
  userId:string;
  role:JwtUserPayload["role"];
  hospitalId:string | null;
  isGlobal:boolean;
};

export function getHospitalContext(
  user:JwtUserPayload
): HospitalContext {
  return {
    userId:user.userId,
    role:user.role,
    hospitalId:user.hospitalId,
    isGlobal:user.isGlobal
  };
}

export function assertHospitalAccess(
  user:JwtUserPayload,
  hospitalId:string
) {
  if (user.isGlobal) {
    return getHospitalContext(user);
  }

  if (user.hospitalId !== hospitalId) {
    throw new ForbiddenException(
      "User cannot access this hospital"
    );
  }

  return getHospitalContext(user);
}
