/**
 * WhySpec ASCII logo — ANSI Shadow style, matching the landing page.
 * Raw string without color — callers apply styling.
 */
export const WHYSPEC_LOGO = `\
██╗    ██╗██╗  ██╗██╗   ██╗███████╗██████╗ ███████╗ ██████╗
██║    ██║██║  ██║╚██╗ ██╔╝██╔════╝██╔══██╗██╔════╝██╔════╝
██║ █╗ ██║███████║ ╚████╔╝ ███████╗██████╔╝█████╗  ██║
██║███╗██║██╔══██║  ╚██╔╝  ╚════██║██╔═══╝ ██╔══╝  ██║
╚███╔███╔╝██║  ██║   ██║   ███████║██║     ███████╗╚██████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝     ╚══════╝ ╚═════╝`;

export function renderLogo(): string {
  return WHYSPEC_LOGO;
}
