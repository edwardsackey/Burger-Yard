import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function OrderTrackingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapArea}>
        <View style={styles.mockRouteLine} />
        <View style={styles.riderPin} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHandle} />
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusSub}>Arriving in</Text>
            <Text style={styles.statusTitle}>On the way</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.etaText}>~15 min</Text>
            <Text style={styles.orderId}>Order #1042</Text>
          </View>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineRow}>
            <View style={[styles.dot, styles.dotDone]} />
            <Text style={styles.timelineText}>
              Order accepted <Text style={styles.time}>12:04 PM</Text>
            </Text>
          </View>
          <View style={styles.timelineRow}>
            <View style={[styles.dot, styles.dotDone]} />
            <Text style={styles.timelineText}>
              Preparing your food <Text style={styles.time}>12:09 PM</Text>
            </Text>
          </View>
          <View style={styles.timelineRow}>
            <View style={[styles.dot, styles.dotDone]} />
            <Text style={styles.timelineText}>
              On the way <Text style={styles.time}>Rider picked up</Text>
            </Text>
          </View>
          <View style={styles.timelineRow}>
            <View style={styles.dot} />
            <Text style={styles.timelineTextDim}>
              Delivered <Text style={styles.time}>Awaiting OTP</Text>
            </Text>
          </View>
        </View>

        <View style={styles.riderCard}>
          <View style={styles.riderAvatar}>
            <Text>🛵</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.riderName}>Kwame · Your rider</Text>
            <Text style={styles.riderBike}>Honda · GR-2204 · ⭐ 4.9</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Text style={styles.callText}>Call</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeTitle}>Delivery code</Text>
          <Text style={styles.codeSub}>Share with rider on arrival</Text>
          <View style={styles.codeBoxes}>
            {["4", "2", "8", "1"].map((n, i) => (
              <View key={i} style={styles.codeBox}>
                <Text style={styles.codeDigit}>{n}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E5E7EB" },
  mapHeader: { position: "absolute", top: 50, left: 20, zIndex: 10 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  closeText: { fontSize: 16, fontWeight: "bold" },
  mapArea: {
    height: 280,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
  mockRouteLine: {
    width: 150,
    height: 4,
    backgroundColor: "#D62828",
    transform: [{ rotate: "45deg" }],
  },
  riderPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D62828",
    borderWidth: 3,
    borderColor: "#FFF",
    position: "absolute",
  },
  panel: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 5,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusSub: { fontSize: 12, color: "#666" },
  statusTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  etaText: { fontSize: 18, fontWeight: "bold", color: "#D62828" },
  orderId: { fontSize: 11, color: "#666" },
  timeline: { marginBottom: 16, gap: 10 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#D1D5DB" },
  dotDone: { backgroundColor: "#D62828" },
  timelineText: { fontSize: 13, fontWeight: "600", color: "#111" },
  timelineTextDim: { fontSize: 13, color: "#9CA3AF" },
  time: { fontSize: 11, color: "#666", fontWeight: "normal" },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
  },
  riderName: { fontSize: 14, fontWeight: "bold", color: "#111" },
  riderBike: { fontSize: 11, color: "#666" },
  callBtn: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  callText: { fontSize: 12, fontWeight: "bold", color: "#333" },
  codeCard: {
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeTitle: { fontSize: 12, fontWeight: "bold", color: "#111" },
  codeSub: { fontSize: 10, color: "#666" },
  codeBoxes: { flexDirection: "row", gap: 6 },
  codeBox: {
    width: 28,
    height: 28,
    backgroundColor: "#FFF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  codeDigit: { fontSize: 14, fontWeight: "bold", color: "#D62828" },
});
