import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  cronos,
  fantom,
  gnosis,
  linea,
  mainnet,
  metis,
  neonMainnet,
  optimism,
  polygon,
  sonic,
  hedera,
  hederaTestnet,
} from "wagmi/chains";

function getProjectId() {
  // Use a fallback ID if VITE_HASHCONNECT_PROJECT_ID is not set
  const projectId = import.meta.env.VITE_HASHCONNECT_PROJECT_ID || "demo-app-v1";
  return projectId;
}

export const config = getDefaultConfig({
  appName: "Vistia Smart Money AI",
  projectId: getProjectId(),
  chains: [hedera, hederaTestnet],
  ssr: true,
});
