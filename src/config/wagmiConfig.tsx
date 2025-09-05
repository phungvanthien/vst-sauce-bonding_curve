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
  if (!import.meta.env.VITE_HASHCONNECT_PROJECT_ID) {
    throw new Error("VITE_HASHCONNECT_PROJECT_ID is not set");
  }
  return import.meta.env.VITE_HASHCONNECT_PROJECT_ID;
}

export const config = getDefaultConfig({
  appName: "Vistia Smart Money AI",
  projectId: getProjectId(),
  chains: [hedera, hederaTestnet],
  ssr: true,
});
