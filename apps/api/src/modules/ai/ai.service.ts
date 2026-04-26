import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditAction, UserRoleCode } from "@saqbol/db";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { AiSafetyService } from "./ai-safety.service";
import type { AiResponseDto } from "./dto/ai-response.dto";
import type { AiChatDto } from "./dto/ai-chat.dto";
import type { AnalyzeSmsDto } from "./dto/analyze-sms.dto";
import type { AnalyzeUrlDto } from "./dto/analyze-url.dto";
import type { SummarizeComplaintDto } from "./dto/summarize-complaint.dto";
import { promptTemplates } from "./prompts/ai-prompts";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { OpenAiProvider } from "./providers/openai-ai.provider";

type AiScenario = "chat" | "analyze-sms" | "analyze-url" | "summarize-complaint";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly safety: AiSafetyService,
    private readonly mockProvider: MockAiProvider,
    private readonly openAiProvider: OpenAiProvider
  ) {}

  async chat(dto: AiChatDto, user?: AuthenticatedUser): Promise<AiResponseDto> {
    const safetyResult = this.safety.inspect(dto.message, 1200);
    const response = this.buildRuleBasedChatResponse(dto.message, safetyResult.allowed);
    await this.logAiRequest(user, "chat", safetyResult, response, response.source);
    return response;
  }

  analyzeSms(dto: AnalyzeSmsDto, user?: AuthenticatedUser): Promise<AiResponseDto> {
    return this.runAiScenario("analyze-sms", dto.smsText, promptTemplates.analyzeSms(dto.smsText), user);
  }

  analyzeUrl(dto: AnalyzeUrlDto, user?: AuthenticatedUser): Promise<AiResponseDto> {
    return this.runAiScenario("analyze-url", dto.url, promptTemplates.analyzeUrl(dto.url), user);
  }

  async summarizeComplaint(dto: SummarizeComplaintDto, user: AuthenticatedUser): Promise<AiResponseDto> {
    const staffRoles: UserRoleCode[] = [UserRoleCode.OPERATOR, UserRoleCode.SUPERVISOR, UserRoleCode.ADMIN];
    if (!user.roles.some((role) => staffRoles.includes(role))) {
      throw new ForbiddenException("Workspace AI summary is available only for staff.");
    }

    const complaint = await this.prisma.complaint.findUnique({
      where: { id: dto.complaintId },
      include: {
        fraudType: true,
        region: true,
        contacts: true,
        statusHistory: { orderBy: { createdAt: "desc" }, take: 8 },
        comments: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 8 }
      }
    });

    if (!complaint) throw new NotFoundException("Complaint not found.");

    const complaintText = [
      `Номер: ${complaint.complaintNumber}`,
      `Статус: ${complaint.currentStatus}`,
      `Регион: ${complaint.region?.nameRu ?? "не указан"}`,
      `Тип: ${complaint.fraudType?.nameRu ?? "не указан"}`,
      `Описание: ${complaint.description}`,
      `Контакты: ${complaint.contacts.map((contact) => `${contact.contactType}: ${contact.rawValue}`).join("; ") || "нет"}`,
      `Комментарии: ${complaint.comments.map((comment) => comment.commentText).join("; ") || "нет"}`
    ].join("\n");

    return this.runAiScenario(
      "summarize-complaint",
      complaintText,
      promptTemplates.summarizeComplaint(complaintText, dto.operatorInstruction),
      user,
      dto.complaintId
    );
  }

  private async runAiScenario(
    scenario: AiScenario,
    rawInput: string,
    prompt: string,
    user?: AuthenticatedUser,
    entityId?: string
  ): Promise<AiResponseDto> {
    const safetyResult = this.safety.inspect(rawInput);

    if (!safetyResult.allowed) {
      const refusal = this.safety.buildRefusal(safetyResult.refusalReason ?? "Запрос запрещен правилами безопасности.");
      await this.logAiRequest(user, scenario, safetyResult, refusal, "safety");
      return refusal;
    }

    const provider = this.config.get<string>("OPENAI_API_KEY") ? this.openAiProvider : this.mockProvider;
    const safePrompt = this.safety.redactSensitiveData(prompt);
    const riskHint = this.safety.detectRisk(rawInput);

    try {
      const generated = await provider.generate({ scenario, prompt: safePrompt, riskHint });
      const response: AiResponseDto = {
        ...generated,
        riskLevel: generated.riskLevel ?? riskHint,
        isMock: provider.isMock,
        confidence: provider.isMock ? "LOW" : "MEDIUM",
        source: provider.isMock ? "MOCK" : "RULE_BASED",
        cannotAnswer: false,
        safetyNotice:
          generated.safetyNotice ||
          "AI не принимает решений вместо сотрудника и не дает юридически значимых заключений."
      };
      await this.logAiRequest(user, scenario, safetyResult, response, provider.name, entityId);
      return response;
    } catch (error) {
      this.logger.warn(`AI provider failed, falling back to mock: ${String(error)}`);
      const generated = await this.mockProvider.generate({ scenario, prompt: safePrompt, riskHint });
      const response: AiResponseDto = {
        ...generated,
        isMock: true,
        confidence: "LOW",
        source: "MOCK",
        cannotAnswer: false,
        safetyNotice:
          generated.safetyNotice ||
          "AI не принимает решений вместо сотрудника и не дает юридически значимых заключений."
      };
      await this.logAiRequest(user, scenario, safetyResult, response, "mock-fallback", entityId);
      return response;
    }
  }

  private async logAiRequest(
    user: AuthenticatedUser | undefined,
    scenario: AiScenario,
    safetyResult: { inputHash: string; flags: string[]; sanitizedInput: string },
    response: AiResponseDto,
    providerName: string,
    entityId?: string
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: user?.userId ?? null,
          actionType: AuditAction.AI_REQUESTED,
          entityType: "ai",
          entityId: entityId ?? null,
          requestPath: scenario,
          metadata: {
            scenario,
            provider: providerName,
            isMock: response.isMock,
            inputHash: safetyResult.inputHash,
            inputLength: safetyResult.sanitizedInput.length,
            safetyFlags: safetyResult.flags,
            riskLevel: response.riskLevel,
            suggestedFraudType: response.suggestedFraudType ?? null
          }
        }
      });
    } catch (error) {
      this.logger.warn(`Failed to write AI audit log: ${String(error)}`);
    }
  }

  private buildRuleBasedChatResponse(rawMessage: string, safetyAllowed: boolean): AiResponseDto {
    const message = rawMessage.toLowerCase();
    const language = this.detectLanguage(rawMessage);
    const riskLevel = this.safety.detectRisk(rawMessage);

    const legalSignals = [
      "юрист",
      "юридичес",
      "иск",
      "суд",
      "адвокат",
      "заңгер",
      "сот",
      "талап арыз"
    ];
    const accusationSignals = [
      "обвини",
      "виновен",
      "мошенник ли он",
      "преступник",
      "кінәлі",
      "қылмыскер",
      "алаяқ деп айт"
    ];
    const databaseSignals = [
      "сколько жалоб",
      "есть ли в базе",
      "покажи базу",
      "дерекқор",
      "базада бар ма",
      "қанша шағым"
    ];

    if (!safetyAllowed || legalSignals.some((signal) => message.includes(signal))) {
      return this.buildChatAnswer(
        language === "kz"
          ? "Мен заңгерлік кеңес бермеймін. Ресми кеңес алу үшін уәкілетті органға немесе заңгерге жүгініңіз."
          : "Я не даю юридические консультации. За официальной консультацией обратитесь в уполномоченный орган или к юристу.",
        "LOW",
        "LOW",
        true
      );
    }

    if (accusationSignals.some((signal) => message.includes(signal))) {
      return this.buildChatAnswer(
        language === "kz"
          ? "Мен нақты тұлғаны кінәлі деп айта алмаймын. Күдікті деректерді тексеріп, қажет болса шағым қалдырыңыз."
          : "Я не могу назвать конкретное лицо виновным. Проверьте подозрительные данные и при необходимости оставьте жалобу.",
        "LOW",
        "LOW",
        true
      );
    }

    if (databaseSignals.some((signal) => message.includes(signal))) {
      return this.buildChatAnswer(
        language === "kz"
          ? "Бұл сұраққа жауап беру үшін базада жеткілікті деректер жоқ."
          : "Для ответа на этот вопрос в базе недостаточно данных.",
        "LOW",
        "LOW",
        true
      );
    }

    const topic = this.detectChatTopic(message);
    if (!topic) {
      return this.buildChatAnswer(
        language === "kz"
          ? "Кешіріңіз, бұл сұрақ бойынша менде жеткілікті дерек жоқ. SaqBol.kz тек интернет және қаржылық алаяқтық бойынша көмек береді."
          : "Извините, по этому вопросу у меня недостаточно данных. SaqBol.kz помогает только по интернет- и финансовому мошенничеству.",
        "LOW",
        "LOW",
        true
      );
    }

    const answer = this.topicAnswer(topic, language);
    return this.buildChatAnswer(answer, riskLevel, "MEDIUM", false);
  }

  private detectChatTopic(message: string) {
    const topics = [
      { key: "phone", signals: ["телефон", "звон", "номер", "қоңырау", "нөмір"] },
      { key: "phishing", signals: ["фишинг", "ссылка", "сілтеме", "http", "сайт", "пароль"] },
      { key: "card", signals: ["карта", "cvv", "cvc", "sms", "смс", "код", "банк"] },
      { key: "shop", signals: ["магазин", "интернет-магазин", "предоплата", "алдын ала", "маркетплейс", "доставка"] },
      { key: "invest", signals: ["инвест", "крипто", "доход", "табыс", "crypto", "биржа"] },
      { key: "complaint", signals: ["жалоба", "шағым", "заявление", "өтініш", "қалай берем"] },
      { key: "check", signals: ["провер", "тексер", "күдікті", "подозр", "номерді", "ссылканы"] },
      { key: "files", signals: ["файл", "документ", "скрин", "чек", "тіркеу", "приложить"] },
      { key: "portal", signals: ["портал", "saqbol", "как работает", "қалай жұмыс"] }
    ] as const;

    return topics.find((topic) => topic.signals.some((signal) => message.includes(signal)))?.key ?? null;
  }

  private topicAnswer(topic: string, language: "ru" | "kz") {
    const answers = {
      ru: {
        phone: "Если вам звонят от имени банка, полиции или службы безопасности и просят код из SMS, CVV или перевод на «безопасный счет», прекратите разговор. Перезвоните в банк только по официальному номеру.",
        phishing: "Не переходите по подозрительным ссылкам из SMS и мессенджеров. Проверьте домен сайта вручную, не вводите пароль, SMS-код и данные карты на неизвестной странице.",
        card: "Никому не сообщайте CVV/CVC, SMS-коды, PIN и пароли. Если данные уже переданы, срочно заблокируйте карту и обратитесь в банк.",
        shop: "При покупке онлайн избегайте полной предоплаты на личную карту. Проверьте продавца, отзывы, домен сайта и сохраняйте переписку, чек и реквизиты.",
        invest: "Осторожно относитесь к обещаниям гарантированной прибыли, криптоинвестициям и просьбам оплатить комиссию за вывод средств. Проверьте лицензию компании и не устанавливайте удаленный доступ.",
        complaint: "Чтобы подать жалобу, откройте раздел «Подать жалобу», опишите ситуацию, укажите дату, регион, тип мошенничества и приложите доказательства: скриншоты, чеки, ссылки, номера.",
        check: "Для проверки откройте раздел «Проверить» и введите подозрительный телефон, ссылку, email, карту или IBAN. Сервис покажет уровень риска без раскрытия персональных данных.",
        files: "К жалобе лучше приложить скриншоты переписки, SMS, ссылку, номер телефона, чек оплаты, данные карты/IBAN получателя и другие подтверждения. Не передавайте CVV и SMS-коды.",
        portal: "SaqBol.kz помогает гражданам фиксировать жалобы, проверять подозрительные данные, читать предупреждения и получать базовые рекомендации по интернет- и финансовому мошенничеству."
      },
      kz: {
        phone: "Егер банк, полиция немесе қауіпсіздік қызметі атынан қоңырау шалып, SMS код, CVV немесе «қауіпсіз шотқа» ақша аударуды сұраса, әңгімені тоқтатыңыз. Банкке тек ресми нөмір арқылы хабарласыңыз.",
        phishing: "SMS немесе мессенджерден келген күдікті сілтемелерге өтпеңіз. Сайт доменін қолмен тексеріңіз, белгісіз бетке құпиясөз, SMS код немесе карта деректерін енгізбеңіз.",
        card: "CVV/CVC, SMS код, PIN және құпиясөзді ешкімге айтпаңыз. Егер деректерді беріп қойсаңыз, картаны дереу бұғаттап, банкке хабарласыңыз.",
        shop: "Онлайн сатып алғанда жеке картаға толық алдын ала төлем жасамаңыз. Сатушыны, пікірлерді, сайт доменін тексеріп, хат алмасу, чек және реквизиттерді сақтаңыз.",
        invest: "Кепілді табыс, криптоинвестиция және ақшаны шығару үшін комиссия төлеу туралы ұсыныстарға сақ болыңыз. Компания лицензиясын тексеріңіз және қашықтан қолжетімділік орнатпаңыз.",
        complaint: "Шағым беру үшін «Шағым беру» бөлімін ашып, жағдайды сипаттаңыз, күнін, өңірін, алаяқтық түрін көрсетіңіз және дәлелдерді тіркеңіз: скриншот, чек, сілтеме, нөмір.",
        check: "Тексеру үшін «Тексеру» бөлімін ашып, күдікті телефон, сілтеме, email, карта немесе IBAN енгізіңіз. Сервис жеке деректерді ашпай тәуекел деңгейін көрсетеді.",
        files: "Шағымға хат алмасу скриншоттарын, SMS, сілтеме, телефон нөмірі, төлем чегі, алушы картасы/IBAN және басқа дәлелдерді тіркеген дұрыс. CVV және SMS кодтарды бермеңіз.",
        portal: "SaqBol.kz азаматтарға шағым тіркеуге, күдікті деректерді тексеруге, ескертулерді оқуға және интернет/қаржылық алаяқтық бойынша базалық кеңес алуға көмектеседі."
      }
    } as const;

    return answers[language][topic as keyof typeof answers.ru];
  }

  private buildChatAnswer(
    answer: string,
    riskLevel: "LOW" | "MEDIUM" | "HIGH",
    confidence: "LOW" | "MEDIUM",
    cannotAnswer: boolean
  ): AiResponseDto {
    return {
      answer,
      confidence,
      source: "RULE_BASED",
      cannotAnswer,
      riskLevel,
      redFlags: [],
      recommendedActions: [],
      suggestedFraudType: null,
      safetyNotice: "AI тек ақпараттық көмек береді және заңды шешім қабылдамайды.",
      isMock: true,
      refusalReason: cannotAnswer ? answer : null
    };
  }

  private detectLanguage(value: string): "ru" | "kz" {
    return /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]|\b(маған|күдікті|келді|қалай|шағым|тексер|керек|алдын|нөмір)\b/i.test(value)
      ? "kz"
      : "ru";
  }
}
