import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InvitationStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../admin/audit-log.service";
import { hashInvitationToken } from "./invitation-token";
import { signJwt, type JwtUserPayload } from "./jwt";
import {
  hashPassword,
  verifyPassword
} from "./password";
import { UserRole } from "./types/user-role.enum";

const GLOBAL_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.PRODUCTION
]);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma:PrismaService,
    private readonly audit:AuditLogService
  ) {}

  async login(
    input:{
      userId?:string;
      email?:string;
      password?:string;
    }
  ) {
    const user = input.userId
      ? await this.prisma.user.findUnique({
          where:{ id:input.userId }
        })
      : input.email
        ? await this.prisma.user.findUnique({
            where:{ email:input.email }
          })
        : null;

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.isActive) {
      throw new ForbiddenException("User is inactive");
    }

    if (input.email) {
      if (!input.password || !user.passwordHash) {
        throw new ForbiddenException("Password login is not configured");
      }

      if (!verifyPassword(input.password, user.passwordHash)) {
        throw new ForbiddenException("Invalid credentials");
      }
    }

    const role = user.role as UserRole;
    const isGlobal = GLOBAL_ROLES.has(role);

    if (!isGlobal && !user.hospitalId) {
      throw new ForbiddenException(
        "Hospital-scoped users must be assigned to a hospital"
      );
    }

    const payload:JwtUserPayload = {
      userId:user.id,
      role,
      hospitalId:user.hospitalId,
      isGlobal
    };

    return {
      accessToken:signJwt(
        payload,
        getJwtSecret()
      ),
      user:payload,
      redirectTo:getLoginRedirect(role)
    };
  }

  async acceptInvite(
    token:string
  ) {
    const invitation = await this.getValidInvitation(token);

    return {
      email:invitation.email,
      role:invitation.role,
      hospitalId:invitation.hospitalId,
      isGlobal:invitation.isGlobal,
      expiresAt:invitation.expiresAt
    };
  }

  async setPassword(
    input:{
      token:string;
      password:string;
      name?:string;
    }
  ) {
    if (!input.password || input.password.length < 8) {
      throw new BadRequestException(
        "Password must be at least 8 characters"
      );
    }

    const invitation = await this.getValidInvitation(input.token);
    const role = invitation.role as UserRole;
    const user = await this.prisma.user.upsert({
      where:{ email:invitation.email },
      create:{
        email:invitation.email,
        name:input.name ?? null,
        role,
        hospitalId:invitation.hospitalId,
        isGlobal:invitation.isGlobal,
        isActive:true,
        passwordHash:hashPassword(input.password)
      },
      update:{
        name:input.name,
        role,
        hospitalId:invitation.hospitalId,
        isGlobal:invitation.isGlobal,
        isActive:true,
        passwordHash:hashPassword(input.password)
      }
    });

    await this.prisma.invitation.update({
      where:{ id:invitation.id },
      data:{
        status:InvitationStatus.ACCEPTED,
        acceptedAt:new Date()
      }
    });

    await this.audit.auditLog({
      userId:user.id,
      action:"invitation.accepted",
      resource:"Invitation",
      resourceId:invitation.id,
      hospitalId:invitation.hospitalId
    });
    await this.audit.auditLog({
      userId:user.id,
      action:"password.set",
      resource:"User",
      resourceId:user.id,
      hospitalId:user.hospitalId
    });
    await this.audit.auditLog({
      userId:user.id,
      action:"user.activated",
      resource:"User",
      resourceId:user.id,
      hospitalId:user.hospitalId
    });

    return this.login({
      email:user.email,
      password:input.password
    });
  }

  private async getValidInvitation(
    token:string
  ) {
    const invitation = await this.prisma.invitation.findUnique({
      where:{ token:hashInvitationToken(token) }
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new ForbiddenException("Invitation has been revoked");
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new ForbiddenException("Invitation has already been accepted");
    }

    if (
      invitation.status === InvitationStatus.EXPIRED ||
      invitation.expiresAt.getTime() < Date.now()
    ) {
      await this.prisma.invitation.update({
        where:{ id:invitation.id },
        data:{ status:InvitationStatus.EXPIRED }
      });

      throw new ForbiddenException("Invitation has expired");
    }

    return invitation;
  }
}

export function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }

  return "vip-development-secret-change-me";
}

function getLoginRedirect(
  role:UserRole
) {
  const redirects:Record<UserRole, string> = {
    [UserRole.ADMIN]:"/admin/command-centre",
    [UserRole.PRODUCTION]:"/production/command-centre",
    [UserRole.DOCTOR]:"/doctor/morning-briefing",
    [UserRole.STAFF]:"/staff/operations-centre"
  };

  return redirects[role];
}
