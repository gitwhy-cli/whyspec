import chalk from "chalk";

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
  return chalk.cyan(WHYSPEC_LOGO);
}
