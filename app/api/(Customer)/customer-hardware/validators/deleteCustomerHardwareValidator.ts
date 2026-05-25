import { z } from "zod";

export const deleteHardwareSchema = z.object({
  Hardware_Code: z.string().min(1, "Hardware_Code is required"),
});

export type DeleteHardwareInput = z.infer<typeof deleteHardwareSchema>;
