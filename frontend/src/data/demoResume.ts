import type { Resume } from "../types/resume";
import { emptyResume } from "../types/resume";
const DEMO_PHOTO_URL =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="#CBD5E1"/>' +
      '<circle cx="100" cy="78" r="38" fill="#94A3B8"/>' +
      '<path d="M30 190c0-45 31-72 70-72s70 27 70 72" fill="#94A3B8"/>' +
      "</svg>",
  );
export const DEMO_RESUME: Resume = {
  ...emptyResume,
  title: "Demo resume",
  personal: {
    ...emptyResume.personal,
    fullName: "Sokha Chan",
    jobTitle: "Marketing Executive",
    email: "sokha.chan@email.com",
    phone: "012 345 678",
    location: "Phnom Penh, Cambodia",
    photoUrl: DEMO_PHOTO_URL,
    summary:
      "<p>Results-driven marketing professional with 4+ years of experience planning campaigns, growing brand reach, and collaborating across teams to hit ambitious targets.</p>",
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
        "<ul><li>Led 12 digital campaigns that grew qualified leads by 35%</li><li>Managed a monthly budget of $8,000 across social and search channels</li></ul>",
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
        "<ul><li>Coordinated launch events for 3 new mobile plans</li></ul>",
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
      description: "",
    },
  ],
  skills: [
    { id: "demo-skill-1", name: "Campaign Strategy", level: 5 },
    { id: "demo-skill-2", name: "Social Media Ads", level: 4 },
    { id: "demo-skill-3", name: "Content Writing", level: 4 },
    { id: "demo-skill-4", name: "Data Analysis", level: 3 },
  ],
  languages: [
    { id: "demo-lang-1", name: "Khmer", level: 5 },
    { id: "demo-lang-2", name: "English", level: 4 },
  ],
  references: [],
  includeReferences: false,
};
