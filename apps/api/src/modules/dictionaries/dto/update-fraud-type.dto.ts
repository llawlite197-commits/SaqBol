import { PartialType } from "@nestjs/swagger";
import { CreateFraudTypeDto } from "./create-fraud-type.dto";

export class UpdateFraudTypeDto extends PartialType(CreateFraudTypeDto) {}
