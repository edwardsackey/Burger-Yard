import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How long does delivery take?",
      a: "Deliveries typically take between 20 to 35 minutes depending on your location in Ayeduase or Kumasi surroundings.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Mobile Money (MTN, Telecel, AT), credit/debit cards, and Cash on Delivery.",
    },
    {
      q: "How do I use my discount promo code?",
      a: "You can apply your promo code right on the cart or checkout screen before placing your order.",
    },
    {
      q: "Can I cancel or modify my order?",
      a: "Once the kitchen begins preparation, orders cannot be cancelled directly. Please call support immediately for urgent changes.",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact Cards */}
        <Text style={styles.sectionTitle}>Get in touch</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL("https://wa.me/233543927440")}
          >
            <Text style={styles.contactEmoji}>💬</Text>
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactSub}>Fastest response</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL("tel:+233543927440")}
          >
            <Text style={styles.contactEmoji}>📞</Text>
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactSub}>054 392 7440</Text>
          </TouchableOpacity>
        </View>

        {/* Branch Location info */}
        <View style={styles.branchBox}>
          <Text style={styles.branchHeader}>📍 Our Kitchens</Text>
          <Text style={styles.branchText}>
            • Ayeduase New Site (Main Hub, Kumasi)
          </Text>
          <Text style={styles.branchText}>• Osu Branch (Accra)</Text>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                activeOpacity={0.8}
                onPress={() => setExpandedFaq(isOpen ? null : index)}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQText}>{faq.q}</Text>
                  <Text style={styles.chevron}>{isOpen ? "−" : "+"}</Text>
                </View>
                {isOpen && <Text style={styles.faqAText}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    marginTop: 4,
  },
  contactRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  contactCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  contactEmoji: { fontSize: 28, marginBottom: 8 },
  contactTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 2,
  },
  contactSub: { fontSize: 11, color: "#666", textAlign: "center" },
  branchBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  branchHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  branchText: { fontSize: 13, color: "#555", marginBottom: 4 },
  faqList: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  faqItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
    flex: 1,
    paddingRight: 10,
  },
  chevron: { fontSize: 18, fontWeight: "bold", color: "#DA291C" },
  faqAText: { fontSize: 13, color: "#555", marginTop: 10, lineHeight: 18 },
});
