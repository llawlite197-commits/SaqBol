import { ApiProperty } from "@nestjs/swagger";

export class UploadComplaintFileDto {
  @ApiProperty({
    type: "string",
    format: "binary"
  })
  file!: unknown;
}
