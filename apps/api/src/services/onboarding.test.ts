import { describe, expect, it } from "vitest";
import type { OnboardingNextStep } from "./onboarding.js";

function nextStepFromFlags(flags: {
  hasProject: boolean;
  hasRepository: boolean;
  hasPublishedSchema: boolean;
  hasEnvironment: boolean;
  hasExecution: boolean;
}): OnboardingNextStep {
  if (!flags.hasProject) return "CREATE_PROJECT";
  if (!flags.hasRepository) return "CONNECT_REPO";
  if (!flags.hasPublishedSchema) return "PUBLISH_SCHEMA";
  if (!flags.hasEnvironment) return "ADD_ENVIRONMENT";
  if (!flags.hasExecution) return "RUN_QUERY";
  return "DONE";
}

describe("onboarding nextStep", () => {
  it("starts at create project", () => {
    expect(
      nextStepFromFlags({
        hasProject: false,
        hasRepository: false,
        hasPublishedSchema: false,
        hasEnvironment: false,
        hasExecution: false,
      }),
    ).toBe("CREATE_PROJECT");
  });

  it("reaches done when all flags set", () => {
    expect(
      nextStepFromFlags({
        hasProject: true,
        hasRepository: true,
        hasPublishedSchema: true,
        hasEnvironment: true,
        hasExecution: true,
      }),
    ).toBe("DONE");
  });

  it("asks for environment after schema", () => {
    expect(
      nextStepFromFlags({
        hasProject: true,
        hasRepository: true,
        hasPublishedSchema: true,
        hasEnvironment: false,
        hasExecution: false,
      }),
    ).toBe("ADD_ENVIRONMENT");
  });
});
