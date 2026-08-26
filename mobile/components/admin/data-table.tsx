import { Admin } from "@/constants/admin-theme";
import { useResponsive } from "@/hooks/use-responsive";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Icon } from "./ui";

export type Column<T> = {
  key: string;
  header: string;
  flex?: number;
  width?: number;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  /** Shown on the phone card. Omit to hide this column there. */
  mobile?: "title" | "meta" | "trailing" | "hidden";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowPress?: (row: T) => void;
  emptyText?: string;
};

/**
 * One table that reads on a monitor and on a phone. Above the phone breakpoint
 * it lays out columns; below it, each row becomes a card, because six columns
 * squeezed into 375px is unreadable no matter how it is styled.
 */
export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowPress,
  emptyText = "Nothing to show yet.",
}: Props<T>) {
  const { isPhone } = useResponsive();

  if (rows.length === 0) {
    return (
      <Card style={styles.empty}>
        <Icon name="inbox" size={22} color={Admin.textFaint} />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </Card>
    );
  }

  if (isPhone) {
    const title = columns.find((c) => c.mobile === "title") ?? columns[0];
    const trailing = columns.find((c) => c.mobile === "trailing");
    const meta = columns.filter((c) => c.mobile === "meta");

    return (
      <Card style={styles.cardFlush}>
        {rows.map((row, i) => (
          <Pressable
            key={keyExtractor(row)}
            onPress={onRowPress ? () => onRowPress(row) : undefined}
            style={[styles.mobileRow, i === rows.length - 1 && styles.lastRow]}
          >
            <View style={styles.mobileTop}>
              <View style={{ flex: 1 }}>{title.render(row)}</View>
              {trailing ? trailing.render(row) : null}
            </View>
            {meta.length > 0 && (
              <View style={styles.mobileMeta}>
                {meta.map((c, idx) => (
                  <View key={c.key} style={styles.metaItem}>
                    {idx > 0 && <Text style={styles.metaDot}>·</Text>}
                    {c.render(row)}
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        ))}
      </Card>
    );
  }

  return (
    <Card style={styles.cardFlush}>
      <View style={styles.header}>
        {columns.map((c) => (
          <Text
            key={c.key}
            style={[
              styles.th,
              c.width ? { width: c.width } : { flex: c.flex ?? 1 },
              c.align === "right" && styles.right,
            ]}
          >
            {c.header}
          </Text>
        ))}
      </View>

      {rows.map((row, i) => (
        <Pressable
          key={keyExtractor(row)}
          onPress={onRowPress ? () => onRowPress(row) : undefined}
          style={[styles.row, i === rows.length - 1 && styles.lastRow]}
        >
          {columns.map((c) => (
            <View
              key={c.key}
              style={[
                c.width ? { width: c.width } : { flex: c.flex ?? 1 },
                c.align === "right" && styles.alignRight,
              ]}
            >
              {c.render(row)}
            </View>
          ))}
        </Pressable>
      ))}
    </Card>
  );
}

/** Plain cell text, so screens do not each restyle the same thing. */
export function Cell({
  children,
  strong,
  muted,
  color,
}: {
  children: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
  color?: string;
}) {
  return (
    <Text
      style={[
        styles.cell,
        strong && styles.cellStrong,
        muted && styles.cellMuted,
        color ? { color } : null,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  cardFlush: { padding: 0, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#FBFCFD",
    borderBottomWidth: 1,
    borderBottomColor: Admin.border,
  },
  th: {
    fontSize: 10,
    fontWeight: "700",
    color: Admin.textFaint,
    letterSpacing: 0.6,
  },
  right: { textAlign: "right" },
  alignRight: { alignItems: "flex-end" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Admin.divider,
  },
  lastRow: { borderBottomWidth: 0 },

  mobileRow: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Admin.divider,
  },
  mobileTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  mobileMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaDot: { color: Admin.textFaint, fontSize: 12 },

  cell: { fontSize: 13, color: Admin.textMuted },
  cellStrong: { fontWeight: "700", color: Admin.text },
  cellMuted: { color: Admin.textFaint, fontSize: 12 },

  empty: { alignItems: "center", gap: 10, paddingVertical: 44 },
  emptyText: { fontSize: 13, color: Admin.textMuted },
});

export default DataTable;
