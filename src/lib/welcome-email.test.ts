import { describe, expect, it } from "vitest";
import { welcomeMessage } from "./welcome-email";

describe("Italian purchase emails", () => {
  it("shows only products the buyer purchased", () => {
    const mail = welcomeMessage(["fodere"], "https://borsamia.netlify.app");
    expect(mail.text).toContain("Manuale di Fodere");
    expect(mail.text).not.toContain("101 Modelli di Borse");
    expect(mail.text).not.toContain("37 Modelli di Portachiavi");
    expect(mail.text).toContain("https://borsamia.netlify.app/accedi");
  });
  it("includes multiple independently purchased products including order bumps", () => {
    const mail = welcomeMessage(["borse", "fodere", "portachiavi-37"], "https://borsamia.netlify.app");
    expect(mail.text).toContain("101 Modelli di Borse");
    expect(mail.text).toContain("Manuale di Fodere");
    expect(mail.text).toContain("37 Modelli di Portachiavi");
    expect(mail.text).not.toContain("Club delle Tendenze");
  });
  it("refuses empty entitlements and insecure links", () => {
    expect(() => welcomeMessage([], "https://borsamia.netlify.app")).toThrow();
    expect(() => welcomeMessage(["borse"], "http://borsamia.netlify.app")).toThrow();
  });
});
