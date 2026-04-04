import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

const herouiPlugin = heroui() as unknown as NonNullable<Config["plugins"]>[number];

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [herouiPlugin],
};

export default config;
