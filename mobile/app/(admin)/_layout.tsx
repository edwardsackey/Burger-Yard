import { NewOrderAlert } from "@/components/admin/new-order-alert";
import { Icon, type IconName } from "@/components/admin/ui";
import { Admin, SIDEBAR_WIDTH } from "@/constants/admin-theme";
import { BRAND } from "@/constants/menu-catalog";
import { HOME_FOR, useAdminSession } from "@/context/AdminSession";
import { NewOrdersProvider, useNewOrders } from "@/context/NewOrdersContext";
import { useResponsive } from "@/hooks/use-responsive";
import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NATIVE = Platform.OS !== "web";

type NavItem = {
  name: string;
  screen: string;
  route: string;
  icon: IconName;
  badge?: number;
};

const NAV: NavItem[] = [
  { name: "Dashboard", screen: "dashboard", route: "/(admin)/dashboard", icon: "grid" },
  { name: "Orders", screen: "orders", route: "/(admin)/orders", icon: "shopping-bag" },
  { name: "Menu", screen: "menu", route: "/(admin)/menu", icon: "list" },
  { name: "Payments", screen: "payments", route: "/(admin)/payments", icon: "credit-card" },
  { name: "Reports", screen: "reports", route: "/(admin)/reports", icon: "bar-chart-2" },
  { name: "Customers", screen: "customers", route: "/(admin)/customers", icon: "users" },
  { name: "Settings", screen: "settings", route: "/(admin)/settings", icon: "settings" },
];

/** A nav row that slides its active pill in rather than snapping. */
function NavRow({
  item,
  active,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [active, anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [hovered ? "#1F1F1F" : "transparent", Admin.red],
  });

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <Animated.View style={[styles.navItem, { backgroundColor }]}>
        <Icon
          name={item.icon}
          size={17}
          color={active ? "#FFFFFF" : Admin.sidebarText}
        />
        <Text style={[styles.navText, active && styles.navTextActive]}>
          {item.name}
        </Text>
        {item.badge ? (
          <View style={[styles.navBadge, active && styles.navBadgeActive]}>
            <Text style={[styles.navBadgeText, active && { color: Admin.red }]}>
              {item.badge}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function SidebarBody({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, can, signOut } = useAdminSession();
  const { newCount } = useNewOrders();

  // Staff never see the owner-only rows at all.
  const visible = NAV.filter((item) => can(item.screen)).map((item) =>
    item.screen === "orders" && newCount > 0 ? { ...item, badge: newCount } : item,
  );

  return (
    <>
      <View>
        <View style={styles.logoRow}>
          <Image source={BRAND.logo} style={styles.logoImage} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>The Burger Yard</Text>
            <Text style={styles.brandSub}>Admin Console</Text>
          </View>
        </View>

        <Text style={styles.menuLabel}>MENU</Text>
        <View style={styles.navList}>
          {visible.map((item) => (
            <NavRow
              key={item.name}
              item={item}
              // match the last path segment, not a loose substring: "menu"
              // used to light up on any route containing those letters
              active={pathname.split("/").filter(Boolean).pop() === item.screen}
              onPress={() => {
                router.push(item.route as never);
                onNavigate();
              }}
            />
          ))}
        </View>

        {user?.role === "staff" && (
          <View style={styles.roleNote}>
            <Icon name="lock" size={12} color={Admin.sidebarMuted} />
            <Text style={styles.roleNoteText}>
              Sales and reporting are limited to the owner.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sidebarFooter}>
        <Pressable
          onPress={() => {
            signOut();
            router.replace("/admin-auth");
            onNavigate();
          }}
          style={styles.settingsRow}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Icon name="log-out" size={16} color={Admin.sidebarText} />
          <Text style={styles.navText}>Sign out</Text>
        </Pressable>

        <View style={styles.managerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.initials ?? "--"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.managerName}>{user?.name ?? "Signed out"}</Text>
            <Text style={styles.managerRole}>{user?.title ?? ""}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

export default function AdminLayout() {
  const { isDesktop, width } = useResponsive();
  const { user, can } = useAdminSession();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useRef(new Animated.Value(0)).current;

  const screen = pathname.split("/").filter(Boolean).pop() ?? "";

  // Closing the drawer when the viewport grows avoids it being stuck open
  // behind the permanent sidebar after a rotate or resize.
  useEffect(() => {
    if (isDesktop && drawerOpen) setDrawerOpen(false);
  }, [isDesktop, drawerOpen]);

  useEffect(() => {
    Animated.timing(drawer, {
      toValue: drawerOpen ? 1 : 0,
      duration: drawerOpen ? 260 : 200,
      easing: drawerOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
  }, [drawerOpen, drawer]);

  const translateX = drawer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH - 8, 0],
  });

  // The guard, not just the hidden nav row. Hiding the link stops it being
  // clicked; this stops the screen being reached by typing its URL, following
  // a stale link, or restoring a tab.
  if (!user) return <Redirect href="/admin-auth" />;
  if (screen && !can(screen)) {
    return <Redirect href={HOME_FOR[user.role] as never} />;
  }

  return (
    <NewOrdersProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.row}>
          {isDesktop && (
            <View style={styles.sidebar}>
              <SidebarBody onNavigate={() => {}} />
            </View>
          )}

          <View style={styles.content}>
            {!isDesktop && (
              <View style={styles.mobileBar}>
                <Pressable
                  onPress={() => setDrawerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open menu"
                  style={styles.hamburger}
                >
                  <Icon name="menu" size={20} color={Admin.text} />
                </Pressable>
                <View style={styles.mobileBrandRow}>
                  <Image source={BRAND.logo} style={styles.logoImageSm} resizeMode="contain" />
                  <Text style={styles.mobileBrand}>Admin Console</Text>
                </View>
              </View>
            )}

            <Slot />
          </View>
        </View>

        {/* Drawer overlays the content below the desktop breakpoint */}
        {!isDesktop && drawerOpen && (
          <View style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[styles.scrim, { opacity: drawer }]}
              pointerEvents="auto"
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setDrawerOpen(false)}
                accessibilityLabel="Close menu"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.sidebar,
                styles.drawer,
                { transform: [{ translateX }], maxWidth: Math.min(SIDEBAR_WIDTH, width - 48) },
              ]}
            >
              <SidebarBody onNavigate={() => setDrawerOpen(false)} />
            </Animated.View>
          </View>
        )}

        <NewOrderAlert />
      </SafeAreaView>
    </NewOrdersProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Admin.sidebar },
  row: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Admin.sidebar,
    padding: 18,
    justifyContent: "space-between",
    borderRightWidth: 1,
    borderRightColor: Admin.sidebarBorder,
  },
  drawer: { position: "absolute", top: 0, bottom: 0, left: 0, zIndex: 2 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },

  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },
  logoImageSm: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  brandTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  brandSub: { color: Admin.sidebarMuted, fontSize: 10, marginTop: 1 },

  menuLabel: {
    fontSize: 10,
    color: Admin.sidebarMuted,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  navList: { gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  navText: { fontSize: 13, fontWeight: "600", color: Admin.sidebarText, flex: 1 },
  navTextActive: { color: "#FFFFFF" },
  navBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 6,
    backgroundColor: Admin.red,
    alignItems: "center",
    justifyContent: "center",
  },
  navBadgeActive: { backgroundColor: "#FFFFFF" },
  navBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },

  roleNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 18,
    padding: 11,
    borderRadius: 9,
    backgroundColor: "#1C1C1C",
  },
  roleNoteText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: Admin.sidebarMuted,
  },
  sidebarFooter: { gap: 14 },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  managerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Admin.sidebarBorder,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  managerName: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  managerRole: { color: Admin.sidebarMuted, fontSize: 11, marginTop: 1 },

  content: { flex: 1, backgroundColor: Admin.canvas },
  mobileBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Admin.surface,
    borderBottomWidth: 1,
    borderBottomColor: Admin.border,
  },
  hamburger: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Admin.divider,
  },
  mobileBrandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mobileBrand: { fontSize: 14, fontWeight: "700", color: Admin.text },
});
