import { TopSheet } from "@/components/top-sheet";
import { NETWORKS, getNetwork, type NetworkId } from "@/constants/networks";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * A saved wallet. It stores the network rather than a display name so the
 * logo, the wallet name and the row can never drift apart.
 */
type Method = {
  id: string;
  network: NetworkId;
  val: string;
  default: boolean;
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [methods, setMethods] = useState<Method[]>([
    { id: "1", network: "mtn", val: "+233 54 ••• 7440", default: true },
    { id: "2", network: "telecel", val: "+233 20 ••• 1928", default: false },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [provider, setProvider] = useState<NetworkId>("mtn");
  const [accountNumber, setAccountNumber] = useState("");

  const handleSetDefault = (id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, default: m.id === id })));
  };

  const handleAddMethod = () => {
    if (!accountNumber.trim()) {
      Alert.alert(
        "Error",
        "Please enter your mobile number or account details.",
      );
      return;
    }

    const newMethod: Method = {
      id: Date.now().toString(),
      network: provider,
      val: accountNumber,
      default: methods.length === 0,
    };

    setMethods([...methods, newMethod]);
    setAccountNumber("");
    setModalVisible(false);
    Alert.alert("Success", "Payment method added successfully!");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {methods.map((item) => (
          <View
            key={item.id}
            style={[styles.card, item.default && styles.cardActive]}
          >
            <View style={styles.cardTop}>
              <Image
                source={getNetwork(item.network).logo}
                style={styles.cardLogo}
                resizeMode="cover"
                accessibilityLabel={getNetwork(item.network).label}
              />
              <View style={styles.cardText}>
                <Text style={styles.payName}>
                  {getNetwork(item.network).wallet}
                </Text>
                <Text style={styles.payVal}>{item.val}</Text>
              </View>
              {item.default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              )}
            </View>

            <View style={styles.cardActions}>
              {!item.default ? (
                <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
                  <Text style={styles.setDefaultText}>Set as default</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <TouchableOpacity
                onPress={() => {
                  setMethods(methods.filter((m) => m.id !== item.id));
                }}
              >
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add payment method</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Comes down from the top, and a tap anywhere inside puts the
          number pad away so the buttons stay reachable. */}
      <TopSheet
        visible={modalVisible}
        title="Add payment method"
        subtitle="Mobile money is charged at checkout."
        onClose={() => setModalVisible(false)}
        footer={
          <>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddMethod}>
              <Text style={styles.saveText}>Save method</Text>
            </TouchableOpacity>
          </>
        }
      >
        <Text style={styles.label}>Provider</Text>
        <View style={styles.providerRow}>
          {NETWORKS.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.providerPill,
                provider === n.id && styles.providerPillActive,
              ]}
              onPress={() => setProvider(n.id)}
            >
              <Image
                source={n.logo}
                style={styles.providerLogo}
                resizeMode="cover"
                accessibilityLabel={n.label}
              />
              <Text
                style={[
                  styles.providerText,
                  provider === n.id && styles.providerTextActive,
                ]}
              >
                {n.wallet}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Account or phone number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0543927440"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />
      </TopSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 24, justifyContent: "center" },
  backText: { fontSize: 22, fontWeight: "bold", color: "#111" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  scrollContent: { padding: 20, gap: 14 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardActive: { borderColor: "#D62828", borderWidth: 1.5 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  cardLogo: { width: 54, height: 36, borderRadius: 8, overflow: "hidden" },
  cardText: { flex: 1 },
  payName: { fontSize: 15, fontWeight: "bold", color: "#111" },
  defaultBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: { fontSize: 9, fontWeight: "bold", color: "#D62828" },
  payVal: { fontSize: 13, color: "#666", marginTop: 2 },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  setDefaultText: { fontSize: 12, fontWeight: "bold", color: "#D62828" },
  deleteText: { fontSize: 12, fontWeight: "bold", color: "#9CA3AF" },
  addBtn: {
    borderWidth: 1.5,
    borderColor: "#D62828",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginTop: 10,
  },
  addBtnText: { color: "#D62828", fontSize: 14, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  label: { fontSize: 12, fontWeight: "bold", color: "#444" },
  providerRow: { flexDirection: "row", gap: 8 },
  providerPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  providerPillActive: { backgroundColor: "#D62828", borderColor: "#D62828" },
  providerLogo: { width: 48, height: 32, borderRadius: 7, overflow: "hidden" },
  providerText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#444",
    textAlign: "center",
  },
  providerTextActive: { color: "#FFF" },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: "#111",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "bold", color: "#444" },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: { fontSize: 14, fontWeight: "bold", color: "#FFF" },
});
