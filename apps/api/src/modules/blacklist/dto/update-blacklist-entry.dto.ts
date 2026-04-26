import { PartialType } from "@nestjs/swagger";
import { CreateBlacklistEntryDto } from "./create-blacklist-entry.dto";

export class UpdateBlacklistEntryDto extends PartialType(CreateBlacklistEntryDto) {}
