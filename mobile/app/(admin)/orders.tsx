import {
  Button,
  Card,
  FadeIn,
  Icon,
  StatusPill,
  type IconName,
} from "@/components/admin/ui";
import { useDialog } from "@/components/admin/dialog";
import { Admin } from "@/constants/admin-theme";
import { imageForName } from "@/constants/menu-catalog";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/** The kitchen flow, in order. Accepting moves an order one step along it. */
const FLOW = ["New", "Preparing", "Ready", "Out for delivery", "Completed"] as const;
type Status = (typeof FLOW)[number] | "Cancelled";

type OrderItem = { qty: string; name: string; modifier: string; price: string };

type Order = {
  id: string;
  timeAgo: string;
  status: Status;
  customer: string;
  location: string;
  summary: string;
  total: string;
  payment: string;
  phone: string;
  addressDetails: string;
  items: OrderItem[];
  subtotal: string;
  delivery: string;
  paid: boolean;
};

const SEED: Order[] = [
  {
    id: "#1042", timeAgo: "2 min ago", status: "New", customer: "Ama Mensah",
    location: "Ayeduase New Site", summary: "2x Single Cheese (+Bacon), Chicken Burger, Coke",
    total: "GHS 195", payment: "MoMo", phone: "0543927440",
    addressDetails: "Ayeduase New Site · near the blue gate, 2nd house",
    items: [
      { qty: "1x", name: "Single Cheese Burger", modifier: "+ Bacon (GHS 15)", price: "GHS 85" },
      { qty: "1x", name: "Chicken Burger", modifier: "", price: "GHS 95" },
    ],
    subtotal: "GHS 180", delivery: "GHS 15", paid: true,
  },
  {
    id: "#1041", timeAgo: "6 min ago", status: "Preparing", customer: "Kwesi Boateng",
    location: "Kotei", summary: "Single Cheese Burger", total: "GHS 70",
    payment: "Cash", phone: "0244244123", addressDetails: "Kotei main road",
    items: [{ qty: "1x", name: "Single Cheese Burger", modifier: "", price: "GHS 70" }],
    subtotal: "GHS 55", delivery: "GHS 15", paid: false,
  },
  {
    id: "#1040", timeAgo: "11 min ago", status: "Ready", customer: "Adwoa Owusu",
    location: "Ayeduase Gate", summary: "Chicken Burger x Fries", total: "GHS 120",
    payment: "MoMo", phone: "0245012345", addressDetails: "Ayeduase Gate opposite hostel",
    items: [{ qty: "1x", name: "Chicken Burger x Fries", modifier: "", price: "GHS 120" }],
    subtotal: "GHS 105", delivery: "GHS 15", paid: true,
  },
  {
    id: "#1039", timeAgo: "18 min ago", status: "Out for delivery", customer: "Yaw Darko",
    location: "Bomso", summary: "Double Cheese Burger", total: "GHS 100",
    payment: "Card", phone: "0207781234", addressDetails: "Bomso junction, yellow flats",
    items: [{ qty: "1x", name: "Double Cheese Burger", modifier: "", price: "GHS 100" }],
    subtotal: "GHS 85", delivery: "GHS 15", paid: true,
  },
  {
    id: "#1038", timeAgo: "34 min ago", status: "Completed", customer: "Akosua Frimpong",
    location: "Ayeduase", summary: "Fries Regular", total: "GHS 35",
    payment: "MoMo", phone: "0559990001", addressDetails: "Ayeduase New Site",
    items: [{ qty: "1x", name: "Fries Regular", modifier: "", price: "GHS 25" }],
    subtotal: "GHS 20", delivery: "GHS 15", paid: true,
  },
];

/** What the primary action says, given where the order currently is. */
function nextAction(status: Status): { label: string; icon: IconName } | null {
  switch (status) {
    case "New": return { label: "Accept order", icon: "check" };
    case "Preparing": return { label: "Mark ready", icon: "package" };
    case "Ready": return { label: "Send out", icon: "truck" };
    case "Out for delivery": return { label: "Mark delivered", icon: "check-circle" };
    default: return null;
  }
}

export default function AdminOrdersScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const { confirm } = useDialog();
  const [orders, setOrders] = useState<Order[]>(SEED);
  const [selectedTab, setSelectedTab] = useState("All");
  const [selectedOrderId, setSelectedOrderId] = useState("#1042");
  const [query, setQuery] = useState("");
  const [openOnPhone, setOpenOnPhone] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: orders.length };
    [...FLOW, "Cancelled"].forEach((s) => {
      map[s] = orders.filter((o) => o.status === s).length;
    });
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const inTab = selectedTab === "All" || o.status === selectedTab;
      const matches =
        !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
      return inTab && matches;
    });
  }, [orders, selectedTab, query]);

  const current = orders.find((o) => o.id === selectedOrderId) ?? filtered[0] ?? orders[0];

  const advance = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const i = FLOW.indexOf(o.status as (typeof FLOW)[number]);
        if (i === -1 || i >= FLOW.length - 1) return o;
        return { ...o, status: FLOW[i + 1] };
      }),
    );
  };

  const decline = async (order: Order) => {
    const ok = await confirm({
      title: "Decline order",
      message: `Decline ${order.id} from ${order.customer}? They will be told it was refused.`,
      confirmLabel: "Decline",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "Cancelled" } : o)),
      );
    }
  };

  const call = (order: Order) => Linking.openURL(`tel:+233${order.phone.replace(/^0/, "")}`);
  const whatsapp = (order: Order) =>
    Linking.openURL(`https://wa.me/233${order.phone.replace(/^0/, "")}`);

  const showDetail = isDesktop || (isPhone && openOnPhone) || (!isPhone && !isDesktop);

  const action = nextAction(current?.status ?? "Completed");

  const renderDetail = () => (
    <Card style={styles.detailCard}>
      <View style={styles.detailHead}>
        {isPhone && (
          <Pressable onPress={() => setOpenOnPhone(false)} style={styles.backBtn}>
            <Icon name="arrow-left" size={16} color={Admin.text} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.detailId}>{current.id}</Text>
          <Text style={styles.detailMeta}>
            {current.customer} · {current.timeAgo}
          </Text>
        </View>
        <StatusPill status={current.status} />
      </View>

      {/* Progress through the kitchen flow */}
      <View style={styles.stepper}>
        {FLOW.map((step, i) => {
          const currentIndex = FLOW.indexOf(current.status as (typeof FLOW)[number]);
          const done = currentIndex >= i && currentIndex !== -1;
          return (
            <View key={step} style={styles.step}>
              <View style={[styles.stepDot, done && styles.stepDotDone]}>
                {done && <Icon name="check" size={9} color="#FFFFFF" />}
              </View>
              {i < FLOW.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>
      <Text style={styles.stepLabel}>
        {current.status === "Cancelled" ? "Order cancelled" : current.status}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.blockLabel}>ITEMS</Text>
      {current.items.map((it, i) => (
        <View key={`${it.name}-${i}`} style={styles.itemRow}>
          <Image
            source={imageForName(it.name)}
            style={styles.itemThumb}
            resizeMode="cover"
          />
          <Text style={styles.itemQty}>{it.qty}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{it.name}</Text>
            {it.modifier ? <Text style={styles.itemMod}>{it.modifier}</Text> : null}
          </View>
          <Text style={styles.itemPrice}>{it.price}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{current.subtotal}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Delivery</Text>
        <Text style={styles.totalValue}>{current.delivery}</Text>
      </View>
      <View style={[styles.totalRow, styles.grandRow]}>
        <Text style={styles.grandLabel}>Total</Text>
        <Text style={styles.grandValue}>{current.total}</Text>
      </View>

      <View style={styles.payRow}>
        <Icon name={current.paid ? "check-circle" : "clock"} size={13}
          color={current.paid ? Admin.green : Admin.amber} />
        <Text style={[styles.payText, { color: current.paid ? Admin.green : Admin.amber }]}>
          {current.payment} · {current.paid ? "Paid" : "Pay on delivery"}
        </Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.blockLabel}>DELIVER TO</Text>
      <Text style={styles.address}>{current.addressDetails}</Text>
      <View style={styles.contactRow}>
        <Button label="Call" icon="phone" variant="secondary" size="sm"
          onPress={() => call(current)} />
        <Button label="WhatsApp" icon="message-circle" variant="secondary" size="sm"
          onPress={() => whatsapp(current)} />
      </View>

      <View style={styles.actionRow}>
        {current.status === "New" && (
          <Button label="Decline" variant="danger" icon="x"
            onPress={() => decline(current)} style={{ flex: 1 }} />
        )}
        {action ? (
          <Button label={action.label} icon={action.icon}
            onPress={() => advance(current.id)} style={{ flex: 1 }} />
        ) : (
          <View style={styles.closedNote}>
            <Icon name="check-circle" size={14} color={Admin.textMuted} />
            <Text style={styles.closedText}>
              {current.status === "Cancelled" ? "Declined" : "Completed"}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {(!isPhone || !openOnPhone) && (
          <>
            <FadeIn>
              <View style={[styles.topBar, !isDesktop && styles.topBarStacked]}>
                <View style={{ flex: 1, minWidth: 200 }}>
                  <Text style={styles.headerTitle}>Orders</Text>
                  <Text style={styles.headerSub}>
                    {counts.New ?? 0} new · {orders.length} total · live updating
                  </Text>
                </View>
                <View style={[styles.controls, !isDesktop && styles.controlsWrap]}>
                  <View style={[styles.search, isPhone && styles.searchPhone]}>
                    <Icon name="search" size={15} color={Admin.textFaint} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by order # or name..."
                      placeholderTextColor={Admin.textFaint}
                      value={query}
                      onChangeText={setQuery}
                    />
                  </View>
                  <View style={styles.openPill}>
                    <View style={styles.greenDot} />
                    <Text style={styles.openText}>We&apos;re open</Text>
                  </View>
                </View>
              </View>
            </FadeIn>

            <FadeIn delay={60}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsRow}>
                {["All", ...FLOW].map((name) => {
                  const active = selectedTab === name;
                  return (
                    <Pressable key={name} onPress={() => setSelectedTab(name)}
                      style={[styles.tabBtn, active && styles.tabBtnActive]}>
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>
                        {name}
                      </Text>
                      <View style={[styles.tabCount, active && styles.tabCountActive]}>
                        <Text style={[styles.tabCountText, active && { color: "#FFFFFF" }]}>
                          {counts[name] ?? 0}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </FadeIn>
          </>
        )}

        <View style={[styles.split, !isDesktop && styles.splitStacked]}>
          {(!isPhone || !openOnPhone) && (
            <FadeIn delay={110} style={isDesktop ? styles.listCol : undefined}>
              {filtered.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Icon name="inbox" size={22} color={Admin.textFaint} />
                  <Text style={styles.emptyText}>No {selectedTab.toLowerCase()} orders.</Text>
                </Card>
              ) : (
                <View style={{ gap: 12 }}>
                  {filtered.map((o) => {
                    const active = o.id === current?.id;
                    return (
                      <Pressable
                        key={o.id}
                        onPress={() => {
                          setSelectedOrderId(o.id);
                          if (isPhone) setOpenOnPhone(true);
                        }}
                      >
                        <Card style={[styles.orderCard, active && styles.orderCardActive]}>
                          <View style={styles.orderTop}>
                            <Text style={styles.orderId}>{o.id}</Text>
                            <StatusPill status={o.status} />
                          </View>
                          <Text style={styles.orderCustomer}>
                            {o.customer} · {o.location}
                          </Text>
                          <Text style={styles.orderSummary} numberOfLines={1}>
                            {o.summary}
                          </Text>
                          <View style={styles.orderBottom}>
                            <Text style={styles.orderTotal}>{o.total}</Text>
                            <Text style={styles.orderTime}>{o.timeAgo}</Text>
                          </View>

                          {o.status === "New" && (
                            <View style={styles.miniRow}>
                              <Button label="Decline" variant="danger" size="sm"
                                onPress={() => decline(o)} style={{ flex: 1 }} />
                              <Button label="Accept" size="sm"
                                onPress={() => advance(o.id)} style={{ flex: 1 }} />
                            </View>
                          )}
                        </Card>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </FadeIn>
          )}

          {showDetail && current && (
            <FadeIn delay={150} style={isDesktop ? styles.detailCol : undefined}>
              {renderDetail()}
            </FadeIn>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Admin.canvas },
  scroll: { padding: 24, gap: 18 },
  scrollPhone: { padding: 14, gap: 14 },

  topBar: { flexDirection: "row", alignItems: "center", gap: 16 },
  topBarStacked: { flexDirection: "column", alignItems: "stretch" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: Admin.text },
  headerSub: { fontSize: 12.5, color: Admin.textMuted, marginTop: 4 },

  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  controlsWrap: { flexWrap: "wrap", marginTop: 12 },
  search: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Admin.surface, borderWidth: 1, borderColor: Admin.border,
    borderRadius: 10, paddingHorizontal: 12, height: 40, width: 260,
  },
  searchPhone: { flex: 1, minWidth: 160, width: "auto" },
  searchInput: { flex: 1, fontSize: 13, color: Admin.text, outlineStyle: "none" } as object,
  openPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Admin.greenSoft, paddingHorizontal: 12, height: 40, borderRadius: 10,
  },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Admin.green },
  openText: { fontSize: 12, fontWeight: "700", color: Admin.green },

  tabsRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9,
    backgroundColor: Admin.surface, borderWidth: 1, borderColor: Admin.border,
  },
  tabBtnActive: { backgroundColor: Admin.ink, borderColor: Admin.ink },
  tabText: { fontSize: 12.5, fontWeight: "600", color: Admin.textMuted },
  tabTextActive: { color: "#FFFFFF" },
  tabCount: {
    minWidth: 18, paddingHorizontal: 5, borderRadius: 9,
    backgroundColor: Admin.divider, alignItems: "center",
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  tabCountText: { fontSize: 10.5, fontWeight: "700", color: Admin.textMuted },

  split: { flexDirection: "row", gap: 18 },
  splitStacked: { flexDirection: "column" },
  listCol: { flex: 1.15 },
  detailCol: { flex: 1 },

  orderCard: { padding: 15, gap: 7 },
  orderCardActive: { borderColor: Admin.red, borderWidth: 1.5 },
  orderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderId: { fontSize: 14, fontWeight: "800", color: Admin.text },
  orderCustomer: { fontSize: 12.5, color: Admin.text },
  orderSummary: { fontSize: 12, color: Admin.textMuted },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderTotal: { fontSize: 14, fontWeight: "800", color: Admin.red },
  orderTime: { fontSize: 11.5, color: Admin.textFaint },
  miniRow: { flexDirection: "row", gap: 8, marginTop: 6 },

  detailCard: { gap: 0 },
  detailHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    width: 32, height: 32, borderRadius: 8, alignItems: "center",
    justifyContent: "center", backgroundColor: Admin.divider,
  },
  detailId: { fontSize: 18, fontWeight: "800", color: Admin.text },
  detailMeta: { fontSize: 12, color: Admin.textMuted, marginTop: 2 },

  stepper: { flexDirection: "row", alignItems: "center" },
  step: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepDot: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: Admin.divider,
    alignItems: "center", justifyContent: "center",
  },
  stepDotDone: { backgroundColor: Admin.green },
  stepLine: { flex: 1, height: 2, backgroundColor: Admin.divider },
  stepLineDone: { backgroundColor: Admin.green },
  stepLabel: { fontSize: 12, fontWeight: "700", color: Admin.text, marginTop: 8 },

  divider: { height: 1, backgroundColor: Admin.divider, marginVertical: 16 },
  blockLabel: {
    fontSize: 10, fontWeight: "700", color: Admin.textFaint,
    letterSpacing: 0.6, marginBottom: 10,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  itemThumb: { width: 36, height: 36, borderRadius: 8, backgroundColor: Admin.divider },
  itemQty: { fontSize: 12.5, fontWeight: "700", color: Admin.textMuted, width: 26 },
  itemName: { fontSize: 13, color: Admin.text, fontWeight: "600" },
  itemMod: { fontSize: 11.5, color: Admin.textMuted, marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: "700", color: Admin.text },

  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  totalLabel: { fontSize: 12.5, color: Admin.textMuted },
  totalValue: { fontSize: 12.5, color: Admin.text, fontWeight: "600" },
  grandRow: { borderTopWidth: 1, borderTopColor: Admin.divider, paddingTop: 9, marginTop: 3 },
  grandLabel: { fontSize: 14, fontWeight: "800", color: Admin.text },
  grandValue: { fontSize: 15, fontWeight: "800", color: Admin.red },
  payRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
  payText: { fontSize: 12, fontWeight: "700" },

  address: { fontSize: 12.5, color: Admin.text, lineHeight: 18 },
  contactRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  closedNote: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 40, borderRadius: 10, backgroundColor: Admin.divider,
  },
  closedText: { fontSize: 12.5, fontWeight: "700", color: Admin.textMuted },

  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 44 },
  emptyText: { fontSize: 13, color: Admin.textMuted },
});
