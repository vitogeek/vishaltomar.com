import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://vishaltomar.com",
    title: "Vishal Tomar",
    description: "[PLACEHOLDER: site description]",
    author: "Vishal Tomar",
    profile: "https://vishaltomar.com",
    lang: "en-CA",
    timezone: "America/Toronto",
    dir: "ltr",
  },
  caseStudies: {
    perIndex: 4,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/vitogeek",
      linkTitle: "Vishal Tomar on GitHub",
    },
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
  ],
});
