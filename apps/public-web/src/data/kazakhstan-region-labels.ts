export type KazakhstanRegionLabel = {
  code: string;
  label: string;
  x: number;
  y: number;
  kind: "region" | "city";
};

export const kazakhstanRegionLabels: KazakhstanRegionLabel[] = [
  { code: "NORTH_KAZAKHSTAN", label: "СҚО", x: 590, y: 75, kind: "region" },
  { code: "AKMOLA", label: "Ақмола", x: 565, y: 190, kind: "region" },
  { code: "KOSTANAY", label: "Қостанай", x: 410, y: 170, kind: "region" },
  { code: "PAVLODAR", label: "Павлодар", x: 720, y: 178, kind: "region" },
  { code: "AKTOBE", label: "Ақтөбе", x: 285, y: 270, kind: "region" },
  { code: "WEST_KAZAKHSTAN", label: "БҚО", x: 105, y: 255, kind: "region" },
  { code: "ATYRAU", label: "Атырау", x: 155, y: 380, kind: "region" },
  { code: "MANGYSTAU", label: "Маңғыстау", x: 180, y: 505, kind: "region" },
  { code: "KYZYLORDA", label: "Қызылорда", x: 405, y: 455, kind: "region" },
  { code: "ULYTAU", label: "Ұлытау", x: 435, y: 340, kind: "region" },
  { code: "TURKISTAN", label: "Түркістан", x: 525, y: 515, kind: "region" },
  { code: "ALMATY_REGION", label: "Алматы обл.", x: 700, y: 485, kind: "region" },
  { code: "KARAGANDA", label: "Қарағанды", x: 550, y: 320, kind: "region" },
  { code: "ZHAMBYL", label: "Жамбыл", x: 625, y: 535, kind: "region" },
  { code: "ZHETISU", label: "Жетісу", x: 790, y: 425, kind: "region" },
  { code: "EAST_KAZAKHSTAN", label: "ШҚО", x: 915, y: 345, kind: "region" },
  { code: "ABAI", label: "Абай", x: 785, y: 315, kind: "region" },
  { code: "ASTANA", label: "Астана", x: 572, y: 225, kind: "city" },
  { code: "ALMATY_CITY", label: "Алматы", x: 742, y: 538, kind: "city" },
  { code: "SHYMKENT", label: "Шымкент", x: 548, y: 552, kind: "city" }
];
