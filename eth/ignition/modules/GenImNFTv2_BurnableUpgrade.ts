// npx hardhat ignition deploy ./ignition/modules/GenImNFTv2_BurnableUpgrade.ts 
// --network sepolia --parameters '{ "proxyAddress": "0xDieAdresseDesAktuellenProxys" }'
 
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GenImNFTUpgradeModule", (m) => {
  // Parameter: Die Adresse des bestehenden Proxys
  // Dies sollte die Adresse des Proxys sein, der aus dem ursprünglichen Deployment stammt
  const proxyAddress = m.getParameter("proxyAddress");
  
  // 1. Prüfen des aktuellen Zustands (optional, aber nützlich)
  const existingContract = m.contractAt("GenImNFT", proxyAddress);
  const currentName = m.read(existingContract, "name");
  
  // 2. Deploy der neuen Implementation 
  // Hier verwenden wir GenImNFTv3 als neue Version
  const newImplementation = m.contract("GenImNFTv3", []); 
  
  // 3. Upgrade des Proxys mit UUPS-Methode
  // Bei UUPS wird das Upgrade über die Implementation selbst durchgeführt,
  // nicht über einen ProxyAdmin
  const upgraded = m.upgradeProxy(proxyAddress, newImplementation, {
    kind: "uups"
    // Hier könnten wir eine reInitialize-Funktion aufrufen, falls nötig
    // reInitializer: "reinitializeV2",
    // initializeArgs: []
  });
  
  // 4. Erstellen einer typisierten Instanz des aktualisierten Contracts
  const upgradedContract = m.contractAt("GenImNFTv3", proxyAddress);
  
  // 5. Optional: Validierung des aktualisierten Contracts
  // Diese Checks können helfen zu bestätigen, dass das Upgrade erfolgreich war
  const newName = m.read(upgradedContract, "name");
  
  // Wir können überprüfen, dass der Name gleich geblieben ist (Zustandserhaltung)
  m.expect(newName).equals(currentName);
  
  // Wir könnten auch neue Funktionen prüfen, falls GenImNFTv3 welche hat
  // z.B. eine neue version()-Funktion
  // const version = m.read(upgradedContract, "version");
  // m.expect(version).equals("v3");
  
  return { 
    genImNFTV3Implementation: newImplementation,
    upgradedProxy: upgraded,
    upgradedContract: upgradedContract
  };
});