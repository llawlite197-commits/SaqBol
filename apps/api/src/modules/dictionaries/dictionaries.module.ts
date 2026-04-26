import { Module } from "@nestjs/common";
import { AdminDictionariesController } from "./admin-dictionaries.controller";
import { DictionariesController } from "./dictionaries.controller";
import { DictionariesService } from "./dictionaries.service";

@Module({
  controllers: [DictionariesController, AdminDictionariesController],
  providers: [DictionariesService]
})
export class DictionariesModule {}
