import { Injectable } from "@nestjs/common";

export type InvitationEmailInput = {
  email:string;
  onboardingUrl:string;
};

export type PasswordResetEmailInput = {
  email:string;
  resetUrl:string;
};

@Injectable()
export class EmailService {
  async sendInvitation(
    input:InvitationEmailInput
  ) {
    return {
      provider:"mock",
      type:"invitation",
      delivered:false,
      email:input.email,
      onboardingUrl:input.onboardingUrl
    };
  }

  async sendPasswordReset(
    input:PasswordResetEmailInput
  ) {
    return {
      provider:"mock",
      type:"password_reset",
      delivered:false,
      email:input.email,
      resetUrl:input.resetUrl
    };
  }
}

