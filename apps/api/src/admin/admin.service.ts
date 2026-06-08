import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  IntegrationConfigStatus,
  Prisma,
  InvitationStatus,
  UserRole
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { createInvitationToken } from "../auth/invitation-token";
import { EmailService } from "../email/email.service";
import { slugify } from "../utils/slugify";
import { AuditLogService } from "./audit-log.service";

const GLOBAL_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.PRODUCTION
]);

const SCOPED_ROLES = new Set<UserRole>([
  UserRole.DOCTOR,
  UserRole.STAFF
]);

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma:PrismaService,
    private readonly audit:AuditLogService,
    private readonly email:EmailService
  ) {}

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy:{ createdAt:"desc" },
      include:{
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

  async createUser(
    actorId:string,
    input:{
      email:string;
      name?:string | null;
      role:UserRole;
      hospitalId?:string | null;
      isGlobal?:boolean;
      isActive?:boolean;
    }
  ) {
    return this.createInvitation(
      actorId,
      input
    );
  }

  async listInvitations() {
    await this.expireStaleInvitations();

    return this.prisma.invitation.findMany({
      orderBy:{ createdAt:"desc" },
      include:{
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

  async createInvitation(
    actorId:string,
    input:{
      email:string;
      role:UserRole;
      hospitalId?:string | null;
    }
  ) {
    const access = this.normalizeUserAccess({
      role:input.role,
      hospitalId:input.hospitalId
    });
    const token = createInvitationToken();
    const invitation = await this.prisma.invitation.create({
      data:{
        email:input.email,
        role:access.role,
        hospitalId:access.hospitalId,
        isGlobal:access.isGlobal,
        token:token.tokenHash,
        status:InvitationStatus.PENDING,
        expiresAt:getInvitationExpiry()
      }
    });
    const onboardingUrl = createOnboardingUrl(token.token);

    await this.email.sendInvitation({
      email:invitation.email,
      onboardingUrl
    });
    await this.audit.auditLog({
      userId:actorId,
      action:"invitation.created",
      resource:"Invitation",
      resourceId:invitation.id,
      hospitalId:invitation.hospitalId
    });

    return {
      ...invitation,
      onboardingUrl
    };
  }

  async revokeInvitation(
    actorId:string,
    id:string
  ) {
    const invitation = await this.prisma.invitation.update({
      where:{ id },
      data:{ status:InvitationStatus.REVOKED }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"invitation.revoked",
      resource:"Invitation",
      resourceId:invitation.id,
      hospitalId:invitation.hospitalId
    });

    return invitation;
  }

  async resendInvitation(
    actorId:string,
    id:string
  ) {
    const existing = await this.prisma.invitation.findUnique({
      where:{ id }
    });

    if (!existing) {
      throw new NotFoundException("Invitation not found");
    }

    if (existing.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException(
        "Accepted invitations cannot be resent"
      );
    }

    const token = createInvitationToken();
    const invitation = await this.prisma.invitation.update({
      where:{ id },
      data:{
        token:token.tokenHash,
        status:InvitationStatus.PENDING,
        expiresAt:getInvitationExpiry(),
        acceptedAt:null
      }
    });
    const onboardingUrl = createOnboardingUrl(token.token);

    await this.email.sendInvitation({
      email:invitation.email,
      onboardingUrl
    });
    await this.audit.auditLog({
      userId:actorId,
      action:"invitation.resent",
      resource:"Invitation",
      resourceId:invitation.id,
      hospitalId:invitation.hospitalId
    });

    return {
      ...invitation,
      onboardingUrl
    };
  }

  async updateUser(
    actorId:string,
    id:string,
    input:{
      email?:string;
      name?:string | null;
      role?:UserRole;
      hospitalId?:string | null;
      isGlobal?:boolean;
      isActive?:boolean;
    }
  ) {
    const existing = await this.prisma.user.findUnique({
      where:{ id }
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const role = input.role ?? existing.role;
    const access = this.normalizeUserAccess({
      role,
      hospitalId:
        input.hospitalId === undefined
          ? existing.hospitalId
          : input.hospitalId,
      isGlobal:input.isGlobal
    });

    const user = await this.prisma.user.update({
      where:{ id },
      data:{
        email:input.email,
        name:input.name,
        ...access,
        isActive:input.isActive
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:
        existing.role !== user.role
          ? "user.role_changed"
          : "user.updated",
      resource:"User",
      resourceId:user.id,
      hospitalId:user.hospitalId
    });

    return user;
  }

  async deleteUser(
    actorId:string,
    id:string
  ) {
    const user = await this.prisma.user.update({
      where:{ id },
      data:{ isActive:false }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"user.deactivated",
      resource:"User",
      resourceId:user.id,
      hospitalId:user.hospitalId
    });

    return user;
  }

  async listHospitals() {
    const hospitals = await this.prisma.hospitalWorkspace.findMany({
      orderBy:{ name:"asc" },
      include:{
        _count:{
          select:{
            integrationConfigs:true
          }
        }
      }
    });

    return hospitals.map(toHospitalDto);
  }

  async createHospital(
    actorId:string,
    input:{
      name:string;
      hospitalCode?:string | null;
      domain?:string | null;
      industryType?:string | null;
      contactEmail?:string | null;
      slug?:string;
      specialty?:string | null;
      city?:string | null;
      status?:"CREATING" | "ACTIVE" | "PAUSED";
    }
  ) {
    const hospital = await this.prisma.hospitalWorkspace.create({
      data:{
        name:input.name,
        hospitalName:input.name,
        slug:input.slug ?? slugify(input.name),
        hospitalCode:normalizeCode(input.hospitalCode, input.slug ?? input.name),
        domain:input.domain || null,
        industryType:input.industryType || null,
        contactEmail:input.contactEmail || null,
        specialty:input.specialty ?? null,
        city:input.city ?? null,
        status:input.status ?? "ACTIVE"
      },
      include:{
        _count:{
          select:{
            integrationConfigs:true
          }
        }
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"hospital.created",
      resource:"HospitalWorkspace",
      resourceId:hospital.id,
      hospitalId:hospital.id
    });

    return toHospitalDto(hospital);
  }

  async updateHospital(
    actorId:string,
    id:string,
    input:{
      name?:string;
      hospitalCode?:string | null;
      domain?:string | null;
      industryType?:string | null;
      contactEmail?:string | null;
      slug?:string;
      specialty?:string | null;
      city?:string | null;
      status?:"CREATING" | "ACTIVE" | "PAUSED";
      disabled?:boolean;
    }
  ) {
    const hospital = await this.prisma.hospitalWorkspace.update({
      where:{ id },
      data:{
        name:input.name,
        hospitalName:input.name,
        hospitalCode:input.hospitalCode === undefined
          ? undefined
          : normalizeCode(input.hospitalCode, input.slug ?? input.name ?? id),
        domain:input.domain,
        industryType:input.industryType,
        contactEmail:input.contactEmail,
        slug:input.slug,
        specialty:input.specialty,
        city:input.city,
        status:input.disabled
          ? "PAUSED"
          : input.status,
        disabledAt:input.disabled === undefined
          ? undefined
          : input.disabled
            ? new Date()
            : null
      },
      include:{
        _count:{
          select:{
            integrationConfigs:true
          }
        }
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"hospital.updated",
      resource:"HospitalWorkspace",
      resourceId:hospital.id,
      hospitalId:hospital.id
    });

    return toHospitalDto(hospital);
  }

  async deleteHospital(
    actorId:string,
    id:string
  ) {
    const hospital = await this.prisma.hospitalWorkspace.update({
      where:{ id },
      data:{
        status:"PAUSED",
        disabledAt:new Date()
      },
      include:{
        _count:{
          select:{
            integrationConfigs:true
          }
        }
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"hospital.disabled",
      resource:"HospitalWorkspace",
      resourceId:hospital.id,
      hospitalId:hospital.id
    });

    return toHospitalDto(hospital);
  }

  async listHospitalIntegrations(
    hospitalId:string
  ) {
    const integrations = await this.prisma.hospitalIntegrationConfig.findMany({
      where:{ hospitalId },
      orderBy:{ updatedAt:"desc" }
    });

    return integrations.map(toPublicIntegration);
  }

  async createHospitalIntegration(
    actorId:string,
    hospitalId:string,
    input:{
      provider:string;
      apiName:string;
      baseUrl?:string | null;
      credentials?:Record<string, string | undefined>;
      settings?:Record<string, unknown>;
    }
  ) {
    const integration = await this.prisma.hospitalIntegrationConfig.create({
      data:{
        hospitalId,
        provider:input.provider,
        apiName:input.apiName,
        baseUrl:input.baseUrl || null,
        encryptedCredentials:JSON.stringify(cleanCredentials(input.credentials)),
        credentialMeta:createCredentialMeta(input.credentials),
        settings:(input.settings ?? {}) as Prisma.InputJsonValue,
        status:IntegrationConfigStatus.PENDING,
        createdBy:actorId,
        updatedBy:actorId
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"integration.created",
      resource:"HospitalIntegrationConfig",
      resourceId:integration.id,
      hospitalId
    });

    return toPublicIntegration(integration);
  }

  async updateHospitalIntegration(
    actorId:string,
    hospitalId:string,
    integrationId:string,
    input:{
      provider?:string;
      apiName?:string;
      baseUrl?:string | null;
      credentials?:Record<string, string | undefined>;
      settings?:Record<string, unknown>;
    }
  ) {
    const existing = await this.prisma.hospitalIntegrationConfig.findFirst({
      where:{
        id:integrationId,
        hospitalId
      }
    });

    if (!existing) {
      throw new NotFoundException("Integration not found");
    }

    const credentials = {
      ...parseCredentials(existing.encryptedCredentials),
      ...cleanCredentials(input.credentials)
    };
    const integration = await this.prisma.hospitalIntegrationConfig.update({
      where:{ id:integrationId },
      data:{
        provider:input.provider,
        apiName:input.apiName,
        baseUrl:input.baseUrl,
        encryptedCredentials:JSON.stringify(credentials),
        credentialMeta:createCredentialMeta(credentials),
        settings:input.settings as Prisma.InputJsonValue | undefined,
        updatedBy:actorId
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"integration.updated",
      resource:"HospitalIntegrationConfig",
      resourceId:integration.id,
      hospitalId
    });

    return toPublicIntegration(integration);
  }

  async testHospitalIntegration(
    actorId:string,
    hospitalId:string,
    integrationId:string
  ) {
    const existing = await this.prisma.hospitalIntegrationConfig.findFirst({
      where:{
        id:integrationId,
        hospitalId
      }
    });

    if (!existing) {
      throw new NotFoundException("Integration not found");
    }

    const credentials = parseCredentials(existing.encryptedCredentials);
    const ok = Boolean(
      existing.baseUrl ||
      Object.values(credentials).some((value) => value.trim())
    );
    const integration = await this.prisma.hospitalIntegrationConfig.update({
      where:{ id:integrationId },
      data:{
        status:ok
          ? IntegrationConfigStatus.CONNECTED
          : IntegrationConfigStatus.NEEDS_ATTENTION,
        lastTestedAt:new Date(),
        lastValidatedAt:ok ? new Date() : null,
        lastError:ok ? null : "Add a base URL or credential before testing.",
        updatedBy:actorId
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"integration.tested",
      resource:"HospitalIntegrationConfig",
      resourceId:integration.id,
      hospitalId
    });

    return {
      ok,
      message:ok
        ? "Integration configuration is test-ready."
        : "Integration needs a base URL or credential.",
      integration:toPublicIntegration(integration)
    };
  }

  async deleteHospitalIntegration(
    actorId:string,
    hospitalId:string,
    integrationId:string
  ) {
    const existing = await this.prisma.hospitalIntegrationConfig.findFirst({
      where:{
        id:integrationId,
        hospitalId
      }
    });

    if (!existing) {
      throw new NotFoundException("Integration not found");
    }

    const integration = await this.prisma.hospitalIntegrationConfig.delete({
      where:{ id:integrationId }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"integration.deleted",
      resource:"HospitalIntegrationConfig",
      resourceId:integration.id,
      hospitalId
    });

    return toPublicIntegration(integration);
  }

  async getBrandVoice(
    hospitalId:string
  ) {
    return this.prisma.brandVoice.upsert({
      where:{ hospitalId },
      create:{ hospitalId },
      update:{}
    });
  }

  async updateBrandVoice(
    actorId:string,
    hospitalId:string,
    input:{
      tone?:string;
      style?:string;
      audience?:string;
      messaging?:string;
    }
  ) {
    const brandVoice = await this.prisma.brandVoice.upsert({
      where:{ hospitalId },
      create:{
        hospitalId,
        tone:input.tone ?? "",
        style:input.style ?? "",
        audience:input.audience ?? "",
        messaging:input.messaging ?? ""
      },
      update:input
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"brand_voice.updated",
      resource:"BrandVoice",
      resourceId:brandVoice.id,
      hospitalId
    });

    return brandVoice;
  }

  async listTemplates(
    hospitalId:string
  ) {
    return this.prisma.template.findMany({
      where:{ hospitalId },
      orderBy:{ updatedAt:"desc" }
    });
  }

  async createTemplate(
    actorId:string,
    hospitalId:string,
    input:{
      title:string;
      category:string;
      content:string;
      isActive?:boolean;
    }
  ) {
    const template = await this.prisma.template.create({
      data:{
        hospitalId,
        title:input.title,
        category:input.category,
        content:input.content,
        isActive:input.isActive ?? true
      }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"template.created",
      resource:"Template",
      resourceId:template.id,
      hospitalId
    });

    return template;
  }

  async updateTemplate(
    actorId:string,
    id:string,
    input:{
      title?:string;
      category?:string;
      content?:string;
      isActive?:boolean;
    }
  ) {
    const template = await this.prisma.template.update({
      where:{ id },
      data:input
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"template.updated",
      resource:"Template",
      resourceId:template.id,
      hospitalId:template.hospitalId
    });

    return template;
  }

  async deleteTemplate(
    actorId:string,
    id:string
  ) {
    const template = await this.prisma.template.update({
      where:{ id },
      data:{ isActive:false }
    });

    await this.audit.auditLog({
      userId:actorId,
      action:"template.deactivated",
      resource:"Template",
      resourceId:template.id,
      hospitalId:template.hospitalId
    });

    return template;
  }

  getIntegrations() {
    return [
      { name:"Google Business", status:"planned" },
      { name:"Meta", status:"planned" },
      { name:"Instagram", status:"planned" },
      { name:"YouTube", status:"planned" },
      { name:"OpenAI", status:"planned" }
    ];
  }

  private normalizeUserAccess(
    input:{
      role:UserRole;
      hospitalId?:string | null;
      isGlobal?:boolean;
    }
  ) {
    if (GLOBAL_ROLES.has(input.role)) {
      return {
        role:input.role,
        hospitalId:null,
        isGlobal:true
      };
    }

    if (SCOPED_ROLES.has(input.role) && !input.hospitalId) {
      throw new BadRequestException(
        "Doctor and staff users require a hospitalId"
      );
    }

    return {
      role:input.role,
      hospitalId:input.hospitalId ?? null,
      isGlobal:false
    };
  }

  private async expireStaleInvitations() {
    await this.prisma.invitation.updateMany({
      where:{
        status:InvitationStatus.PENDING,
        expiresAt:{ lt:new Date() }
      },
      data:{ status:InvitationStatus.EXPIRED }
    });
  }
}

function toHospitalDto(
  hospital:{
    id:string;
    name:string;
    hospitalName:string;
    slug:string;
    hospitalCode:string | null;
    domain:string | null;
    industryType:string | null;
    contactEmail:string | null;
    specialty:string | null;
    city:string | null;
    status:string;
    lastSyncAt:Date | null;
    disabledAt:Date | null;
    createdAt:Date;
    updatedAt:Date;
    _count?:{ integrationConfigs:number };
  }
) {
  return {
    id:hospital.id,
    name:hospital.name,
    hospitalName:hospital.hospitalName,
    slug:hospital.slug,
    hospitalCode:hospital.hospitalCode,
    domain:hospital.domain,
    industryType:hospital.industryType,
    contactEmail:hospital.contactEmail,
    specialty:hospital.specialty,
    city:hospital.city,
    status:hospital.disabledAt ? "PAUSED" : hospital.status,
    connectedApisCount:hospital._count?.integrationConfigs ?? 0,
    lastSyncAt:hospital.lastSyncAt?.toISOString() ?? null,
    disabledAt:hospital.disabledAt?.toISOString() ?? null,
    createdAt:hospital.createdAt.toISOString(),
    updatedAt:hospital.updatedAt.toISOString()
  };
}

function toPublicIntegration(
  integration:{
    id:string;
    hospitalId:string;
    provider:string;
    apiName:string;
    baseUrl:string | null;
    encryptedCredentials:string;
    credentialMeta:unknown;
    settings:unknown;
    status:IntegrationConfigStatus;
    lastValidatedAt:Date | null;
    lastTestedAt:Date | null;
    lastSyncAt:Date | null;
    lastError:string | null;
    createdAt:Date;
    updatedAt:Date;
  }
) {
  return {
    id:integration.id,
    hospitalId:integration.hospitalId,
    provider:integration.provider,
    apiName:integration.apiName,
    baseUrl:integration.baseUrl,
    credentials:maskCredentials(parseCredentials(integration.encryptedCredentials)),
    settings:integration.settings,
    status:integration.status,
    lastValidatedAt:integration.lastValidatedAt?.toISOString() ?? null,
    lastTestedAt:integration.lastTestedAt?.toISOString() ?? null,
    lastSyncAt:integration.lastSyncAt?.toISOString() ?? null,
    lastError:integration.lastError,
    createdAt:integration.createdAt.toISOString(),
    updatedAt:integration.updatedAt.toISOString()
  };
}

function normalizeCode(
  value:string | null | undefined,
  fallback:string
) {
  const code = (value || fallback)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return code || null;
}

function cleanCredentials(
  credentials:Record<string, string | undefined> | undefined
) {
  return Object.fromEntries(
    Object.entries(credentials ?? {})
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [key, value?.trim() ?? ""])
  );
}

function createCredentialMeta(
  credentials:Record<string, string | undefined> | undefined
) {
  return Object.fromEntries(
    Object.keys(cleanCredentials(credentials)).map((key) => [
      key,
      { configured:true }
    ])
  );
}

function parseCredentials(
  value:string
) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, credential]) => typeof credential === "string")
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

function maskCredentials(
  credentials:Record<string, string>
) {
  return Object.fromEntries(
    Object.keys(credentials).map((key) => [key, "********"])
  );
}

function getInvitationExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return expiresAt;
}

function createOnboardingUrl(
  token:string
) {
  const baseUrl =
    process.env.WEB_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return `${baseUrl}/auth/accept-invite?token=${encodeURIComponent(token)}`;
}
