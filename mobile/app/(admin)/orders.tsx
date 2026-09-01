import { apiFetch } from "@/api";
import {
  Button,
  Card,
  FadeIn,
  Icon,
  StatusPill,
  type IconName,
} from "@/components/admin/ui";
import { useDialog } from "@/components/admin/dialog";
import { Field, ModalSheet, fieldStyles } from "@/components/admin/modal-sheet";
import { Admin } from "@/constants/admin-theme";
import { imageForName } from "@/constants/menu-catalog";
import { useAdminSession } from "@/context/AdminSession";
import { useResponsive } from "@/hooks/use-responsive";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const BACKEND_FLOW = ["NEW", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"] as const;

const STATUS_TO_DISPLAY: Record<string, Status> = {
  NEW: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PAYMENT_TO_DISPLAY: Record<string, string> = {
  MOMO: "MoMo",
  CARD: "Card",
  CASH: "Cash",
};

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
  riderName: string;
  riderPhone: string;
  riderVehicle: string;
};

/** "just now" / "N min ago" / "N hr ago" / "N days ago". */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function mapOrder(o: any): Order {
  const extrasText = (extras: { name: string; price: number }[] | null) =>
    extras && extras.length
      ? extras.map((e) => `+ ${e.name} (GHS ${e.price})`).join(", ")
      : "";

  return {
    id: `#${o.id}`,
    timeAgo: timeAgo(o.createdAt),
    status: STATUS_TO_DISPLAY[o.status] ?? "New",
    customer: o.user?.name ?? "Customer",
    location: o.address?.label ?? o.landmark ?? "—",
    summary: o.orderItems
      .map((oi: any) => (oi.quantity > 1 ? `${oi.quantity}x ${oi.menuItem.name}` : oi.menuItem.name))
      .join(", "),
    total: `GHS ${o.total_amount}`,
    payment: PAYMENT_TO_DISPLAY[o.paymentMethod] ?? o.paymentMethod,
    phone: o.phone,
    addressDetails: [o.address?.label, o.landmark ?? o.address?.details].filter(Boolean).join(" · ") || "—",
    items: o.orderItems.map((oi: any) => ({
      qty: `${oi.quantity}x`,
      name: oi.menuItem.name,
      modifier: extrasText(oi.extras),
      price: `GHS ${oi.price_at_time_of_order * oi.quantity}`,
    })),
    subtotal: `GHS ${o.total_amount - o.deliveryFee}`,
    delivery: `GHS ${o.deliveryFee}`,
    paid: o.paid,
    riderName: o.riderName ?? "",
    riderPhone: o.riderPhone ?? "",
    riderVehicle: o.riderVehicle ?? "",
  };
}

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

// Live-updating without a websocket — good enough for order volume this size.
const POLL_MS = 8000;

export default function AdminOrdersScreen() {
  const { isPhone, isDesktop } = useResponsive();
  const { confirm, notify } = useDialog();
  const { orderId: orderIdParam } = useLocalSearchParams<{ orderId?: string }>();
  const { riders, loadRiders, addRider } = useAdminSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openOnPhone, setOpenOnPhone] = useState(false);
  const busyIds = useRef(new Set<string>());
  // Mirrors busyIds into render-visible state so the action button actually
  // disables — without this, a fast double-tap can land on the *next*
  // stage's button the instant it swaps into the same screen position,
  // silently skipping a step the admin never meant to take. The cooldown
  // after completion (see pushStatus) covers the same risk for a double-tap
  // that lands just after the request finishes.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRiders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep-linked from Dashboard's "Recent orders" (or anywhere else that
  // passes ?orderId=) — jump straight to that order's detail, not just the
  // Orders screen in general.
  useEffect(() => {
    if (!orderIdParam) return;
    setSelectedTab("All");
    setSelectedOrderId(`#${orderIdParam}`);
    setOpenOnPhone(true);
  }, [orderIdParam]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      apiFetch("/admin/orders")
        .then((data) => {
          if (cancelled) return;
          setOrders(data.map(mapOrder));
        })
        .catch(() => {
          // Transient network hiccup — the next poll retries.
        })
        .finally(() => setLoading(false));
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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

  const [riderDraft, setRiderDraft] = useState({ name: "", phone: "", vehicle: "" });
  const [savingRider, setSavingRider] = useState(false);
  // Never pre-filled from the order — deliveryCode is deliberately excluded
  // from every admin-facing query, so this only ever holds what the admin
  // just typed after asking the customer for it.
  const [deliveryCodeInput, setDeliveryCodeInput] = useState("");

  // Re-seed the draft only when the *selected order* changes, not on every
  // poll refresh — otherwise an admin mid-typing gets overwritten every 8s.
  useEffect(() => {
    if (current) {
      setRiderDraft({
        name: current.riderName,
        phone: current.riderPhone,
        vehicle: current.riderVehicle,
      });
      setDeliveryCodeInput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const saveRiderDetails = async () => {
    if (!current) return;
    setSavingRider(true);
    try {
      const numericId = current.id.replace("#", "");
      await apiFetch(`/admin/orders/${numericId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          riderName: riderDraft.name,
          riderPhone: riderDraft.phone,
          riderVehicle: riderDraft.vehicle,
        }),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === current.id
            ? { ...o, riderName: riderDraft.name, riderPhone: riderDraft.phone, riderVehicle: riderDraft.vehicle }
            : o,
        ),
      );
    } catch {
      // Left as-is — the admin can retry from the form.
    } finally {
      setSavingRider(false);
    }
  };

  const [addingRider, setAddingRider] = useState(false);
  const [newRider, setNewRider] = useState({ name: "", phone: "", vehicle: "" });
  const [creatingRider, setCreatingRider] = useState(false);

  const handleAddRider = async () => {
    if (!newRider.name.trim() || !newRider.phone.trim()) return;
    setCreatingRider(true);
    try {
      const created = await addRider(newRider.name, newRider.phone, newRider.vehicle);
      if (created) {
        setRiderDraft({ name: created.name, phone: created.phone, vehicle: created.vehicle ?? "" });
        setNewRider({ name: "", phone: "", vehicle: "" });
        setAddingRider(false);
      }
    } finally {
      setCreatingRider(false);
    }
  };

  const pushStatus = async (id: string, backendStatus: string, extra?: Record<string, unknown>) => {
    if (busyIds.current.has(id)) return;
    busyIds.current.add(id);
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      const numericId = id.replace("#", "");
      await apiFetch(`/admin/orders/${numericId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: backendStatus, ...extra }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: STATUS_TO_DISPLAY[backendStatus] } : o)),
      );
      if (backendStatus === "COMPLETED") setDeliveryCodeInput("");
    } catch (error) {
      // A real rejection (e.g. wrong delivery code) needs to reach the
      // admin, not just silently leave the order as-is.
      notify({
        title: "Couldn't update status",
        message: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      busyIds.current.delete(id);
      // Keep the button disabled a little longer than the request itself —
      // otherwise a double-tap that lands right as the label swaps to the
      // next stage fires that next action immediately.
      setTimeout(() => {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 700);
    }
  };

  const advance = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const i = FLOW.indexOf(order.status as (typeof FLOW)[number]);
    if (i === -1 || i >= FLOW.length - 1) return;
    const nextStatus = BACKEND_FLOW[i + 1];
    if (nextStatus === "OUT_FOR_DELIVERY" && !order.riderName) {
      notify({
        title: "Assign a rider first",
        message: "Pick a rider in the RIDER DETAILS section before sending this order out for delivery.",
      });
      return;
    }
    if (nextStatus === "COMPLETED") {
      if (!/^\d{4}$/.test(deliveryCodeInput.trim())) {
        notify({
          title: "Enter the delivery code",
          message: "Ask the customer for their 4-digit delivery code before marking this delivered.",
        });
        return;
      }
      pushStatus(id, nextStatus, { deliveryCode: deliveryCodeInput.trim() });
      return;
    }
    pushStatus(id, nextStatus);
  };

  const decline = async (order: Order) => {
    const ok = await confirm({
      title: "Decline order",
      message: `Decline ${order.id} from ${order.customer}? They will be told it was refused.`,
      confirmLabel: "Decline",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (ok) await pushStatus(order.id, "CANCELLED");
  };

  const call = (order: Order) => Linking.openURL(`tel:+233${order.phone.replace(/^0/, "")}`);
  const whatsapp = (order: Order) =>
    Linking.openURL(`https://wa.me/233${order.phone.replace(/^0/, "")}`);

  const showDetail = isDesktop || (isPhone && openOnPhone) || (!isPhone && !isDesktop);

  const action = nextAction(current?.status ?? "Completed");
  const needsRiderToSendOut = current?.status === "Ready" && !current.riderName;
  const needsDeliveryCode =
    current?.status === "Out for delivery" && !/^\d{4}$/.test(deliveryCodeInput.trim());

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

      {current.status !== "New" && current.status !== "Cancelled" && (
        <>
          <View style={styles.divider} />
          <Text style={styles.blockLabel}>RIDER DETAILS</Text>
          <Text style={styles.riderHint}>
            Pick a saved rider — this shows up on the customer's tracking screen.
          </Text>

          <View style={styles.riderChips}>
            {riders.filter((r) => r.active).map((r) => {
              const selected = riderDraft.phone === r.phone && riderDraft.name === r.name;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setRiderDraft({ name: r.name, phone: r.phone, vehicle: r.vehicle ?? "" })}
                  style={[styles.riderChip, selected && styles.riderChipActive]}
                >
                  <Text style={[styles.riderChipText, selected && styles.riderChipTextActive]}>
                    {r.name}
                  </Text>
                  {r.vehicle ? (
                    <Text style={[styles.riderChipSub, selected && styles.riderChipTextActive]}>
                      {r.vehicle}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable onPress={() => setAddingRider(true)} style={styles.riderChipAdd}>
              <Icon name="plus" size={12} color={Admin.red} />
              <Text style={styles.riderChipAddText}>New rider</Text>
            </Pressable>
          </View>

          {riderDraft.name ? (
            <View style={styles.riderSelectedRow}>
              <Icon name="user-check" size={13} color={Admin.textMuted} />
              <Text style={styles.riderSelectedText}>
                {riderDraft.name} · {riderDraft.phone}
                {riderDraft.vehicle ? ` · ${riderDraft.vehicle}` : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.riderSelectedEmpty}>No rider assigned yet.</Text>
          )}

          <Button
            label={savingRider ? "Saving..." : "Save rider details"}
            icon="check"
            variant="secondary"
            size="sm"
            disabled={savingRider || !riderDraft.name}
            onPress={saveRiderDetails}
            style={{ marginTop: 10 }}
          />
        </>
      )}

      {current.status === "Out for delivery" && (
        <>
          <View style={styles.divider} />
          <Text style={styles.blockLabel}>DELIVERY CODE</Text>
          <Text style={styles.riderHint}>
            Ask the customer for their 4-digit code to confirm the handoff —
            it's never shown here, only checked.
          </Text>
          <TextInput
            style={styles.deliveryCodeField}
            placeholder="• • • •"
            placeholderTextColor={Admin.textFaint}
            keyboardType="number-pad"
            maxLength={4}
            value={deliveryCodeInput}
            onChangeText={(t) => setDeliveryCodeInput(t.replace(/\D/g, ""))}
          />
        </>
      )}

      <View style={styles.actionRow}>
        {current.status === "New" && (
          <Button label="Decline" variant="danger" icon="x"
            disabled={pendingIds.has(current.id)}
            onPress={() => decline(current)} style={{ flex: 1 }} />
        )}
        {action ? (
          <Button label={action.label} icon={action.icon}
            disabled={pendingIds.has(current.id) || needsRiderToSendOut || needsDeliveryCode}
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
      {needsRiderToSendOut && (
        <Text style={styles.riderRequiredHint}>
          Assign a rider above before sending this order out.
        </Text>
      )}
      {needsDeliveryCode && (
        <Text style={styles.riderRequiredHint}>
          Enter the customer's 4-digit delivery code above to mark this delivered.
        </Text>
      )}
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
              {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={Admin.red} />
              ) : filtered.length === 0 ? (
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
                            <View style={styles.orderBottomLeft}>
                              <Text style={styles.orderTotal}>{o.total}</Text>
                              <View
                                style={[
                                  styles.payBadge,
                                  o.paid
                                    ? styles.payBadgePaid
                                    : o.payment === "Cash"
                                      ? styles.payBadgeCash
                                      : styles.payBadgePending,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.payBadgeText,
                                    o.paid
                                      ? styles.payBadgeTextPaid
                                      : o.payment === "Cash"
                                        ? styles.payBadgeTextCash
                                        : styles.payBadgeTextPending,
                                  ]}
                                >
                                  {o.paid ? "Paid" : o.payment === "Cash" ? "COD" : "Pending"}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.orderTime}>{o.timeAgo}</Text>
                          </View>

                          {o.status === "New" && (
                            <View style={styles.miniRow}>
                              <Button label="Decline" variant="danger" size="sm"
                                disabled={pendingIds.has(o.id)}
                                onPress={() => decline(o)} style={{ flex: 1 }} />
                              <Button label="Accept" size="sm"
                                disabled={pendingIds.has(o.id)}
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

      <ModalSheet
        visible={addingRider}
        title="Add a rider"
        subtitle="Saved to the roster so it can be picked for any order."
        onClose={() => setAddingRider(false)}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setAddingRider(false)} />
            <Button
              label={creatingRider ? "Adding..." : "Add rider"}
              disabled={creatingRider}
              onPress={handleAddRider}
            />
          </>
        }
      >
        <Field label="Full name">
          <TextInput
            style={fieldStyles.input}
            value={newRider.name}
            onChangeText={(t) => setNewRider((d) => ({ ...d, name: t }))}
            placeholder="e.g. Kojo Mensah"
            placeholderTextColor={Admin.textFaint}
            autoCapitalize="words"
          />
        </Field>
        <Field label="Phone number">
          <TextInput
            style={fieldStyles.input}
            value={newRider.phone}
            onChangeText={(t) => setNewRider((d) => ({ ...d, phone: t }))}
            placeholder="0244 112 233"
            placeholderTextColor={Admin.textFaint}
            keyboardType="phone-pad"
          />
        </Field>
        <Field label="Vehicle (optional)">
          <TextInput
            style={fieldStyles.input}
            value={newRider.vehicle}
            onChangeText={(t) => setNewRider((d) => ({ ...d, vehicle: t }))}
            placeholder="e.g. Red Honda bike"
            placeholderTextColor={Admin.textFaint}
          />
        </Field>
      </ModalSheet>
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
  orderBottomLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderTotal: { fontSize: 14, fontWeight: "800", color: Admin.red },
  orderTime: { fontSize: 11.5, color: Admin.textFaint },
  payBadge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 },
  payBadgePaid: { backgroundColor: Admin.greenSoft },
  payBadgeCash: { backgroundColor: Admin.divider },
  payBadgePending: { backgroundColor: "#FEF3C7" },
  payBadgeText: { fontSize: 10, fontWeight: "700" },
  payBadgeTextPaid: { color: Admin.green },
  payBadgeTextCash: { color: Admin.textMuted },
  payBadgeTextPending: { color: "#B45309" },
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
  riderHint: { fontSize: 11.5, color: Admin.textMuted, marginTop: -4, marginBottom: 10 },
  deliveryCodeField: {
    height: 44, borderRadius: 10, borderWidth: 1, borderColor: Admin.border,
    backgroundColor: Admin.surface, paddingHorizontal: 14, fontSize: 16,
    fontWeight: "700", letterSpacing: 6, color: Admin.text, width: 120,
  },
  riderChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  riderChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Admin.border, backgroundColor: Admin.surface,
  },
  riderChipActive: { backgroundColor: Admin.red, borderColor: Admin.red },
  riderChipText: { fontSize: 12.5, fontWeight: "700", color: Admin.text },
  riderChipTextActive: { color: "#FFFFFF" },
  riderChipSub: { fontSize: 10.5, color: Admin.textMuted, marginTop: 1 },
  riderChipAdd: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Admin.red, borderStyle: "dashed",
  },
  riderChipAddText: { fontSize: 12.5, fontWeight: "700", color: Admin.red },
  riderSelectedRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  riderSelectedText: { fontSize: 12.5, color: Admin.text, fontWeight: "600" },
  riderSelectedEmpty: { fontSize: 12, color: Admin.textFaint, marginTop: 12 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  closedNote: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 40, borderRadius: 10, backgroundColor: Admin.divider,
  },
  closedText: { fontSize: 12.5, fontWeight: "700", color: Admin.textMuted },
  riderRequiredHint: {
    fontSize: 11.5, color: Admin.red, textAlign: "center", marginTop: 8,
  },

  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 44 },
  emptyText: { fontSize: 13, color: Admin.textMuted },
});
