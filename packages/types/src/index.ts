export type AppEnvironment = "local" | "staging" | "production";

export type ServiceHealth = {
  status: "ok";
  service: string;
};
