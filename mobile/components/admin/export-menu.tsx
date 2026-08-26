import { Admin } from "@/constants/admin-theme";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { exportCsv, exportPdf, type ExportTable } from "./export";
import { Button, Icon } from "./ui";

/**
 * Export button with a CSV / PDF choice. Both write a file the user keeps:
 * CSV downloads straight to disk, PDF goes through the browser's print dialog
 * where "Save as PDF" picks the folder.
 */
export function ExportButton({
  build,
  label = "Export",
}: {
  build: () => ExportTable;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const run = (kind: "csv" | "pdf") => {
    setOpen(false);
    const table = build();
    if (kind === "csv") exportCsv(table);
    else exportPdf(table);
  };

  return (
    <>
      <Button label={label} icon="download" onPress={() => setOpen(true)} />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Export as</Text>

            <Pressable style={styles.option} onPress={() => run("csv")}>
              <View style={styles.optionIcon}>
                <Icon name="file-text" size={17} color={Admin.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>CSV spreadsheet</Text>
                <Text style={styles.optionSub}>
                  Downloads to your computer, opens in Excel or Sheets
                </Text>
              </View>
              <Icon name="download" size={16} color={Admin.textFaint} />
            </Pressable>

            <Pressable style={styles.option} onPress={() => run("pdf")}>
              <View style={styles.optionIcon}>
                <Icon name="printer" size={17} color={Admin.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>PDF document</Text>
                <Text style={styles.optionSub}>
                  Opens the print dialog, then choose Save as PDF to pick a folder
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={Admin.textFaint} />
            </Pressable>

            <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Admin.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Admin.border,
    padding: 18,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: "800", color: Admin.text, marginBottom: 4 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Admin.border,
    backgroundColor: "#FBFCFD",
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Admin.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { fontSize: 13.5, fontWeight: "700", color: Admin.text },
  optionSub: { fontSize: 11.5, color: Admin.textMuted, marginTop: 3, lineHeight: 16 },
  cancel: { alignItems: "center", paddingVertical: 10, marginTop: 2 },
  cancelText: { fontSize: 13, fontWeight: "700", color: Admin.textMuted },
});

export default ExportButton;
