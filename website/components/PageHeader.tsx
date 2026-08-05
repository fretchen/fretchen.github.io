import * as React from "react";
import { css } from "../styled-system/css";
import { titleBar } from "../layouts/shared";
import { sectionRule, type SectionRuleVariantProps } from "../styled-system/recipes";

/**
 * The lead paragraph. Reading face because it is prose, but `md` rather than the prose `lg`:
 * an index page is a surface you navigate, and this sits above a list of links rather than
 * above an article. Bounded to the measure so it ends on the same right edge as the cards or
 * entries below it.
 */
const intro = css({
  fontFamily: "reading",
  fontSize: "md",
  lineHeight: "relaxed",
  maxWidth: "measure",
  marginBottom: "lg",
});

interface PageHeaderProps {
  title: string;
  /** Hue of the rule under the title. Defaults to voice, as the recipe does. */
  territory?: SectionRuleVariantProps["territory"];
  /** Lead paragraph. Guides omit it — their intro belongs to the prose surface. */
  children?: React.ReactNode;
}

/**
 * How every page opens: title, territory rule, and an optional lead paragraph.
 *
 * Eleven call sites repeated these three lines verbatim before this existed, each with its own
 * copy of the intro's typography — which is how one of them ended up inheriting its font size
 * instead of stating it. A page now declares its header rather than rebuilding it.
 *
 * Returns a fragment, so the caller keeps ownership of the surrounding layout: most pages drop
 * it straight into `container`, agent-onboarding passes it to ArticleShell's `header` slot, and
 * AssistantChat nests it in a flex row beside its mobile actions.
 */
export function PageHeader({ title, territory = "voice", children }: PageHeaderProps) {
  return (
    <>
      <h1 className={titleBar.title}>{title}</h1>
      <span className={sectionRule({ territory })} aria-hidden="true" />
      {children && <p className={intro}>{children}</p>}
    </>
  );
}
