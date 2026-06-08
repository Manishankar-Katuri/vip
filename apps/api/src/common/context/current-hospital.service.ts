import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import type { JwtUserPayload } from "../../auth/jwt";
import { UserRole } from "../../auth/types/user-role.enum";

export type SelectedHospitalContext = {
  selectedHospitalId:string;
  hospital:{
    id:string;
    name:string;
    slug:string;
    specialty:string | null;
    city:string | null;
    status:string;
  };
  user:JwtUserPayload;
};

export type HospitalAwareRequest = {
  selectedHospitalId?:string;
  hospitalContext?:SelectedHospitalContext;
};

const GLOBAL_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.PRODUCTION
]);

@Injectable()
export class CurrentHospitalService {
  constructor(
    private readonly prisma:PrismaService
  ) {}

  async getAvailableHospitals(
    user:JwtUserPayload
  ) {
    if (this.isGlobalUser(user)) {
      return this.prisma.hospitalWorkspace.findMany({
        where:{
          disabledAt:null,
          status:"ACTIVE"
        },
        orderBy:{ createdAt:"asc" },
        select:hospitalSelect
      });
    }

    if (!user.hospitalId) {
      throw new ForbiddenException(
        "Hospital-scoped users require a hospital assignment"
      );
    }

    const hospital = await this.prisma.hospitalWorkspace.findUnique({
      where:{ id:user.hospitalId },
      select:hospitalSelect
    });

    return hospital && hospital.status === "ACTIVE"
      ? [hospital]
      : [];
  }

  async resolveActiveHospital(
    user:JwtUserPayload,
    selectedHospitalId:string | null | undefined
  ):Promise<SelectedHospitalContext> {
    const hospitalId = this.resolveHospitalId(
      user,
      selectedHospitalId
    );

    const hospital = await this.prisma.hospitalWorkspace.findFirst({
      where:{
        id:hospitalId,
        disabledAt:null,
        status:"ACTIVE"
      },
      select:hospitalSelect
    });

    if (!hospital) {
      throw new NotFoundException("Hospital not found");
    }

    this.validateAccess(
      user,
      hospital.id
    );

    return {
      selectedHospitalId:hospital.id,
      hospital,
      user
    };
  }

  async selectHospital(
    user:JwtUserPayload,
    hospitalId:string
  ) {
    if (!this.isGlobalUser(user)) {
      throw new ForbiddenException(
        "Only global users can switch hospitals"
      );
    }

    return this.resolveActiveHospital(
      user,
      hospitalId
    );
  }

  validateAccess(
    user:JwtUserPayload,
    hospitalId:string
  ) {
    if (this.isGlobalUser(user)) {
      return;
    }

    if (user.hospitalId !== hospitalId) {
      throw new ForbiddenException(
        "User cannot access this hospital"
      );
    }
  }

  storeRequestContext(
    request:HospitalAwareRequest,
    context:SelectedHospitalContext
  ) {
    request.selectedHospitalId = context.selectedHospitalId;
    request.hospitalContext = context;

    return context;
  }

  getSelectedHospitalIdFromRequest(
    request:{ headers?:Record<string, string | string[] | undefined> }
  ) {
    const value =
      request.headers?.["x-hospital-id"] ??
      request.headers?.["X-Hospital-Id"];

    return Array.isArray(value)
      ? value[0]
      : value;
  }

  private resolveHospitalId(
    user:JwtUserPayload,
    selectedHospitalId:string | null | undefined
  ) {
    if (this.isGlobalUser(user)) {
      if (!selectedHospitalId) {
        throw new ForbiddenException(
          "Global users must select an active hospital"
        );
      }

      return selectedHospitalId;
    }

    if (!user.hospitalId) {
      throw new ForbiddenException(
        "Hospital-scoped users require a hospital assignment"
      );
    }

    if (selectedHospitalId && selectedHospitalId !== user.hospitalId) {
      throw new ForbiddenException(
        "Hospital-scoped users cannot switch hospitals"
      );
    }

    return user.hospitalId;
  }

  private isGlobalUser(
    user:JwtUserPayload
  ) {
    return user.isGlobal || GLOBAL_ROLES.has(user.role);
  }
}

const hospitalSelect = {
  id:true,
  name:true,
  slug:true,
  specialty:true,
  city:true,
  status:true
} as const;
