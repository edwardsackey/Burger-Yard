import { Admin } from "@/constants/admin-theme";
import { useResponsive } from "@/hooks/use-responsive";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, FadeIn, Icon, type IconName } from "./ui";

/** Page title, subtitle and whatever controls the screen needs on the right. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const { isDesktop } = useResponsive();
  return (
    <FadeIn>
      <View style={[styles.topBar, !isDesktop && styles.topBarStacked]}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children ? (
          <View style={[styles.controls, !isDesktop && styles.controlsWrap]}>
            {children}
          </View>
        ) : null}
      </View>
    </FadeIn>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const { isPhone } = useResponsive();
  return (
    <View style={[styles.search, isPhone && styles.searchPhone]}>
      <Icon name="search" size={15} color={Admin.textFaint} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={Admin.textFaint}
        value={value}
        onChangeText={onChange}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange("")} accessibilityLabel="Clear search">
          <Icon name="x" size={14} color={Admin.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

export type StatSpec = {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  icon: IconName;
};

/** The stat card strip every admin screen opens with. */
export function StatRow({ stats }: { stats: StatSpec[] }) {
  const { statColumns } = useResponsive();
  const columns = Math.min(statColumns, stats.length);

  return (
    <View style={styles.grid}>
      {stats.map((s, i) => (
        <FadeIn
          key={s.label}
          delay={60 * i}
          style={[styles.cell, { width: `${100 / columns}%` as const }]}
        >
          <Card style={styles.statCard}>
            <View style={styles.statHead}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <View style={styles.statIcon}>
                <Icon name={s.icon} size={14} color={Admin.red} />
              </View>
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            {s.delta ? (
              <View style={styles.trendRow}>
                <View style={styles.trendPill}>
                  <Icon name="arrow-up-right" size={11} color={Admin.green} />
                  <Text style={styles.trendText}>{s.delta}</Text>
                </View>
                {s.hint ? <Text style={styles.trendSub}>{s.hint}</Text> : null}
              </View>
            ) : s.hint ? (
              <Text style={styles.hint}>{s.hint}</Text>
            ) : null}
          </Card>
        </FadeIn>
      ))}
    </View>
  );
}

/** Row of filter chips shared by the list screens. */
export function FilterTabs({
  options,
  value,
  onChange,
  counts,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <View style={styles.tabsRow}>
      {options.map((name) => {
        const active = value === name;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{name}</Text>
            {counts ? (
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, active && { color: "#FFFFFF" }]}>
                  {counts[name] ?? 0}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 16 },
  topBarStacked: { flexDirection: "column", alignItems: "stretch" },
  title: { fontSize: 24, fontWeight: "800", color: Admin.text },
  subtitle: { fontSize: 12.5, color: Admin.textMuted, marginTop: 4 },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  controlsWrap: { flexWrap: "wrap", marginTop: 12 },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Admin.surface,
    borderWidth: 1,
    borderColor: Admin.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: 250,
  },
  searchPhone: { flex: 1, minWidth: 160, width: "auto" },
  searchInput: { flex: 1, fontSize: 13, color: Admin.text, outlineStyle: "none" } as object,

  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -7 },
  cell: { paddingHorizontal: 7, paddingBottom: 14 },
  statCard: { padding: 16 },
  statHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statLabel: { fontSize: 12.5, color: Admin.textMuted, flex: 1 },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 24, fontWeight: "800", color: Admin.text, marginTop: 12 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Admin.greenSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendText: { fontSize: 11, fontWeight: "700", color: Admin.green },
  trendSub: { fontSize: 11, color: Admin.textFaint },
  hint: { fontSize: 11.5, color: Admin.textFaint, marginTop: 10 },

  tabsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: Admin.surface,
    borderWidth: 1,
    borderColor: Admin.border,
  },
  tabBtnActive: { backgroundColor: Admin.ink, borderColor: Admin.ink },
  tabText: { fontSize: 12.5, fontWeight: "600", color: Admin.textMuted },
  tabTextActive: { color: "#FFFFFF" },
  tabCount: {
    minWidth: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: Admin.divider,
    alignItems: "center",
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  tabCountText: { fontSize: 10.5, fontWeight: "700", color: Admin.textMuted },

  screen: { flex: 1, backgroundColor: Admin.canvas },
  scroll: { padding: 24, gap: 18 },
  scrollPhone: { padding: 14, gap: 14 },
});
