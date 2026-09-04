import type { Resume, Customization } from "../types/resume";
import { emptyResume } from "../types/resume";
import { personAvatarDataUrl } from "../lib/personAvatar";

/** Professional person icon used in marketplace previews. */
const DEMO_PHOTO_URL = personAvatarDataUrl();

export const DEMO_RESUME: Resume = {
  ...emptyResume,
  title: "Demo resume",
  personal: {
    ...emptyResume.personal,
    fullName: "Song Kimvisal",
    jobTitle: "Marketing Executive",
    email: "sokha.chan@email.com",
    phone: "+855 12 345 678",
    location: "Phnom Penh, Cambodia",
    photoUrl: DEMO_PHOTO_URL,
    linkedin: [{ id: "demo-li", title: "LinkedIn", url: "linkedin.com/in/sokhachan" }],
    summary:
      "<p>Marketing executive with 4+ years in banking and telecom. Plans multi-channel campaigns, manages budgets, and reports results to leadership. Comfortable working in English and Khmer with cross-functional teams.</p>",
  },
  experience: [
    {
      id: "demo-exp-1",
      jobTitle: "Marketing Executive",
      company: "ABA Bank",
      location: "Phnom Penh",
      startDate: "2022-01",
      endDate: "",
      current: true,
      description:
        "<ul><li>Led 12 digital campaigns that increased qualified leads by 35% year on year</li><li>Managed an $8,000 monthly budget across social, search, and email channels</li><li>Prepared monthly performance reports for the marketing director and branch heads</li></ul>",
    },
    {
      id: "demo-exp-2",
      jobTitle: "Marketing Coordinator",
      company: "Smart Axiata",
      location: "Phnom Penh",
      startDate: "2020-06",
      endDate: "2021-12",
      current: false,
      description:
        "<ul><li>Coordinated launch events for 3 new mobile plans across 8 retail locations</li><li>Wrote product copy and briefing notes for the social media and retail teams</li></ul>",
    },
  ],
  education: [
    {
      id: "demo-edu-1",
      school: "Royal University of Phnom Penh",
      degree: "Bachelor of Business Administration",
      field: "Marketing",
      startDate: "2016-11",
      endDate: "2020-07",
      current: false,
      gpa: "3.7",
      description:
        "<p>Coursework in consumer behaviour, statistics, and brand management. Marketing club vice president (2019).</p>",
    },
  ],
  skills: [
    { id: "demo-skill-1", name: "Campaign strategy", level: 5 },
    { id: "demo-skill-2", name: "Digital advertising", level: 4 },
    { id: "demo-skill-3", name: "Content writing", level: 4 },
    { id: "demo-skill-4", name: "Google Analytics", level: 3 },
    { id: "demo-skill-5", name: "Stakeholder reporting", level: 4 },
    { id: "demo-skill-6", name: "Budget planning", level: 4 },
  ],
  languages: [
    { id: "demo-lang-1", name: "Khmer", level: 5 },
    { id: "demo-lang-2", name: "English", level: 4 },
  ],
  references: [],
  includeReferences: false,
};

/** Same demo person + the template's layout, so every marketplace surface matches. */
export function demoResumeForPreset(customization: Customization): Resume {
  return {
    ...DEMO_RESUME,
    customization: { ...customization },
  };
}
