import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { z } from "zod";

const workspaceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);

@Injectable()
export class WorkspaceIdPipe implements PipeTransform<unknown, string> {
  transform(value: unknown) {
    const result = workspaceIdSchema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException("A valid workspaceId is required.");
    }

    return result.data;
  }
}
