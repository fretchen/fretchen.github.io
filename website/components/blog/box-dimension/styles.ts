import { css } from "../../../styled-system/css";

/**
 * 44px minimum touch target — the widgets are read on an iPad by a child's finger.
 *
 * The `button` recipe does not cover this on its own: `size: "md"` is `paddingY: sm`
 * (10px) around 14px text ≈ 37px, `size: "sm"` ≈ 29px. This is NOT a second button
 * definition (see README → "One button") — it is one measurement merged next to the
 * recipe class, the same way `Post.tsx` merges `post.errorSpacing`.
 */
export const touchTarget = css({ minHeight: "44px" });

/**
 * The guidance line: the one sentence each widget shows at a time — the question to guess,
 * or the count just measured, or what to do next. It replaced three separate elements (an
 * italic grey hint, a 24px count readout and a caption), all of which competed for the same
 * job at different sizes.
 *
 * Set at prose size in the reading face, like the Fazit: these are the two things a child
 * *reads*, and IDENTITY.md decides the face by what the content is, not by its container.
 * The surrounding chrome stays in the interface face.
 *
 * `minHeight` keeps the button below it from jumping as the sentence changes length.
 */
export const guidanceLine = css({
  fontFamily: "reading",
  fontSize: "lg",
  lineHeight: "relaxed",
  color: "text",
  mt: "3",
  minHeight: "3.5rem",
});

/** The count inside the guidance line — the "number in focus", the only accent in the chrome. */
export const guidanceCount = css({ fontWeight: "bold", color: "explore" });
