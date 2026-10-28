import { defineAstroPaperConfig } from "./src/types/config.ts";

export default defineAstroPaperConfig({
  site: {
    url: "https://vishaltomar.com",
    title: "Vishal Tomar",
    description:
      "Vishal Tomar is a Toronto-based technical product leader building SaaS in regulated environments—focusing heavily on compliance, security, risk mitigation, and auditability.",
    author: "Vishal Tomar",
    profile: "https://vishaltomar.com",
    lang: "en-CA",
    timezone: "America/Toronto",
    dir: "ltr",
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
  },
  socials: [
    {
      name: "linkedin",
      url: "https://www.linkedin.com/in/vitomar/",
      linkTitle: "Vishal Tomar on LinkedIn",
    },
    {
      name: "mail",
      url: "mailto:hi@vishaltomar.com",
      linkTitle: "Send an email to Vishal Tomar",
    },
    {
      name: "github",
      url: "https://github.com/vitogeek",
      linkTitle: "Vishal Tomar on GitHub",
    },
  ],
});
