import type { LayoutVariant, Resume } from "../../../types/resume";
import DesignerBlockLayout from "./DesignerBlockLayout";
import TechSplitLayout from "./TechSplitLayout";
import BankingCleanLayout from "./BankingCleanLayout";
import FreshSidebarLayout from "./FreshSidebarLayout";
import NavyAnalystLayout from "./NavyAnalystLayout";
import RibbonFoldLayout from "./RibbonFoldLayout";
import GraphicProLayout from "./GraphicProLayout";
import ExecutiveCardLayout from "./ExecutiveCardLayout";
import MonoTimelineLayout from "./MonoTimelineLayout";
import EditorialClassicLayout from "./EditorialClassicLayout";
import CompactTechLayout from "./CompactTechLayout";
import GraduateFocusLayout from "./GraduateFocusLayout";
import CorporateBandLayout from "./CorporateBandLayout";
import WarmColumnsLayout from "./WarmColumnsLayout";
import MonoPillLayout from "./MonoPillLayout";
import CleanHeaderSplitLayout from "./CleanHeaderSplitLayout";

export function hasSpecialLayout(variant: LayoutVariant | undefined) {
  return !!variant && variant !== "default";
}

export function SpecialLayout({
  resume,
  pageWidthPx,
  pageHeightPx,
  expandHeight = false,
  pageIndex = 0,
  totalPages = 1,
}: {
  resume: Resume;
  pageWidthPx: number;
  pageHeightPx: number;
  expandHeight?: boolean;
  pageIndex?: number;
  totalPages?: number;
}) {
  const variant = resume.customization.layoutVariant;
  const props = {
    resume,
    pageWidthPx,
    pageHeightPx,
    expandHeight,
    pageIndex,
    totalPages,
  };
  switch (variant) {
    case "designerBlock":
      return <DesignerBlockLayout {...props} />;
    case "techSplit":
      return <TechSplitLayout {...props} />;
    case "bankingClean":
      return <BankingCleanLayout {...props} />;
    case "freshSidebar":
      return <FreshSidebarLayout {...props} />;
    case "navyAnalyst":
      return <NavyAnalystLayout {...props} />;
    case "ribbonFold":
      return <RibbonFoldLayout {...props} />;
    case "graphicPro":
      return <GraphicProLayout {...props} />;
    case "executiveCard":
      return <ExecutiveCardLayout {...props} />;
    case "monoTimeline":
      return <MonoTimelineLayout {...props} />;
    case "editorialClassic":
      return <EditorialClassicLayout {...props} />;
    case "compactTech":
      return <CompactTechLayout {...props} />;
    case "graduateFocus":
      return <GraduateFocusLayout {...props} />;
    case "corporateBand":
      return <CorporateBandLayout {...props} />;
    case "warmColumns":
      return <WarmColumnsLayout {...props} />;
    case "monoPill":
      return <MonoPillLayout {...props} />;
    case "cleanHeaderSplit":
      return <CleanHeaderSplitLayout {...props} />;
    default:
      return null;
  }
}
