import chalk from "chalk";

/**
 * WhySpec ASCII logo — figlet "small" style.
 * Raw string without color — callers apply styling.
 */
export const WHYSPEC_LOGO = `\
  __      ___           ____
  \\ \\    / / |_ _  _ __|  _ \\ _ __  ___  ___
   \\ \\/\\/ /| ' \\ || (_-< ___/| '_ \\/ -_)/ _|
    \\_/\\_/ |_||_\\_, /__/|_|  | .__/\\___|\\__|
               |__/          |_|`;

export function renderLogo(): string {
  return chalk.cyan(WHYSPEC_LOGO);
}
