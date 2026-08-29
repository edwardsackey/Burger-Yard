import { useDialog } from "@/components/admin/dialog";
import { Field, ModalSheet, fieldStyles } from "@/components/admin/modal-sheet";
import { PageHeader, styles as parts } from "@/components/admin/screen-parts";
import {
  Button,
  Card,
  FadeIn,
  Icon,
  IconButton,
  SectionTitle,
  Toggle,
} from "@/components/admin/ui";
import { Admin } from "@/constants/admin-theme";
import { BRAND } from "@/constants/menu-catalog";
import { useAdminSession, type Rider, type StaffMember } from "@/context/AdminSession";
import { useResponsive } from "@/hooks/use-responsive";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AdminSettingsScreen() {
  const { isPhone } = useResponsive();
  const { confirm, notify } = useDialog();
  const {
    user,
    staff,
    loadStaff,
    addStaff,
    updateStaff,
    removeStaff,
    regeneratePin,
    riders,
    loadRiders,
    addRider,
    updateRider,
    removeRider,
  } = useAdminSession();

  const isOwner = user?.role === "owner";

  useEffect(() => {
    if (isOwner) {
      loadStaff();
      loadRiders();
    }
  }, [isOwner, loadStaff, loadRiders]);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  /** The member + freshly (re)generated PIN being shown after onboarding.
   * The PIN only ever exists here, right after being issued — it's hashed
   * server-side and can never be retrieved again after this. */
  const [invite, setInvite] = useState<{ member: StaffMember; pin: string } | null>(null);

  const inviteText = (member: StaffMember, pin: string) =>
    `Hi ${member.name.split(" ")[0]}, you have been added to The Burger Yard admin console.\n\n` +
    `Open the console, choose "Log in as Staff", pick your name and enter this code:\n\n` +
    `${pin}\n\n` +
    `Keep it to yourself. It only works for your name.`;

  const sendInvite = (member: StaffMember, pin: string, via: "whatsapp" | "sms") => {
    const body = encodeURIComponent(inviteText(member, pin));
    const intl = `233${member.phone.replace(/^0/, "")}`;
    Linking.openURL(
      via === "whatsapp" ? `https://wa.me/${intl}?text=${body}` : `sms:${member.phone}?body=${body}`,
    );
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      notify({ title: "Name required", message: "Enter the worker's name." });
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      notify({
        title: "Check the phone number",
        message: "Enter the number the invite should go to.",
      });
      return;
    }
    const created = await addStaff(name, phone);
    if (!created) {
      notify({
        title: "Could not add",
        message: "Please try again.",
      });
      return;
    }
    setName("");
    setPhone("");
    setAdding(false);
    setInvite(created);
  };

  const confirmRemove = async (member: StaffMember) => {
    const ok = await confirm({
      title: "Remove worker",
      message: `Remove ${member.name} for good? Their code stops working and they are signed out.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) await removeStaff(member.id);
  };

  /** Blocking keeps the record but refuses the code at sign in. */
  const toggleBlock = async (member: StaffMember) => {
    if (member.active) {
      const ok = await confirm({
        title: `Block ${member.name.split(" ")[0]}?`,
        message:
          "Their code stops working immediately and their name is hidden from the sign in list. You can unblock them at any time.",
        confirmLabel: "Block",
        destructive: true,
        icon: "slash",
      });
      if (ok) await updateStaff(member.id, { active: false });
    } else {
      await updateStaff(member.id, { active: true });
    }
  };

  // The PIN is hashed server-side, so there's no "resend the same code" —
  // sending an invite always issues a fresh one.
  const newCode = async (member: StaffMember) => {
    const pin = await regeneratePin(member.id);
    if (pin) setInvite({ member, pin });
  };

  const [addingRider, setAddingRider] = useState(false);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderVehicle, setRiderVehicle] = useState("");

  const handleAddRider = async () => {
    if (!riderName.trim()) {
      notify({ title: "Name required", message: "Enter the rider's name." });
      return;
    }
    if (riderPhone.replace(/\D/g, "").length < 9) {
      notify({ title: "Check the phone number", message: "Enter a valid rider phone number." });
      return;
    }
    const created = await addRider(riderName, riderPhone, riderVehicle);
    if (!created) {
      notify({ title: "Could not add", message: "Please try again." });
      return;
    }
    setRiderName("");
    setRiderPhone("");
    setRiderVehicle("");
    setAddingRider(false);
  };

  const toggleRiderActive = (rider: Rider) => updateRider(rider.id, { active: !rider.active });

  const confirmRemoveRider = async (rider: Rider) => {
    const ok = await confirm({
      title: "Remove rider",
      message: `Remove ${rider.name} from the roster? They won't be selectable for future deliveries.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) await removeRider(rider.id);
  };

  return (
    <View style={parts.screen}>
      <ScrollView
        contentContainerStyle={[parts.scroll, isPhone && parts.scrollPhone]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title="Settings"
          subtitle={isOwner ? "Business, team and access" : "Your account"}
        />

        {/* Profile */}
        <FadeIn>
          <Card>
            <SectionTitle title="Signed in as" />
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.initials ?? "--"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileRole}>{user?.title}</Text>
              </View>
              <View style={[styles.roleTag, isOwner && styles.roleTagOwner]}>
                <Icon
                  name={isOwner ? "shield" : "user"}
                  size={12}
                  color={isOwner ? Admin.red : Admin.textMuted}
                />
                <Text style={[styles.roleTagText, isOwner && { color: Admin.red }]}>
                  {isOwner ? "Manager" : "Staff"}
                </Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {/* Team - owner only */}
        {isOwner && (
          <FadeIn delay={110}>
            <Card>
              <SectionTitle
                title="Team"
                subtitle={`${staff.filter((m) => m.active).length} of ${staff.length} can sign in · each has their own code`}
                right={<Button label="Add worker" icon="user-plus" size="sm" onPress={() => setAdding(true)} />}
              />

              {staff.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Icon name="users" size={22} color={Admin.textFaint} />
                  <Text style={styles.emptyText}>
                    Nobody onboarded yet. Add a worker to send their first invite.
                  </Text>
                </View>
              ) : (
                staff.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 130 }}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {!member.active && (
                          <View style={styles.blockedTag}>
                            <Icon name="slash" size={9} color={Admin.red} />
                            <Text style={styles.blockedTagText}>Blocked</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberMeta}>
                        {member.phone} · invited{" "}
                        {new Date(member.invitedAt).toLocaleDateString([], {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>

                    <View style={styles.memberActions}>
                      <Toggle
                        value={member.active}
                        onChange={() => toggleBlock(member)}
                        label={`${member.name} can sign in`}
                      />
                      <IconButton
                        name="send"
                        label={`Send a new code to ${member.name}`}
                        onPress={() => newCode(member)}
                      />
                      <IconButton
                        name="trash-2"
                        tone="danger"
                        label={`Remove ${member.name}`}
                        onPress={() => confirmRemove(member)}
                      />
                    </View>
                  </View>
                ))
              )}
            </Card>
          </FadeIn>
        )}

        {/* Riders - owner only */}
        {isOwner && (
          <FadeIn delay={135}>
            <Card>
              <SectionTitle
                title="Riders"
                subtitle={`${riders.filter((r) => r.active).length} of ${riders.length} available for assignment`}
                right={<Button label="Add rider" icon="user-plus" size="sm" onPress={() => setAddingRider(true)} />}
              />

              {riders.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Icon name="truck" size={22} color={Admin.textFaint} />
                  <Text style={styles.emptyText}>
                    No riders saved yet. Add one so it can be picked when assigning a delivery.
                  </Text>
                </View>
              ) : (
                riders.map((rider) => (
                  <View key={rider.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {rider.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 130 }}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{rider.name}</Text>
                        {!rider.active && (
                          <View style={styles.blockedTag}>
                            <Icon name="slash" size={9} color={Admin.red} />
                            <Text style={styles.blockedTagText}>Hidden</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberMeta}>
                        {rider.phone}
                        {rider.vehicle ? ` · ${rider.vehicle}` : ""}
                      </Text>
                    </View>

                    <View style={styles.memberActions}>
                      <Toggle
                        value={rider.active}
                        onChange={() => toggleRiderActive(rider)}
                        label={`${rider.name} available for assignment`}
                      />
                      <IconButton
                        name="trash-2"
                        tone="danger"
                        label={`Remove ${rider.name}`}
                        onPress={() => confirmRemoveRider(rider)}
                      />
                    </View>
                  </View>
                ))
              )}
            </Card>
          </FadeIn>
        )}

        {/* Business */}
        <FadeIn delay={160}>
          <Card>
            <SectionTitle title="Business" />
            <View style={styles.bizRow}>
              <Image source={BRAND.logo} style={styles.bizLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>The Burger Yard</Text>
                <Text style={styles.profileRole}>Ayeduase New Site · Kumasi</Text>
              </View>
            </View>
            <View style={styles.bizGrid}>
              <View style={styles.bizItem}>
                <Text style={styles.bizLabel}>Call line</Text>
                <Text style={styles.bizValue}>054 392 7440</Text>
              </View>
              <View style={styles.bizItem}>
                <Text style={styles.bizLabel}>WhatsApp</Text>
                <Text style={styles.bizValue}>027 891 6248</Text>
              </View>
              <View style={styles.bizItem}>
                <Text style={styles.bizLabel}>Currency</Text>
                <Text style={styles.bizValue}>GHS</Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {!isOwner && (
          <FadeIn delay={200}>
            <Card style={styles.staffNote}>
              <Icon name="lock" size={16} color={Admin.textMuted} />
              <Text style={styles.staffNoteText}>
                Sales, payments and reports are limited to the manager. Ask the
                owner if you need a figure from them.
              </Text>
            </Card>
          </FadeIn>
        )}
      </ScrollView>

      {/* Add worker */}
      <ModalSheet
        visible={adding}
        title="Add a worker"
        subtitle="They get a 4-digit code that only works for their name."
        onClose={() => setAdding(false)}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setAdding(false)} />
            <Button label="Create invite" onPress={handleAdd} />
          </>
        }
      >
        <Field label="Full name">
          <TextInput
            style={fieldStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ama Boakye"
            placeholderTextColor={Admin.textFaint}
            autoCapitalize="words"
          />
        </Field>
        <Field label="Phone number">
          <TextInput
            style={fieldStyles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="0244 112 233"
            placeholderTextColor={Admin.textFaint}
            keyboardType="phone-pad"
          />
        </Field>
        <Text style={styles.formHint}>
          The code is generated for them and checked against their name only, so
          one worker&apos;s code cannot sign in as another.
        </Text>
      </ModalSheet>

      {/* Add rider */}
      <ModalSheet
        visible={addingRider}
        title="Add a rider"
        subtitle="Saved to the roster so it can be picked on any order."
        onClose={() => setAddingRider(false)}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setAddingRider(false)} />
            <Button label="Add rider" onPress={handleAddRider} />
          </>
        }
      >
        <Field label="Full name">
          <TextInput
            style={fieldStyles.input}
            value={riderName}
            onChangeText={setRiderName}
            placeholder="e.g. Kojo Mensah"
            placeholderTextColor={Admin.textFaint}
            autoCapitalize="words"
          />
        </Field>
        <Field label="Phone number">
          <TextInput
            style={fieldStyles.input}
            value={riderPhone}
            onChangeText={setRiderPhone}
            placeholder="0244 112 233"
            placeholderTextColor={Admin.textFaint}
            keyboardType="phone-pad"
          />
        </Field>
        <Field label="Vehicle (optional)">
          <TextInput
            style={fieldStyles.input}
            value={riderVehicle}
            onChangeText={setRiderVehicle}
            placeholder="e.g. Red Honda bike"
            placeholderTextColor={Admin.textFaint}
          />
        </Field>
      </ModalSheet>

      {/* Invite, shown after onboarding or when resending */}
      <ModalSheet
        visible={invite !== null}
        title={`Invite for ${invite?.member.name ?? ""}`}
        subtitle="Send this to them. It is their only credential."
        onClose={() => setInvite(null)}
        footer={
          <>
            <Button label="Done" variant="secondary" onPress={() => setInvite(null)} />
            {invite ? (
              <Button
                label="Send on WhatsApp"
                icon="message-circle"
                onPress={() => sendInvite(invite.member, invite.pin, "whatsapp")}
              />
            ) : null}
          </>
        }
      >
        {invite && (
          <>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeDisplayLabel}>THEIR CODE</Text>
              <Text style={styles.codeDisplayValue}>{invite.pin}</Text>
              <Text style={styles.codeDisplayHint}>
                Works only when {invite.member.name.split(" ")[0]} is the selected name.
                Shown once — it can't be viewed again after you close this.
              </Text>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{inviteText(invite.member, invite.pin)}</Text>
            </View>

            <View style={styles.inviteActions}>
              <Button
                label="Send by SMS"
                icon="message-square"
                variant="secondary"
                size="sm"
                onPress={() => sendInvite(invite.member, invite.pin, "sms")}
                style={{ flex: 1 }}
              />
              <Button
                label="New code"
                icon="refresh-cw"
                variant="secondary"
                size="sm"
                onPress={() => newCode(invite.member)}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Admin.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: Admin.red },
  profileName: { fontSize: 15, fontWeight: "700", color: Admin.text },
  profileRole: { fontSize: 12, color: Admin.textMuted, marginTop: 3 },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Admin.divider,
  },
  roleTagOwner: { backgroundColor: Admin.redSoft },
  roleTagText: { fontSize: 11.5, fontWeight: "700", color: Admin.textMuted },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: Admin.divider,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Admin.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: { fontSize: 12, fontWeight: "800", color: Admin.textMuted },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberName: { fontSize: 13.5, fontWeight: "700", color: Admin.text },
  blockedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: Admin.redSoft,
  },
  blockedTagText: { fontSize: 9.5, fontWeight: "800", color: Admin.red },
  memberMeta: { fontSize: 11.5, color: Admin.textMuted, marginTop: 2 },
  memberActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  bizRow: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 16 },
  bizLogo: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFFFFF" },
  bizGrid: { flexDirection: "row", flexWrap: "wrap", gap: 22 },
  bizItem: { minWidth: 120 },
  bizLabel: { fontSize: 11, color: Admin.textFaint, fontWeight: "700", letterSpacing: 0.4 },
  bizValue: { fontSize: 13, color: Admin.text, fontWeight: "600", marginTop: 4 },

  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyText: { fontSize: 12.5, color: Admin.textMuted, textAlign: "center", maxWidth: 260 },

  formHint: { fontSize: 11.5, color: Admin.textMuted, lineHeight: 17, marginBottom: 6 },

  codeDisplay: {
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    backgroundColor: Admin.redSoft,
    borderWidth: 1,
    borderColor: "#F7C9C9",
    marginBottom: 16,
  },
  codeDisplayLabel: { fontSize: 10, fontWeight: "800", color: Admin.red, letterSpacing: 1 },
  codeDisplayValue: {
    fontSize: 40,
    fontWeight: "800",
    color: Admin.red,
    letterSpacing: 10,
    marginTop: 8,
  },
  codeDisplayHint: { fontSize: 11.5, color: Admin.textMuted, marginTop: 8, textAlign: "center" },

  messageBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#FBFCFD",
    borderWidth: 1,
    borderColor: Admin.border,
    marginBottom: 14,
  },
  messageText: { fontSize: 12, color: Admin.textMuted, lineHeight: 18 },
  inviteActions: { flexDirection: "row", gap: 10, marginBottom: 6 },

  staffNote: { flexDirection: "row", alignItems: "center", gap: 12 },
  staffNoteText: { flex: 1, fontSize: 12.5, color: Admin.textMuted, lineHeight: 18 },
});
